import mongoose from 'mongoose'
import bunyan from 'bunyan'
import bluebird from 'bluebird'

export class DatabaseService {
  constructor ({
    mongo,
    log = bunyan({ noop: true })
  } = {}) {
    this.config = mongo
    this.log = log.child({ service: 'database' })
  }

  async init () {
    mongoose.Promise = bluebird
    mongoose.connect(this.config.uri, { ...this.config.options })

    mongoose.connection.on('error', error => {
      this.log.error('Error connecting to database', error)
      process.exit(-1)
    })

    mongoose.connection.on('connected', () => {
      this.log.info('Mongoose default connection open to', this.config.uri)
    })

    mongoose.connection.on('disconnected', err => {
      this.log.info('Mongoose default connection disconnected', err)
    })
  }
}

export default options => new DatabaseService(options)
