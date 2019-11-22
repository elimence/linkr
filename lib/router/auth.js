import { Router } from 'express'
import bodyParser from 'body-parser'
import bunyan from 'bunyan'

import passport from 'passport'

export default ({
  userService,
  log = bunyan({ noop: true })
}) => {
  const router = Router({mergeParams: true})
  router.use(bodyParser.json())

  router.post('/local', async (req, res, next) => {
    try {
      passport.authenticate('local', (err, user, info) => {
        const error = err || info
        if (error) {
          return res.status(401).json(error)
        }
        if (!user) {
          return res.status(404).json({
            message: 'missing user data',
            description: 'Something went wrong, please try again.'
          })
        }

        var token = userService.createToken(user)
        res.json({ ...token })
      })(req, res, next)
    } catch (e) {
      log.error(e)
      next(e)
    }
  })

  return router
}
