const User = require('../models/User');
const {
  generateTokens,
  setAuthCookies,
  clearAuthCookies,
  verifyRefreshToken,
} = require('../utils/jwt');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// Register a new user (Strictly non-admin roles only)
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, city, company } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError(409, 'An account with this email address already exists.'));
    }

    const user = new User({
      name,
      email,
      password,
      role,
      phone,
      city,
      company,
    });

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshTokens = [{ token: refreshToken, createdAt: new Date() }];
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      city: user.city,
      company: user.company,
      isVerified: user.isVerified,
    };

    return res
      .status(201)
      .json(new ApiResponse(201, { user: safeUser, accessToken }, 'Registration successful'));
  } catch (err) {
    next(err);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Keep up to 5 most recent refresh tokens for rotation
    const activeTokens = (user.refreshTokens || []).slice(-4);
    activeTokens.push({ token: refreshToken, createdAt: new Date() });
    user.refreshTokens = activeTokens;
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      city: user.city,
      company: user.company,
      isVerified: user.isVerified,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, { user: safeUser, accessToken }, 'Login successful'));
  } catch (err) {
    next(err);
  }
};

// Refresh token with rotation
const refreshTokenHandler = async (req, res, next) => {
  try {
    const oldRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!oldRefreshToken) {
      return next(new ApiError(401, 'Refresh token not found. Please log in again.'));
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(oldRefreshToken);
    } catch (err) {
      clearAuthCookies(res);
      return next(new ApiError(401, 'Expired or invalid refresh token.'));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      clearAuthCookies(res);
      return next(new ApiError(401, 'User account no longer exists.'));
    }

    // Verify token exists in user's active rotation list
    const tokenIndex = (user.refreshTokens || []).findIndex((t) => t.token === oldRefreshToken);
    if (tokenIndex === -1) {
      // Token reuse anomaly detected! Revoke all tokens for safety
      user.refreshTokens = [];
      await user.save();
      clearAuthCookies(res);
      return next(new ApiError(403, 'Session compromised or already rotated. Please log in again.'));
    }

    // Rotate tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Remove old token and append new token
    user.refreshTokens.splice(tokenIndex, 1);
    user.refreshTokens.push({ token: newRefreshToken, createdAt: new Date() });
    await user.save();

    setAuthCookies(res, accessToken, newRefreshToken);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          accessToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        'Token refreshed successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// Logout user
const logout = async (req, res, next) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (incomingRefreshToken && req.user) {
      req.user.refreshTokens = (req.user.refreshTokens || []).filter(
        (t) => t.token !== incomingRefreshToken
      );
      await req.user.save();
    }

    clearAuthCookies(res);

    return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (err) {
    next(err);
  }
};

// Get current user profile (/me)
const getMe = async (req, res) => {
  const safeUser = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    phone: req.user.phone,
    city: req.user.city,
    company: req.user.company,
    isVerified: req.user.isVerified,
  };

  return res.status(200).json(new ApiResponse(200, { user: safeUser }, 'User profile retrieved'));
};

// Demo Login endpoint - ONLY ACTIVE WHEN ENABLE_DEMO_MODE=true
const demoLogin = async (req, res, next) => {
  try {
    const isDemoEnabled = process.env.ENABLE_DEMO_MODE === 'true';
    if (!isDemoEnabled) {
      return next(new ApiError(403, 'Demo login is disabled in this environment.'));
    }

    const { role } = req.body;
    let user = await User.findOne({ role, email: new RegExp(`demo_${role}@franchisedunia\\.in$`, 'i') });

    // Fallback: search for any user with that role
    if (!user) {
      user = await User.findOne({ role });
    }

    if (!user) {
      return next(new ApiError(404, `No demo account found for role: ${role}. Please seed the database.`));
    }

    const { accessToken, refreshToken } = generateTokens(user);
    const activeTokens = (user.refreshTokens || []).slice(-4);
    activeTokens.push({ token: refreshToken, createdAt: new Date() });
    user.refreshTokens = activeTokens;
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      city: user.city,
      company: user.company,
      isVerified: user.isVerified,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, { user: safeUser, accessToken }, `Logged in as demo ${role}`));
  } catch (err) {
    next(err);
  }
};

// Check if demo mode is enabled on the server
const getDemoStatus = async (req, res) => {
  const enabled = process.env.ENABLE_DEMO_MODE === 'true';
  return res.status(200).json(new ApiResponse(200, { demoModeEnabled: enabled }));
};

module.exports = {
  register,
  login,
  refreshTokenHandler,
  logout,
  getMe,
  demoLogin,
  getDemoStatus,
};
