import logger from '../config/logger.js';

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.isOperational ? err.statusCode : 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${statusCode} - ${message}`, {
      stack: err.stack,
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${statusCode} - ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
