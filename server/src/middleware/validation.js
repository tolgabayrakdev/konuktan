import { ValidationError } from '../exceptions/index.js';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const messages = error.details.map((d) => d.message).join(', ');
      return next(new ValidationError(messages));
    }

    next();
  };
};
