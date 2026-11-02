const express = require('express');
const router = express.Router();

const {
  getEvents,
  getEventBySlug,
  registerForEvent,
  cancelRegistration,
  getEventIcs,
  createEvent,
  updateEvent,
  deleteEvent,
  exportAttendeesCsv,
} = require('../controllers/eventController');

const authenticate = require('../middlewares/authMiddleware');
const optionalAuth = require('../middlewares/optionalAuth');
const authorize = require('../middlewares/rbacMiddleware');
const validate = require('../middlewares/validate');
const { createEventSchema, updateEventSchema } = require('../validations/eventValidation');

// Public endpoints
router.get('/', optionalAuth, getEvents);
router.get('/:slug/calendar.ics', getEventIcs);
router.get('/:slug', optionalAuth, getEventBySlug);

// RSVP endpoints
router.post('/:id/register', authenticate, registerForEvent);
router.delete('/:id/register', authenticate, cancelRegistration);

// CSV attendee export endpoint (Organizer or Admin only)
router.get('/:id/attendees.csv', authenticate, exportAttendeesCsv);

// Organizer & Admin endpoints
router.post(
  '/',
  authenticate,
  authorize('event_organizer', 'admin'),
  validate(createEventSchema),
  createEvent
);

router.put(
  '/:id',
  authenticate,
  authorize('event_organizer', 'admin'),
  validate(updateEventSchema),
  updateEvent
);

router.delete('/:id', authenticate, authorize('event_organizer', 'admin'), deleteEvent);

module.exports = router;
