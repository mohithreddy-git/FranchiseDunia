const BusinessForSale = require('../models/BusinessForSale');
const NdaAgreement = require('../models/NdaAgreement');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { serializeBusiness, PROTECTED_KEYS } = require('../utils/businessSerializer');
const { attachSavedFlags } = require('../utils/savedHelper');
const { hasKeyFieldChanged } = require('../utils/keyFields');

const CURRENT_NDA_VERSION = 'v1.0';

const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Forbidden filter keys to prevent side-channel inference of confidential data
const FORBIDDEN_FILTER_KEYS = [
  'exactrevenue',
  'minrevenue',
  'maxrevenue',
  'revenue',
  'exactnetprofit',
  'minnetprofit',
  'maxnetprofit',
  'netprofit',
  'balancesheet',
  'exactaddress',
  'address',
  'customerconcentration',
  'reasonforsale',
  'sellercontact',
];

// GET /api/v1/business-for-sale (List endpoint: ALWAYS Teaser fields only)
const getBusinesses = async (req, res, next) => {
  try {
    const queryParams = req.query;

    // SECURITY CHECK: Reject any attempt to filter/sort on protected fields
    for (const key of Object.keys(queryParams)) {
      const lowerKey = key.toLowerCase();
      if (FORBIDDEN_FILTER_KEYS.includes(lowerKey)) {
        return next(
          new ApiError(
            400,
            `Filter parameter '${key}' is prohibited. Direct filtering on confidential financial metrics is disallowed to protect seller confidentiality. Please filter via public teaser bands.`
          )
        );
      }
    }

    const {
      q,
      search,
      listingType,
      industry,
      region,
      revenueBand,
      profitBand,
      askingPriceBand,
      establishedYear,
      sortBy = 'newest',
      sort,
      page = 1,
      limit = 12,
    } = queryParams;

    // Check sort parameter for protected fields
    const effectiveSort = sort || sortBy;
    if (effectiveSort) {
      const lowerSort = effectiveSort.toLowerCase().replace(/^[+-]/, '').trim();
      if (FORBIDDEN_FILTER_KEYS.includes(lowerSort)) {
        return next(
          new ApiError(
            400,
            `Sorting by confidential field '${effectiveSort}' is strictly disallowed.`
          )
        );
      }
    }

    const query = {};

    // 1. Text Search 'q' allowed against TEASER fields only (title, summary, industry)
    const searchQuery = q || search;
    if (searchQuery && searchQuery.trim()) {
      const searchRegex = new RegExp(searchQuery.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { summary: searchRegex },
        { industry: searchRegex },
        { region: searchRegex },
      ];
    }

    // 2. Status Filter: Public endpoints return ONLY 'approved'. Sellers see their own at any status; admins see all.
    if (req.user && req.user.role === 'admin') {
      if (req.query.status) query.status = req.query.status;
    } else if (req.user && req.user.role === 'business_seller') {
      query.$or = [{ status: 'approved' }, { seller: req.user._id }];
    } else {
      query.status = 'approved';
    }

    // 3. Teaser Filter Fields
    if (listingType && listingType !== 'All') {
      query.listingType = listingType;
    }

    if (industry && industry !== 'All') {
      query.industry = new RegExp(`^${industry.trim()}$`, 'i');
    }

    if (region && region !== 'All') {
      query.region = new RegExp(region.trim(), 'i');
    }

    if (revenueBand && revenueBand !== 'All') {
      query.revenueBand = revenueBand;
    }

    if (profitBand && profitBand !== 'All') {
      query.profitBand = profitBand;
    }

    if (askingPriceBand && askingPriceBand !== 'All') {
      query.askingPriceBand = askingPriceBand;
    }

    if (establishedYear) {
      query.establishedYear = Number(establishedYear);
    }

    // Pagination: Capped at max 50 per page
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const total = await BusinessForSale.countDocuments(query);
    const rawListings = await BusinessForSale.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('seller', 'name email company');

    // STRICT: Pass every listing through serializeBusiness with isList: true
    let businesses = rawListings.map((doc) =>
      serializeBusiness(doc, req.user, false, true)
    );

    // Attach isSaved flags in ONE single query for authenticated user
    businesses = await attachSavedFlags(businesses, 'business', req.user);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          businesses,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
        'Business listings retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/business-for-sale/:id (Teaser, plus protected if NDA signed or owner/admin)
const getBusinessById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user has an active NdaAgreement for this business
    let hasNda = false;
    if (req.user) {
      const ndaRecord = await NdaAgreement.findOne({
        user: req.user._id,
        $or: [
          ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ business: id }] : []),
        ],
      });
      hasNda = Boolean(ndaRecord);
    }

    let query = BusinessForSale.findOne({
      $or: [
        { slug: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : []),
      ],
    }).populate('seller', 'name email company phone');

    let businessDoc = await query;
    if (!businessDoc) {
      return next(new ApiError(404, `Business listing '${id}' not found`));
    }

    // Status visibility check
    if (businessDoc.status !== 'approved') {
      const isOwner =
        req.user &&
        businessDoc.seller &&
        businessDoc.seller._id.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return next(new ApiError(404, `Business listing '${id}' not found`));
      }
    }

    // Check NDA if not done by id
    if (req.user && !hasNda) {
      const ndaCheck = await NdaAgreement.findOne({
        user: req.user._id,
        business: businessDoc._id,
      });
      hasNda = Boolean(ndaCheck);
    }

    const isOwner =
      req.user &&
      businessDoc.seller &&
      businessDoc.seller._id.toString() === req.user._id.toString();
    const isAdmin = Boolean(req.user && req.user.role === 'admin');

    // If authorized, fetch with select('+protectedFinancials')
    if (isOwner || isAdmin || hasNda) {
      businessDoc = await BusinessForSale.findById(businessDoc._id)
        .select('+protectedFinancials')
        .populate('seller', 'name email company phone');
    }

    // Serialize through single authorized serialization portal
    let serialized = serializeBusiness(businessDoc, req.user, hasNda, false);

    // Attach isSaved
    const [withSaved] = await attachSavedFlags([serialized], 'business', req.user);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          business: withSaved,
          ndaSigned: hasNda || isOwner || isAdmin,
        },
        'Business listing retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/business-for-sale/:id/nda (Execute Digital NDA)
