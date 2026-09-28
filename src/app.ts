import jsonServer from 'json-server';
import express from 'express';
import { PUBLIC_DIR } from './config.js';
import { buildDatabase, DbStructure } from './core/store.js';
import { crudConductor } from './core/crud.js';
import { cloudpixRoutes } from './projects/cloudpix-platform/routes.js';
import { travelInComfortRoutes } from './projects/travel-in-comfort/routes.js';

export const createApp = () => {
  const server = jsonServer.create();
  const router = jsonServer.router(buildDatabase());

  server.use(jsonServer.defaults());
  server.use(jsonServer.bodyParser);
  server.use('/public', express.static(PUBLIC_DIR));

  // The root lists what the generic routes serve right now.
  server.get('/', (req, res) => {
    const state = router.db.getState() as DbStructure;
    const projects = Object.fromEntries(
      Object.entries(state).map(([project, resources]) => [
        project,
        Object.keys(resources).map((resource) => `/${project}/${resource}`),
      ]),
    );
    res.json({ projects });
  });

  // Project routers go first, so they win over the generic CRUD on the same path.
  server.use('/cloudpix-platform', cloudpixRoutes(router));
  server.use('/travel-in-comfort', travelInComfortRoutes(router));

  crudConductor(server, router as any);
  server.use(router);

  return server;
};
