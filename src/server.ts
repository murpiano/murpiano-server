import { createApp } from './app.js';
import { PORT, PUBLIC_URL } from './config.js';

createApp().listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running at: ${PUBLIC_URL}`);
});
