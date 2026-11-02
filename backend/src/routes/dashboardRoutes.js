const express = require('express');
const router = express.Router();

const {
  getInvestorDashboard,
  getBrandOwnerDashboard,
  getBusinessSellerDashboard,
  getEventOrganizerDashboard,
  getAdminDashboard,
} = require('../controllers/dashboardController');

const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/rbacMiddleware');

router.use(authenticate);

// Role-gated dashboard routes
router.get('/investor', authorize('investor', 'admin'), getInvestorDashboard);
router.get('/brand-owner', authorize('brand_owner', 'admin'), getBrandOwnerDashboard);
router.get('/business-seller', authorize('business_seller', 'admin'), getBusinessSellerDashboard);
router.get('/event-organizer', authorize('event_organizer', 'admin'), getEventOrganizerDashboard);
router.get('/admin', authorize('admin'), getAdminDashboard);

module.exports = router;
