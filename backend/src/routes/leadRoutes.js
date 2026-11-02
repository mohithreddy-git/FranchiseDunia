const express = require('express');
const router = express.Router();

const {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
} = require('../controllers/leadController');

const authenticate = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  createLeadSchema,
  updateLeadStatusSchema,
} = require('../validations/leadValidation');

// All lead operations require authentication
router.use(authenticate);

router.post('/', validate(createLeadSchema), createLead);
router.get('/', getLeads);
router.get('/:id', getLeadById);
router.patch('/:id/status', validate(updateLeadStatusSchema), updateLeadStatus);

module.exports = router;
