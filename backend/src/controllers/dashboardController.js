const Franchise = require('../models/Franchise');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const BusinessForSale = require('../models/BusinessForSale');
const NdaAgreement = require('../models/NdaAgreement');
const Lead = require('../models/Lead');
const SavedListing = require('../models/SavedListing');
const BrochureDownload = require('../models/BrochureDownload');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

// GET /api/v1/dashboard/investor
const getInvestorDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [inquiries, savedListings, rsvps, ndas] = await Promise.all([
      Lead.find({ investor: userId })
        .sort({ createdAt: -1 })
        .populate('targetId')
        .populate('listingOwner', 'name email company phone'),
      SavedListing.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('targetId'),
      EventRegistration.find({ user: userId, status: 'confirmed' })
        .sort({ createdAt: -1 })
        .populate('event'),
      NdaAgreement.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('business'),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          inquiries,
          savedListings,
          rsvps,
          ndas,
        },
        'Investor dashboard metrics retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/dashboard/brand-owner
const getBrandOwnerDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [franchises, leads, newLeadsCount, brochureStats] = await Promise.all([
      Franchise.find({ brandOwner: userId }).sort({ createdAt: -1 }),
      Lead.find({ listingOwner: userId }).sort({ createdAt: -1 }),
      Lead.countDocuments({ listingOwner: userId, createdAt: { $gte: sevenDaysAgo } }),
      BrochureDownload.aggregate([
        {
          $lookup: {
            from: 'franchises',
            localField: 'franchise',
            foreignField: '_id',
            as: 'franchiseDoc',
          },
        },
        { $unwind: '$franchiseDoc' },
        { $match: { 'franchiseDoc.brandOwner': userId } },
        {
          $group: {
            _id: null,
            totalDownloads: { $sum: 1 },
            uniqueIps: { $addToSet: '$ipHash' },
          },
        },
      ]),
    ]);

    const pipelineCounts = {
      new: 0,
      under_review: 0,
      contacted: 0,
      converted: 0,
      rejected: 0,
    };

    let totalScore = 0;
    leads.forEach((l) => {
      if (pipelineCounts[l.status] !== undefined) pipelineCounts[l.status]++;
      totalScore += l.leadScore || 0;
    });

    const avgScore = leads.length > 0 ? Math.round(totalScore / leads.length) : 0;
    const downloads = brochureStats[0] || { totalDownloads: 0, uniqueIps: [] };

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          franchises,
          leadsSummary: {
            total: leads.length,
            newThisWeek: newLeadsCount,
            avgScore,
            pipelineCounts,
          },
          brochuresSummary: {
            totalDownloads: downloads.totalDownloads || 0,
            uniqueDownloads: downloads.uniqueIps?.length || 0,
          },
        },
        'Brand owner dashboard metrics retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/dashboard/business-seller
const getBusinessSellerDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [businesses, inquiries, executedNdas] = await Promise.all([
      BusinessForSale.find({ seller: userId }).sort({ createdAt: -1 }),
      Lead.find({ listingOwner: userId, targetType: 'business' }).sort({ createdAt: -1 }),
      NdaAgreement.find({ business: { $in: await BusinessForSale.find({ seller: userId }).distinct('_id') } })
        .populate('user', 'name email company')
        .populate('business', 'title slug'),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          businesses,
          inquiries,
          executedNdas,
        },
        'Business seller dashboard metrics retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/dashboard/event-organizer
const getEventOrganizerDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const events = await Event.find({ organizer: userId }).sort({ startDate: 1 });
    const eventIds = events.map((e) => e._id);

    const totalRegistrations = await EventRegistration.countDocuments({
      event: { $in: eventIds },
      status: 'confirmed',
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          events,
          totalEvents: events.length,
          totalRegistrations,
        },
        'Event organizer dashboard metrics retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/dashboard/admin
const getAdminDashboard = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      usersByRole,
      franchisesByStatus,
      eventsByStatus,
      businessesByStatus,
      leadsThisWeek,
      totalRegistrations,
    ] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Franchise.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Event.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      BusinessForSale.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Lead.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      EventRegistration.countDocuments({ status: 'confirmed' }),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          usersByRole: Object.fromEntries(usersByRole.map((u) => [u._id, u.count])),
          franchisesByStatus: Object.fromEntries(franchisesByStatus.map((f) => [f._id, f.count])),
          eventsByStatus: Object.fromEntries(eventsByStatus.map((e) => [e._id, e.count])),
          businessesByStatus: Object.fromEntries(businessesByStatus.map((b) => [b._id, b.count])),
          leadsThisWeek,
          totalRegistrations,
        },
        'Platform administration metrics aggregated successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInvestorDashboard,
  getBrandOwnerDashboard,
  getBusinessSellerDashboard,
  getEventOrganizerDashboard,
  getAdminDashboard,
};
