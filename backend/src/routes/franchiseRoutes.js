const express = require('express');
const router = express.Router();

const {
  getFranchises,
  getFranchiseBySlug,
  createFranchise,
  updateFranchise,
  deleteFranchise,
} = require('../controllers/franchiseController');

const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/rbacMiddleware');
const validate = require('../middlewares/validate');
const {
  createFranchiseSchema,
  updateFranchiseSchema,
} = require('../validations/franchiseValidation');

// Public listing & detail endpoints
router.get('/', getFranchises);
router.get('/:slug', getFranchiseBySlug);

// Protected franchise creation & management (brand_owner or admin)
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

router.delete(
  '/:id',
  authenticate,
  authorize('brand_owner', 'admin'),
  deleteFranchise
);

module.exports = router;
