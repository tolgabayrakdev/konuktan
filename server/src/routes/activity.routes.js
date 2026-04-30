import { Router } from 'express';
import { ActivityController } from '../controller/activity.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createActivitySchema, updateActivitySchema } from '../schemas/activity.schema.js';

const router = Router();
const activityController = new ActivityController();

router.use(authenticate);

router.get('/', activityController.list);
router.post('/', validate(createActivitySchema), activityController.create);
router.patch('/:id', validate(updateActivitySchema), activityController.update);
router.delete('/:id', activityController.delete);

export default router;
