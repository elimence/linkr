import test from 'ava'
import td from 'testdouble'
import bunyan from 'bunyan'
import { LinkService } from './link.service'
import mongoose from './mongoose.mock'

test.beforeEach(t => {
  t.context.user = {
    id: '123',
    email: 'd.jones@mail.com',
    fullName: 'Davey Jones',
    password: 'what password'
  }

  const conn = mongoose.createConnection()

  const model = function (conn, schema, name) {
    const res = conn.models[name]
    return res || conn.model.bind(conn)(name, schema)
  }

  t.context.LinkModel = model(conn, new mongoose.Schema({ a: String }), 'LinkModel')
  t.context.MetadataModel = td.constructor(function () {})

  t.context.linkService = new LinkService({
    SHORT_CODE_LENGTH: 6,
    LinkModel: t.context.LinkModel,
    linksBaseUrl: 'http://base.com',
    MetadataModel: t.context.MetadataModel,
    log: bunyan({ noop: true, name: 'linkr' })
  })
})

test('check that links are shortened', async t => {
  const link = t.context.linkService.create({
    url: 'https://www.site.com',
    userId: t.context.user.id,
    brandedCode: 'LINKr'
  })

  t.truthy(link, 'Token generation failed')
})
