const Franchise = require('../models/Franchise');
const BrochureDownload = require('../models/BrochureDownload');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { attachSavedFlags } = require('../utils/savedHelper');
const { hasKeyFieldChanged } = require('../utils/keyFields');
const { hashIp } = require('../utils/ipHasher');
const rateLimit = require('express-rate-limit');

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
      q,
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
    const term = (q || search || '').trim();
    if (term) {
      const searchRegex = new RegExp(term, 'i');
      query.$or = [
        { name: searchRegex },
        { tagline: searchRegex },
        { industry: searchRegex },
        { description: searchRegex },
      ];
    }

    // 2. Industry Filtering
    if (industry && industry !== 'All') {
      const indList = Array.isArray(industry) ? industry : industry.split(',');
      const regexConditions = indList.map((item) => new RegExp(item.trim(), 'i'));
      query.industry = { $in: regexConditions };
    }

    // 3. Investment Range
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

    // 9. Listing Approval Status
    if (req.user && req.user.role === 'admin') {
      if (req.query.status) query.status = req.query.status;
    } else if (req.user && req.user.role === 'brand_owner') {
      query.$or = [{ status: 'approved' }, { brandOwner: req.user._id }];
    } else {
      query.status = 'approved';
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

    // Pagination: Capped at max 50 per page
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const total = await Franchise.countDocuments(query);
    const rawFranchises = await Franchise.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('brandOwner', 'name email company phone');

    // Attach isSaved flags with ONE single query
    const franchises = await attachSavedFlags(rawFranchises, 'franchise', req.user);

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

    if (!franchise && slug.match(/^[0-9a-fA-F]{24}$/)) {
      franchise = await Franchise.findById(slug).populate(
        'brandOwner',
        'name email company phone city'
      );
    }

    if (!franchise) {
      return next(new ApiError(404, `Franchise listing '${slug}' not found`));
    }

    if (franchise.status !== 'approved') {
      const isOwner =
        req.user &&
        franchise.brandOwner &&
        franchise.brandOwner._id.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return next(new ApiError(404, `Franchise listing '${slug}' not found`));
      }
    }

    const [withSaved] = await attachSavedFlags([franchise], 'franchise', req.user);

    return res
      .status(200)
      .json(new ApiResponse(200, { franchise: withSaved }, 'Franchise details retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/franchises
const createFranchise = async (req, res, next) => {
  try {
    const {
      name,
      tagline,
      industry,
      investmentMin,
      investmentMax,
      franchiseFee,
      royaltyPercent,
      spaceMinSqFt,
      spaceMaxSqFt,
      roiPeriodMonths,
      unitsOperational,
      headquarters,
      availableLocations,
      establishedYear,
      description,
      supportProvided,
      unitEconomics,
      logoUrl,
      coverImageUrl,
      gallery,
      brochureUrl,
    } = req.body;

    let baseSlug = createSlug(name);
    let slug = baseSlug;

    let counter = 1;
    while (await Franchise.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const franchise = new Franchise({
      name,
      slug,
      tagline,
      industry,
      investmentMin,
      investmentMax,
      franchiseFee,
      royaltyPercent,
      spaceMinSqFt,
      spaceMaxSqFt,
      roiPeriodMonths,
      unitsOperational,
      headquarters,
      availableLocations,
      establishedYear,
      description,
      supportProvided,
      unitEconomics,
      logoUrl,
      coverImageUrl,
      gallery,
      brochureUrl: brochureUrl || '/docs/brochure-sample.pdf',
      brandOwner: req.user._id,
      status: req.user.role === 'admin' ? 'approved' : 'pending',
      isSampleData: false,
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

    const isOwner = franchise.brandOwner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new ApiError(403, 'Forbidden: You do not own this franchise listing.'));
    }

    // Whitelist allowed fields (strictly disallow self-approval / setting status, brandOwner, isSampleData)
    const allowedFields = [
      'name',
      'tagline',
      'industry',
      'investmentMin',
      'investmentMax',
      'franchiseFee',
      'royaltyPercent',
      'spaceMinSqFt',
      'spaceMaxSqFt',
      'roiPeriodMonths',
      'unitsOperational',
      'headquarters',
      'availableLocations',
      'establishedYear',
      'description',
      'supportProvided',
      'unitEconomics',
      'logoUrl',
      'coverImageUrl',
      'gallery',
      'brochureUrl',
    ];

    const safeUpdate = {};
    for (const f of allowedFields) {
      if (req.body[f] !== undefined) {
        safeUpdate[f] = req.body[f];
      }
    }

    // Re-approval rule: if approved listing changes a key field, reset to pending
    if (!isAdmin && franchise.status === 'approved') {
      if (hasKeyFieldChanged('franchise', safeUpdate, franchise)) {
        safeUpdate.status = 'pending';
      }
    }

    Object.assign(franchise, safeUpdate);
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

// GET /api/v1/franchises/:slug/brochure (Download & Track)
const downloadBrochure = async (req, res, next) => {
  try {
    const { slug } = req.params;
    let franchise = await Franchise.findOne({ slug });
    if (!franchise && slug.match(/^[0-9a-fA-F]{24}$/)) {
      franchise = await Franchise.findById(slug);
    }

    if (!franchise || franchise.status !== 'approved') {
      return next(new ApiError(404, 'Franchise brochure not found or listing not active'));
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const hashed = hashIp(ip);

    // Record download asynchronously
    await BrochureDownload.create({
      franchise: franchise._id,
      user: req.user?._id || null,
      ipHash: hashed,
      userAgent,
      downloadedAt: new Date(),
    });

    // Validate brochureUrl against allowed targets to prevent open redirect
    const targetUrl = franchise.brochureUrl || '/docs/brochure-sample.pdf';

    // Allow-list check
    const isLocalPath = targetUrl.startsWith('/') && !targetUrl.startsWith('//');
    let isAllowedHost = false;
    if (!isLocalPath) {
      try {
        const parsed = new URL(targetUrl);
        const allowedHosts = [
          'franchisedunia.in',
          'assets.franchisedunia.in',
          'drive.google.com',
          'localhost',
          '127.0.0.1',
        ];
        isAllowedHost = parsed.protocol === 'https:' && allowedHosts.some((h) => parsed.hostname.endsWith(h));
      } catch {
        isAllowedHost = false;
      }
    }

    if (!isLocalPath && !isAllowedHost) {
      return next(new ApiError(400, 'Security violation: Brochure URL target is not on the approved host list.'));
    }

    // Serve placeholder PDF header or redirect
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${franchise.slug}-brochure.pdf"`);
    // Minimal valid PDF binary string
    const samplePdf = `%PDF-1.4\n1 0 obj\n<< /Title (${franchise.name} Official Franchise Deck) /Author (FranchiseDunia) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n`;
    return res.status(200).send(samplePdf);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/franchises/:id/brochure-analytics
const getBrochureAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    let franchise = await Franchise.findById(id);
    if (!franchise) {
      franchise = await Franchise.findOne({ slug: id });
    }

    if (!franchise) {
      return next(new ApiError(404, 'Franchise not found'));
    }

    // Ownership check: Only listing owner or admin can view brochure analytics
    const isOwner = franchise.brandOwner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return next(new ApiError(403, 'Forbidden: You do not own this franchise listing.'));
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const stats = await BrochureDownload.aggregate([
      { $match: { franchise: franchise._id, downloadedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          totalDownloads: { $sum: 1 },
          uniqueIps: { $addToSet: '$ipHash' },
        },
      },
      {
        $project: {
          _id: 0,
          totalDownloads: 1,
          uniqueDownloads: { $size: '$uniqueIps' },
        },
      },
    ]);

    const result = stats[0] || { totalDownloads: 0, uniqueDownloads: 0 };

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          franchiseId: franchise._id,
          slug: franchise.slug,
          periodDays: 30,
          totalDownloads: result.totalDownloads,
          uniqueDownloads: result.uniqueDownloads,
        },
        'Brochure analytics retrieved successfully'
      )
    );
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
  downloadBrochure,
  getBrochureAnalytics,
};
