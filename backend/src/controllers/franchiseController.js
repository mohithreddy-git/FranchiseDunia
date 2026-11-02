const Franchise = require('../models/Franchise');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// Helper to create URL friendly slug
const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// GET /api/v1/franchises
const getFranchises = async (req, res, next) => {
  try {
    const {
      search,
      industry,
      minInvestment,
      maxInvestment,
      minRoyalty,
      maxRoyalty,
      minSpace,
      maxSpace,
      roiPeriod,
      city,
      isFeatured,
      sortBy = 'popular',
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // 1. Text / Keyword Search
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { tagline: searchRegex },
        { industry: searchRegex },
        { description: searchRegex },
      ];
    }

    // 2. Industry Filtering (Flexible, supports full name or partial like "food")
    if (industry && industry !== 'All') {
      const indList = Array.isArray(industry) ? industry : industry.split(',');
      const regexConditions = indList.map((item) => new RegExp(item.trim(), 'i'));
      query.industry = { $in: regexConditions };
    }

    // 3. Investment Range (Whole INR Rupees)
    if (minInvestment !== undefined && minInvestment !== '') {
      const minVal = Number(minInvestment);
      if (!isNaN(minVal)) {
        query.investmentMax = { ...query.investmentMax, $gte: minVal };
      }
    }
    if (maxInvestment !== undefined && maxInvestment !== '') {
      const maxVal = Number(maxInvestment);
      if (!isNaN(maxVal)) {
        query.investmentMin = { ...query.investmentMin, $lte: maxVal };
      }
    }

    // 4. Royalty Percent
    if (minRoyalty !== undefined || maxRoyalty !== undefined) {
      query.royaltyPercent = {};
      if (minRoyalty !== undefined && minRoyalty !== '') {
        query.royaltyPercent.$gte = Number(minRoyalty);
      }
      if (maxRoyalty !== undefined && maxRoyalty !== '') {
        query.royaltyPercent.$lte = Number(maxRoyalty);
      }
    }

    // 5. Space Required (sq ft)
    if (minSpace !== undefined || maxSpace !== undefined) {
      if (minSpace !== undefined && minSpace !== '') {
        query.spaceMinSqFt = { ...query.spaceMinSqFt, $gte: Number(minSpace) };
      }
      if (maxSpace !== undefined && maxSpace !== '') {
        query.spaceMinSqFt = { ...query.spaceMinSqFt, $lte: Number(maxSpace) };
      }
    }

    // 6. Max ROI Period (Months)
    if (roiPeriod && roiPeriod !== '') {
      query.roiPeriodMonths = { $lte: Number(roiPeriod) };
    }

    // 7. City / Location Availability
    if (city && city.trim() && city !== 'All') {
      const cityRegex = new RegExp(city.trim(), 'i');
      query.availableLocations = { $in: [cityRegex, /pan-india/i] };
    }

    // 8. Featured flag
    if (isFeatured === 'true') {
      query.isFeatured = true;
    }

    // Sorting
    let sortOptions = { isFeatured: -1, createdAt: -1 };
    if (sortBy === 'investment_asc') {
      sortOptions = { investmentMin: 1 };
    } else if (sortBy === 'investment_desc') {
      sortOptions = { investmentMax: -1 };
    } else if (sortBy === 'roi_asc') {
      sortOptions = { roiPeriodMonths: 1 };
    } else if (sortBy === 'units') {
      sortOptions = { unitsOperational: -1 };
    } else if (sortBy === 'newest') {
      sortOptions = { createdAt: -1 };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const total = await Franchise.countDocuments(query);
    const franchises = await Franchise.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('brandOwner', 'name email company phone');

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          franchises,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
        'Franchises retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/franchises/:slug
const getFranchiseBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    let franchise = await Franchise.findOne({ slug }).populate(
      'brandOwner',
      'name email company phone city'
    );

    // Fallback: search by _id if slug matches ObjectId format
    if (!franchise && slug.match(/^[0-9a-fA-F]{24}$/)) {
      franchise = await Franchise.findById(slug).populate(
        'brandOwner',
        'name email company phone city'
      );
    }

    if (!franchise) {
      return next(new ApiError(404, `Franchise listing '${slug}' not found`));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { franchise }, 'Franchise details retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/franchises
const createFranchise = async (req, res, next) => {
  try {
    const payload = req.body;
    let baseSlug = createSlug(payload.name);
    let slug = baseSlug;

    // Check slug collision
    let counter = 1;
    while (await Franchise.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const franchise = new Franchise({
      ...payload,
      slug,
      brandOwner: req.user._id,
    });

    await franchise.save();

    return res
      .status(201)
      .json(new ApiResponse(201, { franchise }, 'Franchise created successfully'));
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/franchises/:id
const updateFranchise = async (req, res, next) => {
  try {
    const { id } = req.params;
    const franchise = await Franchise.findById(id);

    if (!franchise) {
      return next(new ApiError(404, 'Franchise not found'));
    }

    // IDOR check: brandOwner or admin only
    const isOwner = franchise.brandOwner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new ApiError(403, 'Forbidden: You do not own this franchise listing.'));
    }

    Object.assign(franchise, req.body);
    await franchise.save();

    return res
      .status(200)
      .json(new ApiResponse(200, { franchise }, 'Franchise updated successfully'));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/franchises/:id
const deleteFranchise = async (req, res, next) => {
  try {
    const { id } = req.params;
    const franchise = await Franchise.findById(id);

    if (!franchise) {
      return next(new ApiError(404, 'Franchise not found'));
    }

    const isOwner = franchise.brandOwner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new ApiError(403, 'Forbidden: You do not own this franchise listing.'));
    }

    await franchise.deleteOne();
    return res.status(200).json(new ApiResponse(200, null, 'Franchise deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFranchises,
  getFranchiseBySlug,
  createFranchise,
  updateFranchise,
  deleteFranchise,
};
