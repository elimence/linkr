import uuid from 'uuid';
import nanoid from 'nanoid';

import mongoose from 'mongoose';
import { createErrorResolver } from '../utils';
import bunyan from 'bunyan';

import {
  badRequest,
  boomify,
  unauthorized,
  notFound
} from 'boom';

const { ValidationError } = mongoose.Error;
const errorResolver = createErrorResolver({});

export class LinkService {
  constructor ({
    LinkModel,
    MetadataModel,
    reqId = uuid(),
    SHORT_CODE_LENGTH,
    log = bunyan({ noop: true })
  } = {}) {
    this.model = LinkModel;
    this.MetadataModel = MetadataModel;

    this.SHORT_CODE_LENGTH = SHORT_CODE_LENGTH;
    this.log = log.child({ service: 'link-service', reqId });
  }

  async findById({ userId, linkId }) {
    try {
      const link = await this.model
        .findOne({ _id: linkId, user: userId })
        .populate('user', 'fullName email')
      ;

      if (link === null) {
        throw notFound(`link with id ${linkId} was not found`);
      }

      return link
    } catch (e) {
      this.log.error(e);
      throw e;
    }
  }

  async findByCode({ userId, code }) {
    try {
      const link = await this.model
        .findOne({ code, user: userId })
        .populate('user', 'fullName email')
      ;

      if (link === null) {
        throw notFound(`link with key ${code} was not found`);
      }

      return link
    } catch (e) {
      this.log.error(e);
      throw e;
    }
  }

  async find({ userId, options }) {
    try {
      const query = this.model.find({ user: userId });
      if (options.sort) query.sort(options.sort);

      const links = await query.populate('user', 'fullName email');

      const linksWithMeta = links.map(async link => {
        const meta = await this.getLinkMetaData({ linkId: link._id });

        return { ...link._doc, meta, ...{ pageViews: meta.length }};
      });

      return await Promise.all(linksWithMeta);
    } catch (e) {
      this.log.error(e);
      throw e;
    }
  }

  /**
   * create link entity
   *
   * @returns Object new entity
   */
  async create({ url, userId, brandedCode }) {
    const MAX_RETRIES = 5;
    let retryCount = 0;

    try {
      // consider generating longer short ids to avoid collisions
      const code = brandedCode || nanoid(this.SHORT_CODE_LENGTH);
      const entity = new this.model({
        url,
        code,
        user: userId
      });

      const savedEntity = await entity.save();
      return savedEntity;
    } catch (ex) {
      if ((e instanceof ValidationError) && retryCount < MAX_RETRIES) {
        retryCount = retryCount + 1;

        await this.create({
          url,
          userId,
          brandedCode: nanoid(this.SHORT_CODE_LENGTH)
        });
      } else {
        this.log.info('failed to shorten link', { retryCount }, ex);
        throw boomify(ex);
      }
    }
  }

  async updateLinkMetaData({ linkId, code, req }) {
    try {
      const { ip, ips, protocol, secure, xhr, type, name } = req;

      const entity = new this.MetadataModel({
        ip,
        ips,
        xhr,
        secure,
        protocol,
        link: linkId,
        deviceType: type,
        deviceName: name
      });

      // TODO: get location data for ip and save city

      return await entity.save();
    } catch (ex) {
      this.log.error(ex);
      throw boomify(ex);
    }
  }

  async getLinkMetaData({ linkId }) {
    try {
      const meta = await this.MetadataModel.find({ link: linkId });

      if (link === meta) {
        this.log.info(`No meta data found for link with ID ${linkId}`);
        return [];
      }

      return meta;
    } catch (e) {
      this.log.error(e);
      throw e;
    }
  }
}

export default options => new LinkService(options);
