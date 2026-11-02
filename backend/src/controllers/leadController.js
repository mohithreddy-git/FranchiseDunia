const Lead = require('../models/Lead');
const Franchise = require('../models/Franchise');
const BusinessForSale = require('../models/BusinessForSale');
const NdaAgreement = require('../models/NdaAgreement');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { calculateLeadScore } = require('../utils/leadScoring');

// Allowed status transitions for the server-side state machine
const ALLOWED_TRANSITIONS = {
  new: ['under_review', 'rejected'],
  under_review: ['contacted', 'rejected'],
  contacted: ['converted', 'rejected'],
  converted: [], // Terminal
  rejected: ['under_review'], // Only reopen allowed
};

// Helper: Serializes lead depending on viewer role
const serializeLead = (lead, viewer) => {
  if (!lead) return null;
  const raw = lead.toObject ? lead.toObject() : { ...lead };

  const isOwner =
    viewer &&
    lead.listingOwner &&
    (lead.listingOwner._id
      ? lead.listingOwner._id.toString() === viewer._id.toString()
      : lead.listingOwner.toString() === viewer._id.toString());
  const isAdmin = viewer && viewer.role === 'admin';

  // Investor NEVER sees notes
  if (!isOwner && !isAdmin) {
    delete raw.notes;
  }

  return raw;
};

