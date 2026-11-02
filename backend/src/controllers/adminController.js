const Franchise = require('../models/Franchise');
const Event = require('../models/Event');
const BusinessForSale = require('../models/BusinessForSale');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// GET /api/v1/admin/pending
const getPendingListings = async (req, res, next) => {
  try {
    const [pendingFranchises, pendingEvents, pendingBusinesses] = await Promise.all([
      Franchise.find({ status: 'pending' }).populate('brandOwner', 'name email company'),
      Event.find({ status: 'pending' }).populate('organizer', 'name email company'),
      BusinessForSale.find({ status: 'pending' }).populate('seller', 'name email company'),
    ]);

    const totalPending =
      pendingFranchises.length + pendingEvents.length + pendingBusinesses.length;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          franchises: pendingFranchises,
          events: pendingEvents,
          businesses: pendingBusinesses,
          totalPending,
        },
        'Pending listings retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/admin/:type/:id/status
const updateListingStatus = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return next(new ApiError(400, "Invalid status. Must be 'approved', 'rejected', or 'pending'"));
    }

    // STRICT RULE: Rejection of a listing requires a non-empty reason, enforced server-side
    if (status === 'rejected' && (!rejectionReason || !rejectionReason.trim())) {
      return next(new ApiError(400, 'A non-empty rejectionReason is strictly required when rejecting a listing.'));
    }

    let model = null;
    if (type === 'franchise' || type === 'franchises') {
      model = Franchise;
    } else if (type === 'event' || type === 'events') {
      model = Event;
    } else if (
      type === 'business' ||
      type === 'business-for-sale' ||
      type === 'businesses'
    ) {
      model = BusinessForSale;
    } else {
      return next(
        new ApiError(400, "Invalid listing type. Must be 'franchise', 'event', or 'business'")
      );
    }

    const listing = await model.findById(id);
    if (!listing) {
      return next(new ApiError(404, `Listing of type '${type}' with id '${id}' not found`));
    }

    listing.status = status;
    if (status === 'rejected') {
      listing.rejectionReason = rejectionReason.trim();
    } else if (status === 'approved') {
      listing.rejectionReason = null;
    }

    await listing.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          id: listing._id,
          type,
          status: listing.status,
          rejectionReason: listing.rejectionReason,
        },
        `Listing status updated to '${status}'`
      )
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const query = {};
    if (role && role !== 'All') query.role = role;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-sessions');

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          users,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
        'Users retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/admin/users/:id/active (Deactivation toggle)
const toggleUserActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return next(new ApiError(400, 'isActive must be a boolean.'));
    }

    // STRICT RULE: An admin cannot deactivate themselves
    if (req.user._id.toString() === id.toString() && isActive === false) {
      return next(new ApiError(400, 'Self-deactivation is disallowed. An administrator cannot deactivate their own account.'));
    }

    const user = await User.findById(id);
    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

    user.isActive = isActive;

    // If deactivating, revoke all active sessions immediately
    if (isActive === false) {
      user.sessions = [];
    }

    await user.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        { id: user._id, email: user.email, isActive: user.isActive },
        `User account has been ${isActive ? 'activated' : 'deactivated'}.`
      )
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPendingListings,
  updateListingStatus,
  getUsers,
  toggleUserActive,
};
