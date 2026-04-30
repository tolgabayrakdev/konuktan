import Joi from 'joi';

const tr = {
  'string.base': '{{#label}} metin olmalıdır',
  'string.empty': '{{#label}} boş bırakılamaz',
  'string.min': '{{#label}} en az {{#limit}} karakter olmalıdır',
  'string.max': '{{#label}} en fazla {{#limit}} karakter olabilir',
  'any.required': '{{#label}} zorunludur',
  'any.only': '{{#label}} geçersiz değer',
  'string.guid': '{{#label}} geçersiz ID formatı',
  'number.base': '{{#label}} sayı olmalıdır',
  'number.integer': '{{#label}} tam sayı olmalıdır',
  'number.min': '{{#label}} en az {{#limit}} olmalıdır',
  'object.min': 'En az bir alan güncellenmelidir',
};

const STAGES = ['todo', 'in_progress', 'done', 'failed'];

export const createProcessSchema = Joi.object({
  customerId: Joi.string().uuid().required().label('Müşteri'),
  title: Joi.string().min(1).max(200).required().label('Başlık'),
  description: Joi.string().max(1000).allow('', null).optional().label('Açıklama'),
  stage: Joi.string().valid(...STAGES).default('todo').label('Aşama'),
}).messages(tr);

export const updateProcessSchema = Joi.object({
  title: Joi.string().min(1).max(200).label('Başlık'),
  description: Joi.string().max(1000).allow('', null).label('Açıklama'),
  stage: Joi.string().valid(...STAGES).label('Aşama'),
  position: Joi.number().integer().min(0).label('Sıra'),
}).min(1).messages(tr);
