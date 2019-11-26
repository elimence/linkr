import test from 'ava'
import td from 'testdouble'
import { UserService } from './user.service'

test.beforeEach(t => {
  t.context.user = {
    id: '123',
    email: 'd.jones@mail.com',
    fullName: 'Davey Jones',
    password: 'what password'
  }

  t.context.UserModel = td.object('UserModel')

  td.when(t.context.UserModel.findOne({ email: t.context.user.email })).thenResolve(t.context.user)
  td.when(t.context.UserModel.find()).thenResolve([t.context.user])

  t.context.userService = new UserService({
    secret: 'sshhhhh!',
    apiBase: 'http://base.com',
    UserModel: t.context.UserModel
  })
})

test('checks token creation', async t => {
  const token = t.context.userService.createToken(t.context.user)
  t.truthy(token, 'Token generation failed')
})

test('checks that userService returns a list of all users', async t => {
  const users = await t.context.userService.getAllUsers()
  t.truthy(users.length > 0)
})
