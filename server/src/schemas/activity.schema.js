import Joi from 'joi';

const tr = {
  'string.base': '{{#label}} metin olmalıdır',
  'string.empty': '{{#label}} boş bırakılamaz',
  'string.min': '{{#label}} en az {{#limit}} karakter olmalıdır',
  'string.max': '{{#label}} en fazla {{#limit}} karakter olabilir',
  'any.required': '{{#label}} zorunludur',
  'any.only': '{{#label}} geçersiz değer',
  'string.guid': '{{#label}} geçersiz ID formatı',
  'date.base': '{{#label}} geçerli bir tarih olmalıdır',
  'object.min': 'En az bir alan güncellenmelidir',
};

const TYPES = ['call', 'email', 'meeting', 'note', 'offer'];

export const createActivitySchema = Joi.object({
  customerId: Joi.string().uuid().required().label('Müşteri'),
  type: Joi.string().valid(...TYPES).required().label('Tür'),
  title: Joi.string().min(1).max(200).required().label('Başlık'),
  description: Joi.string().max(2000).allow('', null).optional().label('Açıklama'),
  happenedAt: Joi.date().iso().optional().label('Tarih'),
}).messages(tr);

export const updateActivitySchema = Joi.object({
  type: Joi.string().valid(...TYPES).label('Tür'),
  title: Joi.string().min(1).max(200).label('Başlık'),
  description: Joi.string().max(2000).allow('', null).label('Açıklama'),
  happenedAt: Joi.date().iso().label('Tarih'),
}).min(1).messages(tr);

export const listActivitiesSchema = Joi.object({
  customerId: Joi.string().uuid().optional().label('Müşteri'),
  type: Joi.string().valid(...TYPES).optional().label('Tür'),
  limit: Joi.number().integer().min(1).max(100).default(50).label('Limit'),
  offset: Joi.number().integer().min(0).default(0).label('Başlangıç'),
}).messages(tr);
