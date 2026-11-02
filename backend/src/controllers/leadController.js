const Lead = require('../models/Lead');
const Franchise = require('../models/Franchise');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// POST /api/v1/leads
const createLead = async (req, res, next) => {
  try {
    const {
      brandId,
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

    const franchise = await Franchise.findById(brandId);
    if (!franchise) {
      return next(new ApiError(404, 'The franchise you are inquiring about does not exist.'));
    }

    // Lead scoring algorithm
    let leadScore = 60;
    if (investmentBudget >= franchise.investmentMin) leadScore += 20;
    if (hasCommercialSpace) leadScore += 10;
    if (timeline === 'Immediately (Within 30 days)') leadScore += 10;

    const lead = new Lead({
      investor: req.user._id,
      brandId: franchise._id,
      brandOwner: franchise.brandOwner,
      fullName,
      email,
      phone,
      investmentBudget,
      targetCity,
      timeline,
      hasCommercialSpace,
      spaceAvailableSqFt,
      message,
      leadScore: Math.min(100, leadScore),
    });

    await lead.save();

    return res
      .status(201)
      .json(new ApiResponse(201, { lead }, 'Inquiry submitted successfully to brand representative'));
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/leads
const getLeads = async (req, res, next) => {
  try {
    const { status, brandId } = req.query;
    const query = {};

    // IDOR protection: Users can only see leads appropriate to their role
    if (req.user.role === 'brand_owner') {
      query.brandOwner = req.user._id;
    } else if (req.user.role === 'investor') {
      query.investor = req.user._id;
    } else if (req.user.role !== 'admin') {
      return next(new ApiError(403, 'Unauthorized to view leads.'));
    }

    if (status) query.status = status;
    if (brandId) query.brandId = brandId;

    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .populate('brandId', 'name slug industry logoUrl investmentMin investmentMax')
      .populate('investor', 'name email phone city');

    return res
      .status(200)
      .json(new ApiResponse(200, { leads, total: leads.length }, 'Leads retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/leads/:id
const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findById(id)
      .populate('brandId', 'name slug industry investmentMin investmentMax')
      .populate('investor', 'name email phone city');

    if (!lead) {
      return next(new ApiError(404, 'Lead inquiry not found'));
    }

    // STRICT IDOR CHECK
    const isOwner = lead.brandOwner.toString() === req.user._id.toString();
    const isApplicant = lead.investor._id
      ? lead.investor._id.toString() === req.user._id.toString()
      : lead.investor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isApplicant && !isAdmin) {
      return next(new ApiError(403, 'Forbidden: You do not have permission to view this lead.'));
    }

    return res.status(200).json(new ApiResponse(200, { lead }, 'Lead retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/leads/:id/status
const updateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) {
      return next(new ApiError(404, 'Lead inquiry not found'));
    }

    // STRICT IDOR CHECK: Only the brandOwner who owns this franchise listing (or admin) can update status
    const isOwner = lead.brandOwner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new ApiError(403, 'Forbidden: You do not own this lead inquiry.'));
    }

    lead.status = status;
    if (notes !== undefined) lead.notes = notes;
    await lead.save();

    return res
      .status(200)
      .json(new ApiResponse(200, { lead }, 'Lead status updated successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
};
