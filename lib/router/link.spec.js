import test from 'ava'
import Boom from 'boom'
import td from 'testdouble'
import request from 'supertest'
import express from 'express'
import bodyParser from 'body-parser'
import createLinkRouter from './link'

test.beforeEach(t => {
  t.context.token = 'token'
  t.context.link = {
    id: '123',
    url: 'http://www.paysail.co',
    shortUrl: 'https://linkr.page/Qx9-bn'
  }

  t.context.user = {
    id: '123',
    email: 'd.jones@mail.com',
    fullName: 'Davey Jones',
    password: 'what password'
  }

  const authService = td.object('AuthService')
  const linkService = td.object('LinkService')
  const userService = td.object('UserService')

  t.context.linkService = linkService

  td.when(linkService.create(td.matchers.anything())).thenResolve(t.context.link)
  td.when(linkService.findByCode(td.matchers.anything())).thenResolve({
    _id: t.context.link.id,
    url: t.context.link.url
  })
  td.when(userService.validateToken(t.context.token)).thenResolve(t.context.user)

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

  app.use('/', createLinkRouter({
    authService,
    linkService
  }))

  t.context.app = app

  app.use((err, req, res, next) => {
    return res.status(err.status || 500).json({error: err.message || err})
  })
})

test('check that link is created successfully', async t => {
  const res = await request(t.context.app)
    .post('/api/v1/links')
    .set('Authorization', t.context.token)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send({ url: t.context.link.url })

  t.is(res.status, 200)
  t.deepEqual(res.body.link, t.context.link)
})

test('successfully redirects to target url', async t => {
  const res = await request(t.context.app)
    .get('/Qx9-bn')
    .set('Accept', 'application/json')

  t.is(res.status, 301)
  t.true(res.headers.location === t.context.link.url)
})
