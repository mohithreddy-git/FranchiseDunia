const { ZodError } = require('zod');
const ApiError = require('../utils/apiError');

/**
 * Middleware factory for Zod validation on incoming requests
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new ApiError(400, 'Request validation failed', errors));
      }
      next(err);
    }
  };
};

module.exports = validate;
