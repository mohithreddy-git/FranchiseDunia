const crypto = require('crypto');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { generateIcs, generateGoogleCalendarUrl } = require('../utils/calendar');
const { attachSavedFlags } = require('../utils/savedHelper');
const { hasKeyFieldChanged } = require('../utils/keyFields');
const { generateSanitizedCsv } = require('../utils/csvSanitizer');

const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// GET /api/v1/events (Public listing with multi-facet filters)
const getEvents = async (req, res, next) => {
  try {
    const {
      city,
      type,
      price,
      startDate,
      endDate,
      upcoming = 'true',
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // 1. Approval status filter
    if (req.user && req.user.role === 'admin') {
      if (req.query.status) query.status = req.query.status;
    } else if (req.user && req.user.role === 'event_organizer') {
      query.$or = [{ status: 'approved' }, { organizer: req.user._id }];
    } else {
      query.status = 'approved';
    }

    // 2. City filter
    if (city && city !== 'All') {
      query.city = new RegExp(`^${city.trim()}$`, 'i');
    }

    // 3. Event Type filter
    if (type && type !== 'All') {
      query.type = type;
    }

    // 4. Price filter
    if (price === 'free') {
      query.ticketPrice = 0;
    } else if (price === 'paid') {
      query.ticketPrice = { $gt: 0 };
    }

    // 5. Date filter & Upcoming Default
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    } else if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
    }

    // Pagination: Capped at max 50 per page
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const total = await Event.countDocuments(query);
    const rawEvents = await Event.find(query)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limitNum)
      .populate('organizer', 'name email company');

    // Attach isSaved flags with ONE single query
    const events = await attachSavedFlags(rawEvents, 'event', req.user);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          events,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
        'Events retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/events/:slug
const getEventBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    let event = await Event.findOne({ slug }).populate('organizer', 'name email company phone');

    if (!event && slug.match(/^[0-9a-fA-F]{24}$/)) {
      event = await Event.findById(slug).populate('organizer', 'name email company phone');
    }

    if (!event) {
      return next(new ApiError(404, `Event '${slug}' not found`));
    }

    if (event.status !== 'approved') {
      const isOwner =
        req.user &&
        event.organizer &&
        event.organizer._id.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return next(new ApiError(404, `Event '${slug}' not found`));
      }
    }

    let isRegistered = false;
    let userRegistration = null;
    if (req.user) {
      userRegistration = await EventRegistration.findOne({
        event: event._id,
        user: req.user._id,
        status: 'confirmed',
      });
      isRegistered = !!userRegistration;
    }

    const googleCalendarUrl = generateGoogleCalendarUrl(event);
    const isSoldOut = event.registeredCount >= event.capacity;

    const [withSaved] = await attachSavedFlags([event], 'event', req.user);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          event: withSaved,
          googleCalendarUrl,
          isRegistered,
          ticketCode: userRegistration?.ticketCode || null,
          isSoldOut,
        },
        'Event retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/events/:id/register
const registerForEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingRegistration = await EventRegistration.findOne({
      event: id,
      user: req.user._id,
      status: 'confirmed',
    });

    if (existingRegistration) {
      return next(new ApiError(409, 'You have already registered for this event.'));
    }

    // Atomic conditional increment
    const event = await Event.findOneAndUpdate(
      {
        _id: id,
        status: 'approved',
        $expr: { $lt: ['$registeredCount', '$capacity'] },
      },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );

    if (!event) {
      const checkEvent = await Event.findById(id);
      if (!checkEvent || checkEvent.status !== 'approved') {
        return next(new ApiError(404, 'Event not found or not currently active for registration.'));
      }
      return next(new ApiError(400, 'This event is sold out. Capacity reached.'));
    }

    const ticketCode = `FD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    try {
      const registration = new EventRegistration({
        event: id,
        user: req.user._id,
        ticketCode,
        status: 'confirmed',
      });
      await registration.save();

      return res.status(201).json(
        new ApiResponse(
          201,
          {
            registration: {
              id: registration._id,
              ticketCode: registration.ticketCode,
              status: registration.status,
              createdAt: registration.createdAt,
            },
            event: {
              id: event._id,
              title: event.title,
              registeredCount: event.registeredCount,
              capacity: event.capacity,
            },
          },
          'RSVP successfully confirmed! Your ticket is generated.'
        )
      );
    } catch (saveErr) {
      await Event.findByIdAndUpdate(id, { $inc: { registeredCount: -1 } });
      if (saveErr.code === 11000) {
        return next(new ApiError(409, 'You have already registered for this event.'));
      }
      throw saveErr;
    }
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/events/:id/register
const cancelRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;

    const registration = await EventRegistration.findOne({
      event: id,
      user: req.user._id,
      status: 'confirmed',
    });

    if (!registration) {
      return next(new ApiError(404, 'No active registration found for this event.'));
    }

    registration.status = 'cancelled';
    await registration.save();

    await Event.findOneAndUpdate(
      { _id: id, registeredCount: { $gt: 0 } },
      { $inc: { registeredCount: -1 } }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Registration cancelled and seat released successfully.'));
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/events/:slug/calendar.ics
const getEventIcs = async (req, res, next) => {
  try {
    const { slug } = req.params;

    let event = await Event.findOne({ slug });
    if (!event && slug.match(/^[0-9a-fA-F]{24}$/)) {
      event = await Event.findById(slug);
    }

    if (!event || event.status !== 'approved') {
      return next(new ApiError(404, 'Event calendar file not found'));
    }

    const icsContent = generateIcs(event);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${event.slug}.ics"`);
    return res.status(200).send(icsContent);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/events
