import R from 'ramda'
import { Router } from 'express'
import bodyParser from 'body-parser'
import bunyan from 'bunyan'
import device from 'express-device';
import { unauthorized } from 'boom'

export default ({
  authService,
  linkService,
  log = bunyan({ noop: true })
}) => {
  const router = Router({mergeParams: true})
  router.use(bodyParser.json())

  router.get('/api/v1/links', authService.isAuthenticated(), async (req, res, next) => {
    try {
      const userId = req.user._id;
      const links = await linkService.find({ userId });

      res.json({ links });
    } catch (e) {
      log.error(e);
      next(e);
    }
  });

  router.get('/api/v1/links/:linkId', authService.isAuthenticated(), async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { linkId } = req.params;

      const link = await linkService.findById({ userId, linkId });

      res.json({ link });
    } catch (e) {
      log.error(e);
      next(e);
    }
  });

  router.post('/api/v1/links', authService.isAuthenticated(), async (req, res, next) => {
    try {
      const data = req.body;
      const userId = req.user._id;

      log.info('Shorten ...', { data });
      const link = await linkService.create({ ...data, userId });

      res.json({ link });
    } catch (e) {
      log.error(e);
      next(e);
    }
  });

  router.get('/:code', device.capture(), async (req, res, next) => {
    try {
      const { code } = req.params;

      const { _id, url } = await linkService.findByCode({ code });
      linkService.updateLinkMetaData({ linkId: _id, code, req }); // fire and forget

      res.set('location', url);
      res.status(301).send();
    } catch (e) {
      log.error(e)
      next(e)
    }
  });

  return router
}
