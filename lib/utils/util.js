import bunyan from 'bunyan'
import validator from 'validator'

export class UtilService {
  constructor ({
    log = bunyan({})
  } = {}) {
    this.log = log.child({ service: 'util-service' })
  }

  notEmpty (value) {
    return !validator.isEmpty(value)
  }
}

export default options => new UtilService(options)
