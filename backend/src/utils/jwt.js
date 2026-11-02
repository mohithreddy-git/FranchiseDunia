const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'franchisedunia_dev_access_secret_key_random_string_32_bytes';
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'franchisedunia_dev_refresh_secret_key_random_string_32_bytes';

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateTokens = (user, existingSessionId = null) => {
  const sessionId = existingSessionId || crypto.randomUUID();

  const accessPayload = {
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
    sessionId,
  };

  const refreshPayload = {
    id: user._id,
    sessionId,
  };

  const accessToken = jwt.sign(accessPayload, ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

  const refreshToken = jwt.sign(refreshPayload, REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken, sessionId };
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
    path: '/',
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

  res.clearCookie('accessToken', {
    ...cookieBaseOptions,
    path: '/',
  });
  res.clearCookie('refreshToken', {
    ...cookieBaseOptions,
    path: '/api/v1/auth',
  });
};

module.exports = {
  hashToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
};
