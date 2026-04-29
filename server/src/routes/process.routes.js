import { Router } from 'express';
import { ProcessController } from '../controller/process.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createProcessSchema, updateProcessSchema } from '../schemas/process.schema.js';

const router = Router();
const processController = new ProcessController();

router.use(authenticate);

router.get('/', processController.list);
router.post('/', validate(createProcessSchema), processController.create);
router.patch('/:id', validate(updateProcessSchema), processController.update);
router.delete('/:id', processController.delete);

export default router;
