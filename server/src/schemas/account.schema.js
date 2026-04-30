import Joi from 'joi';

const tr = {
  'string.base': '{{#label}} metin olmalıdır',
  'string.empty': '{{#label}} boş bırakılamaz',
  'string.min': '{{#label}} en az {{#limit}} karakter olmalıdır',
  'string.max': '{{#label}} en fazla {{#limit}} karakter olabilir',
  'any.required': '{{#label}} zorunludur',
};

export const updateProfileSchema = Joi.object({
  email: Joi.string().email().max(255).label('E-posta'),
}).min(1).messages({
  ...tr,
  'string.email': 'Geçerli bir e-posta adresi giriniz',
  'object.min': 'En az bir alan güncellenmelidir',
});

export const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(6).required().label('Mevcut şifre'),
  newPassword: Joi.string().min(8).max(128).required().label('Yeni şifre'),
}).messages(tr);
