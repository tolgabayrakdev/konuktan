import Joi from 'joi';

export const createCustomerSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().max(255).allow('', null).optional(),
  phone: Joi.string().custom((value, helpers) => {
    if (!value) return value;
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 11) return helpers.error('any.invalid');
    return value;
  }).allow('', null).optional().messages({ 'any.invalid': 'Telefon numarası 11 haneli olmalıdır' }),
  company: Joi.string().max(150).allow('', null).optional(),
  city: Joi.string().max(100).allow('', null).optional(),
  status: Joi.string().valid('active', 'inactive', 'lead').default('lead'),
  notes: Joi.string().max(1000).allow('', null).optional(),
});

export const updateCustomerSchema = Joi.object({
  firstName: Joi.string().min(1).max(100),
  lastName: Joi.string().min(1).max(100),
  email: Joi.string().email().max(255).allow('', null),
  phone: Joi.string().custom((value, helpers) => {
    if (!value) return value;
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 11) return helpers.error('any.invalid');
    return value;
  }).allow('', null).messages({ 'any.invalid': 'Telefon numarası 11 haneli olmalıdır' }),
  company: Joi.string().max(150).allow('', null),
  city: Joi.string().max(100).allow('', null),
  status: Joi.string().valid('active', 'inactive', 'lead'),
  notes: Joi.string().max(1000).allow('', null),
}).min(1);

export const listCustomersSchema = Joi.object({
  search: Joi.string().max(100).allow('').optional(),
  status: Joi.string().valid('active', 'inactive', 'lead').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});
