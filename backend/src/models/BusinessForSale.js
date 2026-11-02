const mongoose = require('mongoose');

const businessForSaleSchema = new mongoose.Schema(
  {
    // --- 1. TEASER FIELDS (Publicly viewable) ---
    title: {
      type: String,
      required: [true, 'Listing title is required'],
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    listingType: {
      type: String,
      required: true,
      enum: ['sale', 'joint_venture', 'equity_stake', 'partnership'],
      default: 'sale',
      index: true,
    },
    industry: {
      type: String,
      required: true,
      enum: [
        'Food & Beverage',
        'Retail',
        'Healthcare',
        'Education',
        'Technology',
        'Fitness & Wellness',
        'Logistics & Supply Chain',
        'Automotive & Mobility',
      ],
      index: true,
    },
    // Broad, city-level region only to preserve anonymity before NDA
    region: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    establishedYear: {
      type: Number,
      required: true,
    },
    employeeCountBand: {
      type: String,
      required: true,
      default: '5-15',
    },
    revenueBand: {
      type: String,
      required: true, // e.g. "₹1 - 5 Cr"
    },
    profitBand: {
      type: String,
      required: true, // e.g. "₹25 - 50 Lakhs"
    },
    askingPriceBand: {
      type: String,
      required: true, // e.g. "₹2 - 3 Cr"
    },
    summary: {
      type: String,
      required: [true, 'Teaser summary is required'],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    isSampleData: {
      type: Boolean,
      default: false,
    },

    // --- 2. PROTECTED FIELDS (NDA-Only, select: false by default) ---
    // Kept strictly out of text indexes and queries to prevent inferential leakage
    protectedFinancials: {
      type: {
        exactRevenue: { type: Number, default: 0 },
        exactNetProfit: { type: Number, default: 0 },
        balanceSheetSummary: { type: String, default: '' },
        exactAddress: { type: String, default: '' },
        customerConcentration: { type: String, default: '' },
        reasonForSale: { type: String, default: '' },
        sellerContact: { type: String, default: '' },
      },
      select: false, // Hidden at the database query level unless explicitly requested
    },
  },
  { timestamps: true }
);

// Indexes on teaser fields ONLY.
// Protected fields are deliberately NOT indexed to prevent side-channel inference.
businessForSaleSchema.index({ listingType: 1, industry: 1 });
businessForSaleSchema.index({ status: 1, region: 1 });

module.exports = mongoose.model('BusinessForSale', businessForSaleSchema);
