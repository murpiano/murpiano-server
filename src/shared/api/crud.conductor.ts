import { Router } from 'express';
import { DbStructure } from '../types/index.js';
import {saveToDisk} from "../db/index.js";

export interface JsonRouter extends Router {
  db: {

    getState: () => DbStructure;
    setState: (state: DbStructure) => void;
  };
}

export const crudConductor = (server: any, router: any) => {
  const jsonRouter = router as JsonRouter;

  server.use((req: any, res: any, next: any) => {
    const pathParts = req.path.split('/').filter(Boolean);

    if (pathParts.length >= 2) {
      const [project, resource, id] = pathParts;
      const db = jsonRouter.db;
      const state = db.getState();

      if (state[project] && state[project][resource]) {
        const collection = state[project][resource];

        if (req.method === 'GET') {
          if (id) {
            const item = collection.find(item => item.id === id);
            return item ? res.jsonp(item) : res.status(404).send('Not Found');
          }
          return res.jsonp(collection);
        }

        if (req.method === 'POST') {
          const newItem = {
            ...req.body,
            id: req.body.id || crypto.randomUUID()
          };
          collection.push(newItem);
          db.setState(state);
          saveToDisk(project, resource, collection);
          return res.status(201).json(newItem);
        }

        if ((req.method === 'PUT' || req.method === 'PATCH') && id) {
          const index = collection.findIndex(i => i.id === id);
          if (index !== -1) {
            collection[index] = {...collection[index], ...req.body, id};
            saveToDisk(project, resource, collection);
            return res.jsonp(collection[index]);
          }
        }

        if (req.method === 'DELETE' && id) {
          const filtered = collection.filter(i => i.id !== id);
          if (filtered.length < collection.length) {
            state[project][resource] = filtered;
            saveToDisk(project, resource, filtered);
            return res.status(204).send();
          }
        }
      }
    }
    next();
  })
}