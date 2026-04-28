import app from './app.js';
import env from './config/env.js';
import logger from './config/logger.js';
import { testConnection } from './config/db.js';

testConnection().then(() => {
  app.listen(env.PORT, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
});
