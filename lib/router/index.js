import bunyan from 'bunyan';
import createAuthRouter from './auth';
import createUserRouter from './user';
import createLinkRouter from './link';
import { Router } from 'express';

export default ({
  linksBaseUrl,
  authService,
  userService,
  linkService,
  log = bunyan({ noop: true })
}) => {
  const router = Router({ mergeParams: true })

  router.use('/auth', createAuthRouter({
    authService,
    userService,
    log: log.child({ router: 'auth-router' })
  }));

  router.use('/users', createUserRouter({
    authService,
    userService,
    log: log.child({ router: 'user-router' })
  }));

  router.use('/', createLinkRouter({
    linksBaseUrl,
    authService,
    userService,
    linkService,
    log: log.child({ router: 'link-router' })
  }));

  return router;
}
