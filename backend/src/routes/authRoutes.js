const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  register,
  login,
  refreshTokenHandler,
  logout,
  getMe,
  demoLogin,
  getDemoStatus,
} = require('../controllers/authController');

const authenticate = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  registerSchema,
  loginSchema,
  demoLoginSchema,
} = require('../validations/authValidation');

// Stricter rate limiter for sensitive authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 authentication attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

// Demo authentication
router.get('/demo-status', getDemoStatus);
router.post('/demo-login', validate(demoLoginSchema), demoLogin);

module.exports = router;