const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      type,
      city,
      venue,
      startDate,
      endDate,
      capacity,
      ticketPrice,
      description,
      agenda,
      speakers,
      exhibitors,
      coverImageUrl,
    } = req.body;

    let baseSlug = createSlug(title);
    let slug = baseSlug;

    let counter = 1;
    while (await Event.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const event = new Event({
      title,
      slug,
      type,
      city,
      venue,
      startDate,
      endDate,
      capacity,
      ticketPrice: ticketPrice || 0,
      description,
      agenda,
      speakers,
      exhibitors,
      coverImageUrl,
      organizer: req.user._id,
      status: req.user.role === 'admin' ? 'approved' : 'pending',
      isSampleData: false,
    });

    await event.save();

    return res.status(201).json(new ApiResponse(201, { event }, 'Event created successfully'));
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/events/:id
const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return next(new ApiError(404, 'Event not found'));
    }

    const isOwner = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new ApiError(403, 'Forbidden: You do not have permission to modify this event.'));
    }

    // Whitelist allowed fields (disallowing manual status, organizer, registeredCount manipulation)
    const allowedFields = [
      'title',
      'type',
      'city',
      'venue',
      'startDate',
      'endDate',
      'capacity',
      'ticketPrice',
      'description',
      'agenda',
      'speakers',
      'exhibitors',
      'coverImageUrl',
    ];

    const safeUpdate = {};
    for (const f of allowedFields) {
      if (req.body[f] !== undefined) {
        safeUpdate[f] = req.body[f];
      }
    }

    // Re-approval rule: if key field changed on approved event, reset to pending
    if (!isAdmin && event.status === 'approved') {
      if (hasKeyFieldChanged('event', safeUpdate, event)) {
        safeUpdate.status = 'pending';
      }
    }

    Object.assign(event, safeUpdate);
    await event.save();

    return res.status(200).json(new ApiResponse(200, { event }, 'Event updated successfully'));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/events/:id
const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return next(new ApiError(404, 'Event not found'));
    }

    const isOwner = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new ApiError(403, 'Forbidden: You do not have permission to delete this event.'));
    }

    await event.deleteOne();
    return res.status(200).json(new ApiResponse(200, null, 'Event deleted successfully'));
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/events/:id/attendees.csv (Organizer & Admin Only, with Formula Injection Sanitization)
const exportAttendeesCsv = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return next(new ApiError(404, 'Event not found'));
    }

    // Ownership check: organizer of this event or admin only
    const isOwner = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new ApiError(403, 'Forbidden: You are not authorized to export attendees for this event.'));
    }

    const registrations = await EventRegistration.find({ event: event._id, status: 'confirmed' })
      .populate('user', 'name email phone city company');

    const rows = registrations.map((r) => ({
      ticketCode: r.ticketCode,
      name: r.user?.name || '',
      email: r.user?.email || '',
      phone: r.user?.phone || '',
      city: r.user?.city || '',
      registeredAt: r.createdAt ? new Date(r.createdAt).toISOString() : '',
    }));

    const csvContent = generateSanitizedCsv(
      ['Ticket Code', 'Attendee Name', 'Email Address', 'Phone Number', 'City', 'Registration Timestamp'],
      ['ticketCode', 'name', 'email', 'phone', 'city', 'registeredAt'],
      rows
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${event.slug}-attendees.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEvents,
  getEventBySlug,
  registerForEvent,
  cancelRegistration,
  getEventIcs,
  createEvent,
  updateEvent,
  deleteEvent,
  exportAttendeesCsv,
};
