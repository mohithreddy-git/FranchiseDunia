const Message = require('../models/Message');
const Lead = require('../models/Lead');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const mongoose = require('mongoose');

// Helper: Verify user is participant or admin
const checkLeadAccess = async (leadId, user) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new ApiError(404, 'Lead inquiry not found');
  }

  const isInvestor = lead.investor.toString() === user._id.toString();
  const isOwner = lead.listingOwner.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';

  if (!isInvestor && !isOwner && !isAdmin) {
    throw new ApiError(403, 'Forbidden: You are not a participant in this conversation.');
  }

  return { lead, isInvestor, isOwner, isAdmin };
};

// POST /api/v1/leads/:id/messages
const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { body } = req.body;

    if (!body || !body.trim()) {
      return next(new ApiError(400, 'Message body cannot be empty.'));
    }

    const trimmedBody = body.trim();
    if (trimmedBody.length > 2000) {
      return next(new ApiError(400, 'Message cannot exceed 2000 characters.'));
    }

    const { lead, isInvestor, isOwner, isAdmin } = await checkLeadAccess(id, req.user);

    // Determine recipient
    let recipientId = null;
    if (isInvestor) {
      recipientId = lead.listingOwner;
    } else if (isOwner) {
      recipientId = lead.investor;
    } else if (isAdmin) {
      // Admin defaults recipient to listingOwner or investor
      recipientId = lead.investor;
    }

    const message = new Message({
      lead: lead._id,
      sender: req.user._id,
      recipient: recipientId,
      body: trimmedBody, // Raw storage - frontend renders text-only
      read: false,
    });

    await message.save();

    return res.status(201).json(new ApiResponse(201, { message }, 'Message sent successfully'));
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/leads/:id/messages?since=<ObjectId>
const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { since, limit = 50 } = req.query;

    const { lead, isAdmin } = await checkLeadAccess(id, req.user);

    // If admin is reading thread, record an AuditLog
    if (isAdmin) {
      await AuditLog.create({
        admin: req.user._id,
        action: 'read_lead_thread',
        lead: lead._id,
        details: { ip: req.ip, userAgent: req.headers['user-agent'] },
        at: new Date(),
      });
    }

    const query = { lead: lead._id };

    // Cursor filter: _id > since (ObjectId cursor guarantees strict monotonicity even within same ms)
    if (since && mongoose.Types.ObjectId.isValid(since)) {
      query._id = { $gt: new mongoose.Types.ObjectId(since) };
    }

    const messages = await Message.find(query)
      .sort({ _id: 1 })
      .limit(Math.min(50, Math.max(1, parseInt(limit, 10) || 50)))
      .populate('sender', 'name role email');

    return res.status(200).json(new ApiResponse(200, { messages }, 'Messages retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/leads/:id/messages/read
const markMessagesRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lead } = await checkLeadAccess(id, req.user);

    // Mark messages addressed to caller as read
    const updateResult = await Message.updateMany(
      {
        lead: lead._id,
        recipient: req.user._id,
        read: false,
      },
      {
        $set: { read: true, readAt: new Date() },
      }
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        { markedReadCount: updateResult.modifiedCount },
        'Conversation messages marked as read.'
      )
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/messages/unread-count
const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Message.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return res.status(200).json(new ApiResponse(200, { unreadCount }, 'Unread count retrieved'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendMessage,
  getMessages,
  markMessagesRead,
  getUnreadCount,
};
