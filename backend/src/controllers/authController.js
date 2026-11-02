const User = require('../models/User');
const {
  hashToken,
  generateTokens,
  setAuthCookies,
  clearAuthCookies,
  verifyRefreshToken,
} = require('../utils/jwt');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// Register a new user (Strictly non-admin roles only; cookie-only auth)
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

    const { accessToken, refreshToken, sessionId } = generateTokens(user);
    user.sessions = [
      {
        sessionId,
        tokenHash: hashToken(refreshToken),
        previousTokenHash: null,
        createdAt: new Date(),
        lastUsedAt: new Date(),
      },
    ];
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

    // STRICT: Return user only. No accessToken/refreshToken in JSON body!
    return res
      .status(201)
      .json(new ApiResponse(201, { user: safeUser }, 'Registration successful'));
  } catch (err) {
    next(err);
  }
};

// Login user (cookie-only auth)
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

    const { accessToken, refreshToken, sessionId } = generateTokens(user);

    // Maintain up to 5 active sessions
    const activeSessions = (user.sessions || []).slice(-4);
    activeSessions.push({
      sessionId,
      tokenHash: hashToken(refreshToken),
      previousTokenHash: null,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    });
    user.sessions = activeSessions;
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

    // STRICT: Return user only. No accessToken in JSON body!
    return res
      .status(200)
      .json(new ApiResponse(200, { user: safeUser }, 'Login successful'));
  } catch (err) {
    next(err);
  }
};

// Refresh token with rotation & replay/reuse attack detection
const refreshTokenHandler = async (req, res, next) => {
  try {
    const oldRefreshToken = req.cookies?.refreshToken;

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

    const presentedHash = hashToken(oldRefreshToken);
    const session = (user.sessions || []).find((s) => s.sessionId === decoded.sessionId);

    if (!session) {
      clearAuthCookies(res);
      return next(new ApiError(401, 'Session not recognized. Please log in again.'));
    }

    // REUSE DETECTION: If an already-rotated token hash is presented, revoke that session immediately!
    if (session.previousTokenHash === presentedHash) {
      user.sessions = user.sessions.filter((s) => s.sessionId !== decoded.sessionId);
      await user.save();
      clearAuthCookies(res);
      return next(new ApiError(401, 'Refresh token reuse detected. Session revoked.'));
    }

    // Token must match current active tokenHash
    if (session.tokenHash !== presentedHash) {
      user.sessions = user.sessions.filter((s) => s.sessionId !== decoded.sessionId);
      await user.save();
      clearAuthCookies(res);
      return next(new ApiError(401, 'Token mismatch detected. Session revoked.'));
    }

    // Rotate: generate new tokens reusing the sessionId
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user, session.sessionId);

    // Update session: move current hash to previousTokenHash, set new hash
    session.previousTokenHash = presentedHash;
    session.tokenHash = hashToken(newRefreshToken);
    session.lastUsedAt = new Date();
    await user.save();

    setAuthCookies(res, accessToken, newRefreshToken);

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // STRICT: Return user only. No tokens in body!
    return res
      .status(200)
      .json(new ApiResponse(200, { user: safeUser }, 'Token refreshed successfully'));
  } catch (err) {
    next(err);
  }
};

// Logout user
const logout = async (req, res, next) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (incomingRefreshToken && req.user) {
      const tokenHash = hashToken(incomingRefreshToken);
      req.user.sessions = (req.user.sessions || []).filter((s) => s.tokenHash !== tokenHash);
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
    let user = await User.findOne({
      role,
      email: new RegExp(`demo_${role}@franchisedunia\\.in$`, 'i'),
    });

    if (!user) {
      user = await User.findOne({ role });
    }

    if (!user) {
      return next(
        new ApiError(404, `No demo account found for role: ${role}. Please seed the database.`)
      );
    }

    const { accessToken, refreshToken, sessionId } = generateTokens(user);
    const activeSessions = (user.sessions || []).slice(-4);
    activeSessions.push({
      sessionId,
      tokenHash: hashToken(refreshToken),
      previousTokenHash: null,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    });
    user.sessions = activeSessions;
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

    // STRICT: Return user only. No accessToken in JSON body!
    return res
      .status(200)
      .json(new ApiResponse(200, { user: safeUser }, `Logged in as demo ${role}`));
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
