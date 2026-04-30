import Joi from 'joi';

const tr = {
  'string.base': '{{#label}} metin olmalıdır',
  'string.empty': '{{#label}} boş bırakılamaz',
  'string.min': '{{#label}} en az {{#limit}} karakter olmalıdır',
  'string.max': '{{#label}} en fazla {{#limit}} karakter olabilir',
  'string.email': 'Geçerli bir e-posta adresi giriniz',
  'any.required': '{{#label}} zorunludur',
  'any.invalid': '{{#label}} geçersiz değer',
  'object.min': 'En az bir alan güncellenmelidir',
};

const phoneValidator = (value, helpers) => {
  if (!value) return value;
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) return helpers.error('any.invalid');
  return value;
};

export const createCustomerSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required().label('Ad'),
  lastName: Joi.string().min(1).max(100).required().label('Soyad'),
  email: Joi.string().email().max(255).allow('', null).optional().label('E-posta'),
  phone: Joi.string().custom(phoneValidator).allow('', null).optional().label('Telefon')
    .messages({ 'any.invalid': 'Telefon numarası 11 haneli olmalıdır' }),
  company: Joi.string().max(150).allow('', null).optional().label('Şirket'),
  city: Joi.string().max(100).allow('', null).optional().label('Şehir'),
  status: Joi.string().valid('active', 'inactive', 'lead').default('lead').label('Durum'),
  notes: Joi.string().max(1000).allow('', null).optional().label('Notlar'),
}).messages(tr);

export const updateCustomerSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).label('Ad'),
  lastName: Joi.string().min(1).max(100).label('Soyad'),
  email: Joi.string().email().max(255).allow('', null).label('E-posta'),
  phone: Joi.string().custom(phoneValidator).allow('', null).label('Telefon')
    .messages({ 'any.invalid': 'Telefon numarası 11 haneli olmalıdır' }),
  company: Joi.string().max(150).allow('', null).label('Şirket'),
  city: Joi.string().max(100).allow('', null).label('Şehir'),
  status: Joi.string().valid('active', 'inactive', 'lead').label('Durum'),
  notes: Joi.string().max(1000).allow('', null).label('Notlar'),
}).min(1).messages(tr);

export const listCustomersSchema = Joi.object({
  search: Joi.string().max(100).allow('').optional().label('Arama'),
  status: Joi.string().valid('active', 'inactive', 'lead').optional().label('Durum'),
  page: Joi.number().integer().min(1).default(1).label('Sayfa'),
  limit: Joi.number().integer().min(1).max(100).default(50).label('Limit'),
}).messages(tr);
