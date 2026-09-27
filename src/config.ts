import path from 'path';

export const PORT = Number(process.env.PORT) || 3001;

// Render sets PORT, so its presence means the server runs there.
export const PUBLIC_URL = process.env.PORT
  ? 'https://murpiano-server.onrender.com'
  : `http://localhost:${PORT}`;

export const DATA_DIR = path.resolve('data');
export const PUBLIC_DIR = path.resolve('public');
