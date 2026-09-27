import { Router } from 'express';
import { DbStructure } from '../../core/store.js';
import { authController } from './auth.js';
import { offersController } from './offers.js';
import { favoritesController } from './favorites.js';
import { commentsController } from './comments.js';

export const travelInComfortRoutes = (jsonRouter: any) => {
  const router = Router();
  const PROJECT = 'travel-in-comfort';
  const db = jsonRouter.db;

  const getProjectState = () => (db.getState() as DbStructure)[PROJECT] || {};

  const auth = (req: any, res: any, next: any) => {
    const token = req.headers['x-token'];
    const state = getProjectState();

    const loginData = state.login as any;

    if (
      !loginData ||
      Array.isArray(loginData) ||
      loginData.token !== token
    ) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
  };

  router.use('/', authController(db, PROJECT, getProjectState));
  router.use('/offers', offersController(db, PROJECT, getProjectState));
  router.use('/favorite', favoritesController(db, PROJECT, getProjectState, auth));
  router.use('/comments', commentsController(db, PROJECT, getProjectState, auth));

  return router;
};