const SavedListing = require('../models/SavedListing');
const Franchise = require('../models/Franchise');
const Event = require('../models/Event');
const BusinessForSale = require('../models/BusinessForSale');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// POST /api/v1/saved
const saveListing = async (req, res, next) => {
  try {
    const { targetType, targetId } = req.body;

    if (!['franchise', 'event', 'business'].includes(targetType)) {
      return next(new ApiError(400, "targetType must be 'franchise', 'event', or 'business'"));
    }

    let targetModel = '';
    let doc = null;

    if (targetType === 'franchise') {
      targetModel = 'Franchise';
      doc = await Franchise.findById(targetId);
    } else if (targetType === 'event') {
      targetModel = 'Event';
      doc = await Event.findById(targetId);
    } else if (targetType === 'business') {
      targetModel = 'BusinessForSale';
      doc = await BusinessForSale.findById(targetId);
    }

    if (!doc || doc.status !== 'approved') {
      return next(new ApiError(404, 'Cannot bookmark a non-existent or unapproved listing.'));
    }

    const saved = await SavedListing.findOneAndUpdate(
      { user: req.user._id, targetType, targetId },
      { $setOnInsert: { user: req.user._id, targetType, targetId, targetModel } },
      { upsert: true, new: true }
    );

    return res.status(201).json(new ApiResponse(201, { saved }, 'Listing saved successfully.'));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/saved/:id or DELETE /api/v1/saved?targetType=&targetId=
const unsaveListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetType, targetId } = req.query;

    const query = { user: req.user._id };

    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else if (targetType && targetId) {
      query.targetType = targetType;
      query.targetId = targetId;
    } else {
      return next(new ApiError(400, 'Please provide bookmark ID or targetType and targetId.'));
    }

    const result = await SavedListing.findOneAndDelete(query);
    if (!result) {
      return next(new ApiError(404, 'Bookmark not found.'));
    }

    return res.status(200).json(new ApiResponse(200, null, 'Listing removed from saved items.'));
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/saved
const getSavedListings = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const query = { user: req.user._id };

    if (type && type !== 'All') {
      query.targetType = type;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await SavedListing.countDocuments(query);
    const saved = await SavedListing.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('targetId');

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          saved,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
        'Saved listings retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  saveListing,
  unsaveListing,
  getSavedListings,
};
