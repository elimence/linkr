import { Router } from 'express'
import bodyParser from 'body-parser'
import bunyan from 'bunyan'

export default ({
  userService,
  authService,
  log = bunyan({ noop: true, name: 'default' })
}) => {
  const router = Router({mergeParams: true})
  router.use(bodyParser.json())

  router.get('/', /* authService.isAdmin(), */ async (req, res, next) => {
    try {
      const users = await userService.getAllUsers()
      res.json({ users })
    } catch (e) {
      log.error(e)
      next(e)
    }
  })

  router.get('/:userId', authService.isAuthenticated(), async (req, res, next) => {
    try {
      const { userId } = req.params
      const user = await userService.getById(userId)
      res.json({ user })
    } catch (e) {
      log.error(e)
      next(e)
    }
  })

  router.post('/', async (req, res, next) => {
    try {
      const newUserData = req.body
      const token = await userService.createUser(newUserData)
      res.json({ ...token })
    } catch (e) {
      log.error(e)
      next(e)
    }
  })

  router.patch('/:userId', authService.isAuthenticated(), async (req, res, next) => {
    try {
      const userId = req.user._id
      const updates = req.body

      console.log(req.user)

      delete updates.role
      delete updates.resetPasswordToken
      delete updates.createdAt
      delete updates.updatedAt
      delete updates.salt

      const user = await userService.updateUser({ userId, updates })
      res.json({ user })
    } catch (e) {
      log.error(e)
      next(e)
    }
  })

  return router
}
