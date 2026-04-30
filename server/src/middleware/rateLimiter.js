import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Çok fazla giriş denemesi, lütfen daha sonra tekrar deneyin.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const accountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
