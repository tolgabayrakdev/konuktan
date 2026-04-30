import Joi from 'joi';

const tr = {
  'string.base': '{{#label}} metin olmalıdır',
  'string.empty': '{{#label}} boş bırakılamaz',
  'string.min': '{{#label}} en az {{#limit}} karakter olmalıdır',
  'string.max': '{{#label}} en fazla {{#limit}} karakter olabilir',
  'string.email': 'Geçerli bir e-posta adresi giriniz',
  'string.length': '{{#label}} tam {{#limit}} karakter olmalıdır',
  'string.pattern.base': '{{#label}} geçersiz format',
  'any.required': '{{#label}} zorunludur',
  'any.only': '{{#label}} geçersiz değer',
  'object.missing': 'Kullanıcı ID veya e-posta girilmelidir',
};

export const registerSchema = Joi.object({
  email: Joi.string().email().required().label('E-posta'),
  password: Joi.string().min(6).max(128).required().label('Şifre'),
}).messages(tr);

export const loginSchema = Joi.object({
  email: Joi.string().email().required().label('E-posta'),
  password: Joi.string().required().label('Şifre'),
}).messages(tr);

export const verifySchema = Joi.object({
  email: Joi.string().email().required().label('E-posta'),
  code: Joi.string().length(6).pattern(/^\d{6}$/).required().label('Doğrulama kodu'),
}).messages(tr);

export const resendVerificationSchema = Joi.object({
  userId: Joi.string().uuid().label('Kullanıcı ID'),
  email: Joi.string().email().label('E-posta'),
}).or('userId', 'email').messages(tr);

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().label('E-posta'),
}).messages(tr);

export const resetPasswordSchema = Joi.object({
  token: Joi.string().length(64).required().label('Token'),
  newPassword: Joi.string().min(8).max(128).required().label('Yeni şifre'),
}).messages(tr);
