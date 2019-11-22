import bunyan from 'bunyan'

import passport from 'passport'
import passportLocal from 'passport-local'

// Passport Strategies
const LocalStrategy = passportLocal.Strategy

export class PassportUtil {
  constructor ({
    userService,
    log = bunyan.bunyan({ noop: true })
  } = {}) {
    this.userService = userService
    this.log = log.child({ service: 'passport-service' })
  }

  async localAuth (email, password, done) {
    try {
      const user = await this.userService.getByEmailForAuth(email)
      if (!user) {
        return done(null, false, {
          status_code: 401,
          message: 'Incorrect login credentials',
          description: 'Check email or password and try again'
        })
      }

      const isUserAuthenticated = user.authenticate(password)
      return isUserAuthenticated
        ? done(null, user)
        : done(null, false, {
          status_code: 401,
          message: 'Incorrect login credentials',
          description: 'Check email or password and try again'
        })
    } catch (err) {
      this.log.error(err)
      done(err)
    }
  }

  setupStrategies () {
    // setup local
    passport.use(new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      (email, password, done) => this.localAuth(email, password, done))
    )
  }
}

export default options => new PassportUtil(options)
