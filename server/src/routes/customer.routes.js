import { Router } from 'express';
import { CustomerController } from '../controller/customer.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createCustomerSchema, updateCustomerSchema } from '../schemas/customer.schema.js';

const router = Router();
const customerController = new CustomerController();

router.use(authenticate);

router.get('/', customerController.list);
router.get('/:id', customerController.getOne);
router.post('/', validate(createCustomerSchema), customerController.create);
router.patch('/:id', validate(updateCustomerSchema), customerController.update);
router.delete('/:id', customerController.delete);

export default router;
