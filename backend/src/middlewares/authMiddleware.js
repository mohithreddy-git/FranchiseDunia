const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Prioritize httpOnly cookie
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new ApiError(401, 'Authentication required. No access token provided.'));
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return next(new ApiError(401, 'Invalid or expired access token. Please re-authenticate.'));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ApiError(401, 'User associated with this token no longer exists.'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
