import test from 'ava'

import createServer from './server'

test('creates a server', t => {
  const { server, onStart, healthMonitor } = createServer()
  t.truthy(server, 'returns server')
  t.truthy(onStart, 'returns on start')
  t.truthy(healthMonitor, 'returns health monitor')
})