// POST /api/v1/leads
const createLead = async (req, res, next) => {
  try {
    const {
      targetType = 'franchise',
      targetId,
      brandId, // Legacy alias
      fullName,
      email,
      phone,
      investmentBudget,
      targetCity,
      timeline,
      hasCommercialSpace,
      spaceAvailableSqFt,
      message,
    } = req.body;

    const actualTargetId = targetId || brandId;
    if (!actualTargetId) {
      return next(new ApiError(400, 'Target listing ID is required.'));
    }

    let targetListing = null;
    let listingOwner = null;

    if (targetType === 'franchise') {
      targetListing = await Franchise.findById(actualTargetId);
      if (!targetListing) {
        return next(new ApiError(404, 'The franchise you are inquiring about does not exist.'));
      }
      listingOwner = targetListing.brandOwner;
    } else if (targetType === 'business') {
      targetListing = await BusinessForSale.findById(actualTargetId);
      if (!targetListing) {
        return next(new ApiError(404, 'The business opportunity you are inquiring about does not exist.'));
      }
      listingOwner = targetListing.seller;

      // Inquiring on business listing REQUIRES an existing NDA agreement
      const ndaRecord = await NdaAgreement.findOne({
        user: req.user._id,
        business: targetListing._id,
      });

      if (!ndaRecord) {
        return next(
          new ApiError(
            403,
            'An executed Non-Disclosure Agreement (NDA) is strictly required before submitting an inquiry on a confidential business listing.'
          )
        );
      }
    } else {
      return next(new ApiError(400, "Invalid targetType. Must be 'franchise' or 'business'."));
    }

    // Abuse guard 1: Users cannot inquire on their own listing
    if (listingOwner.toString() === req.user._id.toString()) {
      return next(new ApiError(403, 'Forbidden: You cannot submit an inquiry on your own listing.'));
    }

    // Abuse guard 2: Max one OPEN lead per (investor, target). Open = new, under_review, contacted
    const existingOpenLead = await Lead.findOne({
      investor: req.user._id,
      targetId: targetListing._id,
      status: { $in: ['new', 'under_review', 'contacted'] },
    });

    if (existingOpenLead) {
      return res.status(409).json({
        statusCode: 409,
        success: false,
        message: `You already have an active open inquiry for this listing (ID: ${existingOpenLead._id}).`,
        data: { existingLeadId: existingOpenLead._id },
      });
    }

    // Deterministic server-side lead scoring calculation
    const { score, breakdown } = calculateLeadScore({
      investmentBudget,
      targetListing,
      timeline,
      hasCommercialSpace,
      spaceAvailableSqFt,
      phone,
      city: targetCity,
      company: req.user.company,
      user: req.user,
      message,
    });

    const lead = new Lead({
      investor: req.user._id,
      targetType,
      targetId: targetListing._id,
      targetModel: targetType === 'franchise' ? 'Franchise' : 'BusinessForSale',
      brandId: targetType === 'franchise' ? targetListing._id : undefined,
      listingOwner,
      brandOwner: listingOwner,
      fullName,
      email,
      phone,
      investmentBudget,
      targetCity,
      timeline,
      hasCommercialSpace,
      spaceAvailableSqFt,
      message,
      leadScore: score,
      scoreBreakdown: breakdown,
      status: 'new',
      statusHistory: [
        {
          from: 'none',
          to: 'new',
          by: req.user._id,
          at: new Date(),
          reason: 'Initial inquiry submission',
        },
      ],
    });

    await lead.save();

    const serialized = serializeLead(lead, req.user);

    return res
      .status(201)
      .json(new ApiResponse(201, { lead: serialized }, 'Inquiry submitted successfully to listing representative'));
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/leads
const getLeads = async (req, res, next) => {
  try {
    const { status, brandId, targetId, sortBy = 'score', page = 1, limit = 20 } = req.query;
    const query = {};

    // IDOR protection
    if (req.user.role === 'brand_owner' || req.user.role === 'business_seller') {
      query.listingOwner = req.user._id;
    } else if (req.user.role === 'investor') {
      query.investor = req.user._id;
    } else if (req.user.role !== 'admin') {
      return next(new ApiError(403, 'Unauthorized to view leads.'));
    }

    if (status && status !== 'All') query.status = status;
    const actualTarget = targetId || brandId;
    if (actualTarget) query.targetId = actualTarget;

    // Sorting
    let sortOptions = { leadScore: -1, createdAt: -1 };
    if (sortBy === 'newest') sortOptions = { createdAt: -1 };
    if (sortBy === 'oldest') sortOptions = { createdAt: 1 };
    if (sortBy === 'budget_desc') sortOptions = { investmentBudget: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await Lead.countDocuments(query);
    const rawLeads = await Lead.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('investor', 'name email phone city company isVerified createdAt')
      .populate('listingOwner', 'name email company')
      .populate('targetId');

    const leads = rawLeads.map((l) => serializeLead(l, req.user));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          leads,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
        'Leads retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/leads/pipeline-counts (Single Aggregation with Caller $match first)
const getPipelineCounts = async (req, res, next) => {
  try {
    const matchFilter = {};

    if (req.user.role === 'brand_owner' || req.user.role === 'business_seller') {
      matchFilter.listingOwner = req.user._id;
    } else if (req.user.role === 'investor') {
      matchFilter.investor = req.user._id;
    } else if (req.user.role !== 'admin') {
      return next(new ApiError(403, 'Unauthorized to access pipeline counts.'));
    }

    // $match on caller's identity BEFORE $facet to guarantee no cross-owner data leak
    const pipeline = [
      { $match: matchFilter },
      {
        $facet: {
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
          totalLeads: [{ $count: 'count' }],
          avgScore: [
            {
              $group: {
                _id: null,
                avg: { $avg: '$leadScore' },
              },
            },
          ],
        },
      },
    ];

    const results = await Lead.aggregate(pipeline);
    const facetData = results[0] || { byStatus: [], totalLeads: [], avgScore: [] };

    const counts = {
      new: 0,
      under_review: 0,
      contacted: 0,
      converted: 0,
      rejected: 0,
      total: facetData.totalLeads[0]?.count || 0,
      avgScore: Math.round(facetData.avgScore[0]?.avg || 0),
    };

    facetData.byStatus.forEach((item) => {
      if (counts[item._id] !== undefined) {
        counts[item._id] = item.count;
      }
    });

    return res.status(200).json(new ApiResponse(200, { counts }, 'Pipeline counts aggregated successfully'));
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/leads/:id
const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findById(id)
      .populate('investor', 'name email phone city company isVerified createdAt')
      .populate('listingOwner', 'name email company')
      .populate('targetId');

    if (!lead) {
      return next(new ApiError(404, 'Lead inquiry not found'));
    }

    // STRICT IDOR CHECK
    const isOwner =
      lead.listingOwner &&
      (lead.listingOwner._id
        ? lead.listingOwner._id.toString() === req.user._id.toString()
        : lead.listingOwner.toString() === req.user._id.toString());

    const isApplicant =
      lead.investor &&
      (lead.investor._id
        ? lead.investor._id.toString() === req.user._id.toString()
        : lead.investor.toString() === req.user._id.toString());

    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isApplicant && !isAdmin) {
      return next(new ApiError(403, 'Forbidden: You do not have permission to view this lead.'));
    }

    const serialized = serializeLead(lead, req.user);

    return res.status(200).json(new ApiResponse(200, { lead: serialized }, 'Lead retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/leads/:id/status (Server-Enforced State Machine)
const updateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, reason } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) {
      return next(new ApiError(404, 'Lead inquiry not found'));
    }

    // IDOR CHECK: Listing owner or admin only
    const isOwner =
      lead.listingOwner &&
      lead.listingOwner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new ApiError(403, 'Forbidden: You do not own this lead inquiry.'));
    }

    // STATE MACHINE VALIDATION
    if (status && status !== lead.status) {
      const allowedNext = ALLOWED_TRANSITIONS[lead.status] || [];
      if (!allowedNext.includes(status)) {
        return res.status(409).json({
          statusCode: 409,
          success: false,
          message: `Invalid status transition from '${lead.status}' to '${status}'.`,
          data: {
            currentStatus: lead.status,
            attemptedStatus: status,
            allowedTransitions: allowedNext,
          },
        });
      }

      // Record transition in statusHistory
      lead.statusHistory.push({
        from: lead.status,
        to: status,
        by: req.user._id,
        at: new Date(),
        reason: reason || 'Status updated by listing owner',
      });

      lead.status = status;
    }

    if (notes !== undefined) {
      lead.notes = notes;
    }

    await lead.save();

    const serialized = serializeLead(lead, req.user);

    return res.status(200).json(new ApiResponse(200, { lead: serialized }, 'Lead status updated successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createLead,
  getLeads,
  getPipelineCounts,
  getLeadById,
  updateLeadStatus,
};
