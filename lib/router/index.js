import bunyan from 'bunyan';
import createAuthRouter from './auth';
import createUserRouter from './user';
import createLinkRouter from './link';
import { Router } from 'express';

export default ({
  authService,
  userService,
  linkService,
  log = bunyan({ noop: true })
}) => {
  const router = Router({ mergeParams: true })

  router.use('/auth', createAuthRouter({
    authService,
    userService,
    log: log.child({ router: 'auth' })
  }));

  router.use('/users', createUserRouter({
    authService,
    userService,
    log: log.child({ router: 'users' })
  }));

  router.use('/', createLinkRouter({
    authService,
    userService,
    linkService,
    log: log.child({ router: 'links' })
  }));

  return router;
}