const signNda = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { signedName, accepted, agreementVersion } = req.body;

    // PINNED NDA VERSION CHECK: Missing or stale agreementVersion returns 400
    if (!agreementVersion || agreementVersion !== CURRENT_NDA_VERSION) {
      return next(
        new ApiError(
          400,
          `Invalid or stale agreement version '${agreementVersion}'. The current legally pinned version is '${CURRENT_NDA_VERSION}'.`
        )
      );
    }

    const business = await BusinessForSale.findOne({
      $or: [
        { slug: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : []),
      ],
    });

    if (!business) {
      return next(new ApiError(404, 'Business listing not found'));
    }

    // Sellers cannot sign an NDA on their own listing
    if (business.seller.toString() === req.user._id.toString()) {
      return next(
        new ApiError(
          400,
          'You are the registered seller of this listing and already possess owner privileges; NDA signing is not permitted on your own listing.'
        )
      );
    }

    // IDEMPOTENCY CHECK
    const existingNda = await NdaAgreement.findOne({
      user: req.user._id,
      business: business._id,
    });

    if (existingNda) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            ndaAgreement: existingNda,
            alreadySigned: true,
            businessId: business._id,
          },
          'Non-Disclosure Agreement was already executed and is active.'
        )
      );
    }

    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Web Browser';

    const agreement = new NdaAgreement({
      user: req.user._id,
      business: business._id,
      agreementVersion,
      signedName,
      ipAddress,
      userAgent,
      signedAt: new Date(),
    });

    await agreement.save();

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          ndaAgreement: agreement,
          alreadySigned: false,
          businessId: business._id,
        },
        'Non-Disclosure Agreement executed successfully. Confidential financials are now unlocked.'
      )
    );
  } catch (err) {
    if (err.code === 11000) {
      const existing = await NdaAgreement.findOne({
        user: req.user._id,
        business: req.params.id,
      });
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { ndaAgreement: existing, alreadySigned: true },
            'Non-Disclosure Agreement is active.'
          )
        );
    }
    next(err);
  }
};

// POST /api/v1/business-for-sale (Seller or Admin)
const createBusiness = async (req, res, next) => {
  try {
    const {
      title,
      listingType,
      industry,
      region,
      establishedYear,
      employeeCountBand,
      revenueBand,
      profitBand,
      askingPriceBand,
      summary,
      protectedFinancials,
    } = req.body;

    let baseSlug = createSlug(title);
    let slug = baseSlug;

    let counter = 1;
    while (await BusinessForSale.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const business = new BusinessForSale({
      title,
      slug,
      listingType,
      industry,
      region,
      establishedYear,
      employeeCountBand,
      revenueBand,
      profitBand,
      askingPriceBand,
      summary,
      protectedFinancials,
      seller: req.user._id,
      status: req.user.role === 'admin' ? 'approved' : 'pending',
      isSampleData: false,
    });

    await business.save();

    const serialized = serializeBusiness(business, req.user, false, false);
    return res
      .status(201)
      .json(new ApiResponse(201, { business: serialized }, 'Business listing created successfully'));
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/business-for-sale/:id (Seller ownership check & Re-approval rule)
const updateBusiness = async (req, res, next) => {
  try {
    const { id } = req.params;
    const business = await BusinessForSale.findById(id).select('+protectedFinancials');

    if (!business) {
      return next(new ApiError(404, 'Business listing not found'));
    }

    const isOwner = business.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(
        new ApiError(403, 'Forbidden: You do not have permission to modify this business listing.')
      );
    }

    // Whitelist allowed update fields (no mass-assignment of status, seller, isSampleData)
    const allowedFields = [
      'title',
      'listingType',
      'industry',
      'region',
      'establishedYear',
      'employeeCountBand',
      'revenueBand',
      'profitBand',
      'askingPriceBand',
      'summary',
      'protectedFinancials',
    ];

    const safeUpdate = {};
    for (const f of allowedFields) {
      if (req.body[f] !== undefined) {
        safeUpdate[f] = req.body[f];
      }
    }

    // Re-approval rule: if approved listing has key fields changed, reset status to 'pending'
    if (!isAdmin && business.status === 'approved') {
      if (hasKeyFieldChanged('business', safeUpdate, business)) {
        safeUpdate.status = 'pending';
      }
    }

    Object.assign(business, safeUpdate);
    await business.save();

    const serialized = serializeBusiness(business, req.user, false, false);
    return res
      .status(200)
      .json(new ApiResponse(200, { business: serialized }, 'Business listing updated successfully'));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/business-for-sale/:id
const deleteBusiness = async (req, res, next) => {
  try {
    const { id } = req.params;
    const business = await BusinessForSale.findById(id);

    if (!business) {
      return next(new ApiError(404, 'Business listing not found'));
    }

    const isOwner = business.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(
        new ApiError(403, 'Forbidden: You do not have permission to delete this business listing.')
      );
    }

    await business.deleteOne();
    return res.status(200).json(new ApiResponse(200, null, 'Business listing deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  CURRENT_NDA_VERSION,
  getBusinesses,
  getBusinessById,
  signNda,
  createBusiness,
  updateBusiness,
  deleteBusiness,
};
