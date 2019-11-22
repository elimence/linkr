import path from 'path';
import cors from 'cors';

import express from 'express';
import bunyan from 'bunyan';

import {
  createDbService,
  UserModel,
  LinkModel
} from './db';

import {
  createAuthService,
  createUserService,
  createLinkService
} from './services';

import { createPassportUtility } from './utils';
import createRouter from './router';

export default ({
  log = bunyan({ name: 'Blockchain Webclient', noop: true }),
  pkg = {},
  secret,
  mdSecret,
  mongo,
  apiBase
} = {}) => {
  const app = express()
  if (!secret) throw new Error('App Secret Missing!!!')

  // Initialize database
  const dbService = createDbService({ log, mongo })
  dbService.init()

  // Provision dependencies
  const userService = createUserService({ log, secret, apiBase, UserModel });
  const passportUtil = createPassportUtility({ userService, log });
  const authService = createAuthService({ userService, passportUtil, secret, log });
  const linkService = createLinkService({ log, LinkModel })

  const router = createRouter({
    blockChainService,
    userService,
    authService,
    linkService,
    log
  });

  app.use(cors())
  app.get('/', (req, res, next) => { res.json(pkg) })
  app.use('/api/v1', router)

  const onStart = async () => {}

  return {
    server: app,
    onStart
  }
}
