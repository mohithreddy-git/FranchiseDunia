const ApiError = require('../utils/apiError');

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5001',
];

if (process.env.FRONTEND_URL) {
  DEFAULT_ALLOWED_ORIGINS.push(process.env.FRONTEND_URL);
}

/**
 * CSRF Protection Middleware
 * Verifies Origin and Referer headers against the CORS allow-list for state-modifying requests
 */
const csrfProtection = (req, res, next) => {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  const originHeader = req.headers.origin;
  const refererHeader = req.headers.referer;

  let requestOrigin = null;

  if (originHeader) {
    requestOrigin = originHeader.trim();
  } else if (refererHeader) {
    try {
      const url = new URL(refererHeader);
      requestOrigin = url.origin;
    } catch {
      // Malformed referer
      return next(new ApiError(403, 'CSRF validation failed: Malformed Referer header'));
    }
  }

  // If an Origin or Referer was provided by the client, it MUST match an allow-listed origin
  if (requestOrigin) {
    const isAllowed = DEFAULT_ALLOWED_ORIGINS.some(
      (allowed) => requestOrigin.toLowerCase() === allowed.toLowerCase()
    );

    if (!isAllowed) {
      return next(
        new ApiError(
          403,
          `CSRF validation failed: Request origin '${requestOrigin}' is not authorized.`
        )
      );
    }
  }

  next();
};

module.exports = csrfProtection;
