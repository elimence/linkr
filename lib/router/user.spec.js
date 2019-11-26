import test from 'ava'
import Boom from 'boom'
import td from 'testdouble'
import request from 'supertest'
import express from 'express'
import bodyParser from 'body-parser'
import createUserRouter from './user'

test.beforeEach(t => {
  t.context.token = 'token'
  t.context.user = {
    id: '123',
    email: 'd.jones@mail.com',
    fullName: 'Davey Jones',
    password: 'what password'
  }

  const userService = td.object('UserService')
  t.context.userService = userService

  td.when(userService.getById(td.matchers.anything())).thenResolve(t.context.user)
  td.when(userService.validateToken(t.context.token)).thenResolve(t.context.user)
  td.when(userService.getAllUsers()).thenResolve([t.context.user])

  const authService = td.object('AuthService')

  td.when(authService.isAuthenticated()).thenReturn(async (req, res, next) => {
    const decodedUser = await userService.validateToken(req.headers.authorization)
    if (decodedUser) {
      req.user = decodedUser
      next()
    } else {
      next(Boom.unauthorized('Invalid token', 'sample', {access_token: 'valid token here'}))
    }
  })

  const app = express()

  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())

  app.use('/users', createUserRouter({
    userService,
    authService
  }))

  t.context.app = app
  app.use((err, req, res, next) => {
    return res.status(err.status || 500).json({error: err.message || err})
  })
})

test('returns all users', async t => {
  const res = await request(t.context.app)
    .get('/users')
    .set('Authorization', t.context.token)
    .set('Accept', 'application/json')

  t.is(res.status, 200)
  t.deepEqual(res.body.users[0], t.context.user)
  t.true(res.body.users.length > 0)
})

test('returns user by id', async t => {
  const res = await request(t.context.app)
    .get('/users/123')
    .set('Authorization', t.context.token)
    .set('Accept', 'application/json')

  t.is(res.status, 200)
  t.deepEqual(res.body.user, t.context.user)
})
