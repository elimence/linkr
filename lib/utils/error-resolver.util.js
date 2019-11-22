import bunyan from 'bunyan'
import util from 'util'

export class ErrorResolver {
  constructor ({
    log = bunyan({ name: 'url-shortener', noop: true })
  } = {}) {
    this.log = log.child({ service: 'util-service' })
  }

  formatValidationError (err) {
    const errors = []
    const message = err.message

    if (err.name !== 'ValidationError') return err
    Object.keys(err.errors).forEach(field => {
      const errorMessage = util.format(err.errors[field].message)
      errors.push(errorMessage)
    })

    return { errors, message }
  }
}

export default options => new ErrorResolver(options)
