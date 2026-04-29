import Joi from 'joi';

const STAGES = ['todo', 'in_progress', 'done', 'failed'];

export const createProcessSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).allow('', null).optional(),
  stage: Joi.string().valid(...STAGES).default('todo'),
});

export const updateProcessSchema = Joi.object({
  title: Joi.string().min(1).max(200),
  description: Joi.string().max(1000).allow('', null),
  stage: Joi.string().valid(...STAGES),
  position: Joi.number().integer().min(0),
}).min(1);
