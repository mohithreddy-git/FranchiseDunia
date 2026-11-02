const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

const optionalAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    } catch {
      // Token expired or invalid, continue as unauthenticated guest
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = optionalAuth;
