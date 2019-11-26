import R from 'ramda'
import uuid from 'uuid'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { createErrorResolver } from '../utils'
import bunyan from 'bunyan'
import {
  badRequest,
  boomify,
  unauthorized,
  notFound
} from 'boom'

const { ValidationError } = mongoose.Error
const errorResolver = createErrorResolver({})

export class UserService {
  constructor ({
    secret,
    apiBase,
    UserModel,
    reqId = uuid(),
    log = bunyan({ noop: true })
  } = {}) {
    this.secret = secret
    this.apiBase = apiBase
    this.UserModel = UserModel

    // 1 day   = 60 * 60 * 24 = 86, 400 seconds
    // 1 week  = 86400 * 7    = 604, 800 seconds
    // 1 month = 604800 * 4   = 2,419,200 seconds
    this.tokenExpiryDurations = {
      day:   (n = 1) => (n <= 0) ? 86400   : 86400   * n,

      week:  (n = 1) => (n <= 0) ? 604800  : 604800  * n,

      month: (n = 1) => (n <= 0) ? 2419200 : 2419200 * n
    }

    this.log = log.child({service: 'user-service', reqId})
  }

  async getAllUsers () {
    try {
      const users = await this.UserModel.find()
      return users
    } catch (e) {
      this.log.error(e)
      throw e
    }
  }

  async getByEmail (email) {
    try {
      const user = await this.UserModel.findOne({ email })
      return user
    } catch (e) {
      this.log.error(e)
      throw e
    }
  }

  async getByEmailForAuth (email) {
    try {
      const user = await this.UserModel
        .findOne({ email })
        .select('+password')
        .select('+salt')

      return user
    } catch (e) {
      this.log.error(e)
      throw e
    }
  }

  async getById (userId) {
    try {
      const user = await this.UserModel.findOne({ _id: userId })
      if (user === null) {
        throw notFound(`user with id ${userId} was not found`)
      }

      return user
    } catch (e) {
      this.log.error(e)
      throw e
    }
  }

  async updateUser ({ userId, updates }) {
    try {
      if (await this.getById(userId) === null) throw notFound()

      const updated = await this.UserModel.findByIdAndUpdate(userId, updates, {
        new: true
      })

      return updated
    } catch (e) {
      this.log.error(e)
      throw e
    }
  }


  async createUser (userData) {
    try {
      const newUser = new this.UserModel(userData)
      newUser.provider = 'local'

      const savedUser = await newUser.save()
      const token = this.createToken(savedUser)

      // verify user email and phone number
      // this.verifyService.sendVerificationTokens({ user: savedUser })

      return token
    } catch (e) {
      this.log.error(e)

      if (e instanceof ValidationError) {
        const { message, errors } = errorResolver.formatValidationError(e)
        throw badRequest(message, errors)
      }
      throw boomify(e)
    }
  }

  createToken (user) {
    const tNow = Math.floor(Date.now() / 1000)
    const tokenExpiryDate = Math.floor(tNow) + this.tokenExpiryDurations.month(3)

    this.log.info('user in createToken', user)

    const { token } = user;
    const sanitizedUser = R.pick(
      ['fullName', 'email', '_id'],
      user
    )

    const payload = JSON.stringify({
      iat: tNow,
      nbf: tNow,
      exp: tokenExpiryDate,
      ...token
    })

    try {
      const token = jwt.sign(payload, this.secret)
      return { user: sanitizedUser, token, tokenExpiryDate }
    } catch (e) {
      this.log.error(e)
      throw boomify(e)
    }
  }

  async validateToken (token) {
    try {
      const user = jwt.verify(token, this.secret)
      return { user, token }
    } catch (e) {
      this.log.error(e)
      throw unauthorized(e)
    }
  }
}

export default options => new UserService(options)
