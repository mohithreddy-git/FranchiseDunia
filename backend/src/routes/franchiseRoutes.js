const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const {
  getFranchises,
  getFranchiseBySlug,
  createFranchise,
  updateFranchise,
  deleteFranchise,
  downloadBrochure,
  getBrochureAnalytics,
} = require('../controllers/franchiseController');

const authenticate = require('../middlewares/authMiddleware');
const optionalAuth = require('../middlewares/optionalAuth');
const authorize = require('../middlewares/rbacMiddleware');
const validate = require('../middlewares/validate');
const {
  createFranchiseSchema,
  updateFranchiseSchema,
} = require('../validations/franchiseValidation');

// Brochure rate limiter: keyed by IP
const brochureLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many brochure downloads requested from this IP. Please try again later.',
  },
});

// Public Routes (with optional auth to attach isSaved & allow owner draft previews)
router.get('/', optionalAuth, getFranchises);
router.get('/:slug/brochure', brochureLimiter, optionalAuth, downloadBrochure);
router.get('/:id/brochure-analytics', authenticate, getBrochureAnalytics);
router.get('/:slug', optionalAuth, getFranchiseBySlug);

// Protected Routes (Brand Owners and Admins)
router.post(
  '/',
  authenticate,
  authorize('brand_owner', 'admin'),
  validate(createFranchiseSchema),
  createFranchise
);

router.put(
  '/:id',
  authenticate,
  authorize('brand_owner', 'admin'),
  validate(updateFranchiseSchema),
  updateFranchise
);

router.delete('/:id', authenticate, authorize('brand_owner', 'admin'), deleteFranchise);

module.exports = router;
