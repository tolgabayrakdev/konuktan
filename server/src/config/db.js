import pg from 'pg';
import env from './env.js';
import logger from './logger.js';

const pool = new pg.Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error(`Unexpected error on idle client: ${err.message}`);
});

export const query = (text, params) => pool.query(text, params);

export const testConnection = async () => {
  try {
    const client = await pool.connect();
    client.release();
    logger.info('Database connected successfully');
  } catch (err) {
    logger.error(`Database connection failed: ${err.message}`);
  }
};

export default pool;
