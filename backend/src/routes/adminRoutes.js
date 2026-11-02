const express = require('express');
const router = express.Router();

const {
  getPendingListings,
  updateListingStatus,
  getUsers,
  toggleUserActive,
} = require('../controllers/adminController');

const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/rbacMiddleware');

// All admin endpoints strictly require authentication and 'admin' role
router.use(authenticate, authorize('admin'));

router.get('/pending', getPendingListings);
router.patch('/:type/:id/status', updateListingStatus);

// User management endpoints
router.get('/users', getUsers);
router.patch('/users/:id/active', toggleUserActive);

module.exports = router;
