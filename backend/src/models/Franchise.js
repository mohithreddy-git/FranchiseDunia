const mongoose = require('mongoose');

/**
 * Currency Storage Convention:
 * All financial amounts (investmentMin, investmentMax, franchiseFee, revenue, etc.)
 * are stored as whole INTEGER INR RUPEES (e.g., ₹5,00,000 -> 500000).
 * Formatting into INR Lakhs / Crores / comma separators is done client-side
 * using Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).
 */
const franchiseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand/Franchise name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: [200, 'Tagline cannot exceed 200 characters'],
      default: '',
    },
    industry: {
      type: String,
      required: [true, 'Industry classification is required'],
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
    brandOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Brand owner is required'],
      index: true,
    },
    // Investment range in whole INR Rupees
    investmentMin: {
      type: Number,
      required: [true, 'Minimum investment amount in INR is required'],
      min: [0, 'Investment cannot be negative'],
    },
    investmentMax: {
      type: Number,
      required: [true, 'Maximum investment amount in INR is required'],
      min: [0, 'Investment cannot be negative'],
    },
    franchiseFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    royaltyPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    spaceMinSqFt: {
      type: Number,
      required: [true, 'Minimum floor area required in sq. ft.'],
      min: 0,
    },
    spaceMaxSqFt: {
      type: Number,
      default: 0,
    },
    roiPeriodMonths: {
      type: Number,
      required: [true, 'Expected ROI period in months is required'],
      min: 1,
    },
    unitsOperational: {
      type: Number,
      default: 1,
      min: 1,
    },
    headquarters: {
      type: String,
      default: 'Mumbai, India',
    },
    availableLocations: {
      type: [String],
      default: ['Pan-India'],
      index: true,
    },
    establishedYear: {
      type: Number,
      default: 2018,
    },
    description: {
      type: String,
      required: [true, 'Franchise description is required'],
    },
    supportProvided: {
      type: [String],
      default: [
        'Site Selection & Architecture',
        'Staff Recruitment & Training',
        'Central Supply Chain & Inventory',
        'National Marketing & Branding',
        'POS & ERP Software Suite',
      ],
    },
    unitEconomics: {
      expectedMonthlyRevenue: { type: Number, default: 0 },
      expectedNetProfitMargin: { type: Number, default: 20 },
      paybackPeriodMonths: { type: Number, default: 18 },
      breakEvenPeriodMonths: { type: Number, default: 6 },
    },
    logoUrl: {
      type: String,
      default: '',
    },
    coverImageUrl: {
      type: String,
      default: '',
    },
    gallery: {
      type: [String],
      default: [],
    },
    brochureUrl: {
      type: String,
      default: '/docs/brochure-sample.pdf',
    },
    isVerified: {
      type: Boolean,
      default: true,
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
    isSampleData: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Search text index on name, tagline, industry
franchiseSchema.index(
  { name: 'text', tagline: 'text', industry: 'text' },
  { weights: { name: 10, industry: 5, tagline: 2 } }
);

// Compound index for high performance range filtering
franchiseSchema.index({ industry: 1, investmentMin: 1, investmentMax: 1 });

module.exports = mongoose.model('Franchise', franchiseSchema);
