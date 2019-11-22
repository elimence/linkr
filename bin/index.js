import 'source-map-support/register'

import fs from 'fs'
import path from 'path'
import Boom from 'boom'

import config from 'config'
import helmet from 'helmet'
import express from 'express'
import bunyan from 'bunyan'

import { createServer } from '../lib'
const log = bunyan({ name: 'LINKr - API' })

const createApp = ({ pkg, isProduction }) => {
  const serverConfig = config.get('server')

  const app = express()
  const { server, onStart } = createServer({
    ...serverConfig,
    pkg
  })

  app.use(helmet())
  app.use(server)

  app.use((err, req, res, next) => {
    log.error({ err, reqId: req.id }, 'Request: Fail')

    const error = new Boom(err)
    const status = error.output.statusCode

    res.status(status).send({
      error: {
        ...error.output.payload,
        data: error.data,
        status,
        stack: isProduction ? undefined: error.stack
      }
    })
  })

  return {
    app,
    onStart
  }
}

if (require.main === module) {
  const isProduction = process.env.NODE_ENV === 'production'
  const port = config.get('port')

  const pkg = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, config.get('package-json'))
  ))

  try {
    log.info('Initialize: Start')
    const { app, onStart } = createApp({ pkg, log, isProduction })
    onStart().then(() => {
      app.listen(port, () => {
        log.info(`🚀  Server: Listening on port ${port}`)
      })
    }).catch(err => {
      log.error({ err }, 'Server: Fail')
      process.exit(1)
    })
  } catch (err) {
    log.error('Initialize: Fail', { err })
    process.exit(1)
  }
}
