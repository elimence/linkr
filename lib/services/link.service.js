import uuid from 'uuid';
import nanoid from 'nanoid';
import request from 'request-promise';

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
    reqId = uuid(),
    log = bunyan({ noop: true })
  } = {}) {
    this.model = LinkModel;
    this.log = log.child({ service: 'link-service', reqId });
  }

  async findById({ userId, linkId }) {
    try {
      const link = await this.model
        .findOne({ _id: linkId, userId })
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
        .findOne({ userId, code })
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
      const query = this.model.find({ userId });
      if (options.sort) query.sort(options.sort);

      return await query.populate('user', 'fullName email');
    } catch (e) {
      this.log.error(e);
      throw e;
    }
  }

  /**
   * Shorten a url
   *
   * @returns String new url
   */
  async create({ url, userId, brandedCode }) {
    try {
      // consider generating longer short ids to avoid collisions
      const code = brandedCode || nanoid(6);
      const entity = new this.model({
        url,
        code,
        userId
      });

      const savedEntity = await entity.save();
      return savedEntity;
    } catch (ex) {
      this.log.info('failed to shorten link', ex);
      throw boomify(ex);
    }
  }
}

export default options => new LinkService(options);
