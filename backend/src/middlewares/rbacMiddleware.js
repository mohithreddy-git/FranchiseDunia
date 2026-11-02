const ApiError = require('../utils/apiError');

/**
 * Role-Based Access Control Middleware
 * @param  {...string} allowedRoles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required before checking permissions.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access forbidden: Role '${req.user.role}' is not authorized to perform this operation.`
        )
      );
    }

    next();
  };
};

module.exports = authorize;
