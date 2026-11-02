const express = require('express');
const router = express.Router();

const {
  getBusinesses,
  getBusinessById,
  signNda,
  createBusiness,
  updateBusiness,
  deleteBusiness,
} = require('../controllers/businessController');

const authenticate = require('../middlewares/authMiddleware');
const optionalAuth = require('../middlewares/optionalAuth');
const authorize = require('../middlewares/rbacMiddleware');
const validate = require('../middlewares/validate');
const {
  createBusinessSchema,
  updateBusinessSchema,
  signNdaSchema,
} = require('../validations/businessValidation');

// Public listing & detail endpoints (with optional auth to check active NDA/owner state)
router.get('/', optionalAuth, getBusinesses);
router.get('/:id', optionalAuth, getBusinessById);

// Digital NDA execution (Authenticated investors / entrepreneurs)
router.post('/:id/nda', authenticate, validate(signNdaSchema), signNda);

// Seller listing management
router.post(
  '/',
  authenticate,
  authorize('business_seller', 'admin'),
  validate(createBusinessSchema),
  createBusiness
);

router.put(
  '/:id',
  authenticate,
  authorize('business_seller', 'admin'),
  validate(updateBusinessSchema),
  updateBusiness
);

router.delete(
  '/:id',
  authenticate,
  authorize('business_seller', 'admin'),
  deleteBusiness
);

module.exports = router;
