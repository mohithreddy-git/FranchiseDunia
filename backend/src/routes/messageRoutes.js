const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const {
  sendMessage,
  getMessages,
  markMessagesRead,
  getUnreadCount,
} = require('../controllers/messageController');

const authenticate = require('../middlewares/authMiddleware');

// Message sending rate limiter: keyed by user ID (20 msgs per minute)
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Rate limit exceeded: You can only send up to 20 messages per minute.',
  },
});

router.use(authenticate);

// Direct unread count endpoint
router.get('/unread-count', getUnreadCount);

// Lead-specific message routes
router.post('/leads/:id/messages', messageLimiter, sendMessage);
router.get('/leads/:id/messages', getMessages);
router.post('/leads/:id/messages/read', markMessagesRead);

module.exports = router;
