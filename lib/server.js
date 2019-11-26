import cors from 'cors'

import device from 'express-device'

import express from 'express'
import bunyan from 'bunyan'

import {
  createDbService,
  MetadataModel,
  UserModel,
  LinkModel
} from './db'

import {
  createAuthService,
  createUserService,
  createLinkService
} from './services'

import { createPassportUtility } from './utils'
import createRouter from './router'

export default ({
  log = bunyan({ name: 'LINKr API', noop: true }),
  secret,
  mongo,
  apiBase,
  linksBaseUrl,
  SHORT_CODE_LENGTH
} = {}) => {
  const app = express()
  if (!secret) throw new Error('App Secret Missing!!!')

  // Initialize database
  const dbService = createDbService({ log, mongo })
  dbService.init()

  // Provision dependencies
  const userService = createUserService({ log, secret, apiBase, UserModel })
  const passportUtil = createPassportUtility({ userService, log })
  const authService = createAuthService({ userService, passportUtil, secret, log })
  const linkService = createLinkService({ log, LinkModel, MetadataModel, SHORT_CODE_LENGTH, linksBaseUrl })

  const router = createRouter({
    SHORT_CODE_LENGTH,
    linksBaseUrl,
    userService,
    authService,
    linkService,
    log
  })

  app.use(cors())
  app.use(device.capture())
  app.use('/', router)

  const onStart = async () => {
    log.info('On Start: ...')
  }

  return {
    server: app,
    onStart
  }
}
