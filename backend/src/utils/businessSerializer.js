/**
 * Single Serializer Function for Business-for-Sale listings.
 * Enforces strict, server-side confidentiality gating.
 * Protected fields are ONLY included if the viewer is the listing seller,
 * a platform admin, or has executed a valid NdaAgreement.
 * 
 * STRICT RULE: When viewer lacks access, protectedFinancials is OMITTED entirely (no key, no null).
 */

const PROTECTED_KEYS = [
  'exactRevenue',
  'exactNetProfit',
  'balanceSheetSummary',
  'exactAddress',
  'customerConcentration',
  'reasonForSale',
  'sellerContact',
];

const serializeBusiness = (doc, viewer = null, hasNda = false, isList = false) => {
  if (!doc) return null;
  const raw = doc.toObject ? doc.toObject() : { ...doc };

  const sellerId =
    raw.seller && typeof raw.seller === 'object' && raw.seller._id
      ? raw.seller._id.toString()
      : raw.seller
      ? raw.seller.toString()
      : null;

  const viewerId = viewer && viewer._id ? viewer._id.toString() : null;

  const isOwner = Boolean(sellerId && viewerId && sellerId === viewerId);
  const isAdmin = Boolean(viewer && viewer.role === 'admin');

  // List view is ALWAYS teaser-only; Detail view unlocks protected data only if authorized
  const canAccessProtected = !isList && (isOwner || isAdmin || Boolean(hasNda));

  const serialized = {
    id: raw._id,
    _id: raw._id,
    title: raw.title,
    slug: raw.slug,
    listingType: raw.listingType,
    industry: raw.industry,
    region: raw.region,
    establishedYear: raw.establishedYear,
    employeeCountBand: raw.employeeCountBand,
    revenueBand: raw.revenueBand,
    profitBand: raw.profitBand,
    askingPriceBand: raw.askingPriceBand,
    summary: raw.summary,
    status: raw.status,
    rejectionReason: raw.rejectionReason || null,
    isVerified: raw.isVerified,
    isSampleData: raw.isSampleData,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };

  if (raw.seller && typeof raw.seller === 'object') {
    serialized.seller = {
      id: raw.seller._id,
      name: raw.seller.name || 'Verified Seller',
      company: raw.seller.company || '',
    };
  }

  // ONLY attach protectedFinancials if authorized; otherwise omit key completely
  if (canAccessProtected && raw.protectedFinancials) {
    serialized.protectedFinancials = {
      exactRevenue: raw.protectedFinancials.exactRevenue ?? 0,
      exactNetProfit: raw.protectedFinancials.exactNetProfit ?? 0,
      balanceSheetSummary: raw.protectedFinancials.balanceSheetSummary ?? '',
      exactAddress: raw.protectedFinancials.exactAddress ?? '',
      customerConcentration: raw.protectedFinancials.customerConcentration ?? '',
      reasonForSale: raw.protectedFinancials.reasonForSale ?? '',
      sellerContact: raw.protectedFinancials.sellerContact ?? '',
    };
  }

  return serialized;
};

module.exports = {
  PROTECTED_KEYS,
  serializeBusiness,
};
