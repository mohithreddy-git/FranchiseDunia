const express = require('express');
const router = express.Router();

const {
  saveListing,
  unsaveListing,
  getSavedListings,
} = require('../controllers/savedController');

const authenticate = require('../middlewares/authMiddleware');

router.use(authenticate);

router.post('/', saveListing);
router.delete('/:id', unsaveListing);
router.delete('/', unsaveListing);
router.get('/', getSavedListings);

module.exports = router;
