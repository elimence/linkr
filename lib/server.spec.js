import test from 'ava'

import createServer from './server'

test('creates a server', t => {
  const { server, onStart } = createServer({
    secret: 'shhh!',
    mongo: {
      'uri': 'mongodb://localhost/linkr-dev',
      'options': {}
    }
  })

  t.truthy(server, 'returns server')
  t.truthy(onStart, 'returns on start')
})
