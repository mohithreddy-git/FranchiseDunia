const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'franchisedunia_dev_access_secret_key_random_string_32_bytes';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'franchisedunia_dev_refresh_secret_key_random_string_32_bytes';

const generateTokens = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const accessToken = jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

  const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';

  const cookieBaseOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
  };

  // 15-minute access token cookie
  res.cookie('accessToken', accessToken, {
    ...cookieBaseOptions,
    maxAge: 15 * 60 * 1000,
  });

  // 7-day refresh token cookie with path scoped to auth
  res.cookie('refreshToken', refreshToken, {
    ...cookieBaseOptions,
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearAuthCookies = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieBaseOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
  };

  res.clearCookie('accessToken', cookieBaseOptions);
  res.clearCookie('refreshToken', {
    ...cookieBaseOptions,
    path: '/api/v1/auth',
  });
};

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
};
