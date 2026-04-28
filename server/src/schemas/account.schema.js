import Joi from 'joi';

export const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(6).required(),
  newPassword: Joi.string().min(6).required(),
}).messages({
  'any.required': '{{#label}} is required',
  'string.min': '{{#label}} must be at least {{#limit}} characters',
});
