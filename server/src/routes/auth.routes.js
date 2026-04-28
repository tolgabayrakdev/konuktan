import { Router } from 'express';
import { AuthController } from '../controller/auth.controller.js';
import { validate } from '../middleware/validation.js';
import {
  registerSchema,
  loginSchema,
  verifySchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const authController = new AuthController();

router.use(authLimiter);

router.post('/register', validate(registerSchema), authController.register);
router.post('/verify', validate(verifySchema), authController.verify);
router.post(
  '/resend-verification',
  validate(resendVerificationSchema),
  authController.resendVerificationCode
);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post('/logout', authenticate, authController.logout);

export default router;
