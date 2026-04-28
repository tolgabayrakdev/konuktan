import { Router } from 'express';
import { AccountController } from '../controller/account.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { updatePasswordSchema } from '../schemas/account.schema.js';
import { accountLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const accountController = new AccountController();

router.use(accountLimiter);

router.get('/me', authenticate, accountController.getProfile);
router.patch('/me', authenticate, accountController.updateProfile);
router.patch(
  '/me/password',
  authenticate,
  validate(updatePasswordSchema),
  accountController.updatePassword
);
router.delete('/me', authenticate, accountController.deleteAccount);

export default router;
