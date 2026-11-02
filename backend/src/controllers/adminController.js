const Franchise = require('../models/Franchise');
const Event = require('../models/Event');
const BusinessForSale = require('../models/BusinessForSale');
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
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return next(new ApiError(400, "Invalid status. Must be 'approved', 'rejected', or 'pending'"));
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
    await listing.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { id: listing._id, type, status: listing.status },
          `Listing status updated to '${status}'`
        )
      );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPendingListings,
  updateListingStatus,
};
