const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    investor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['franchise', 'business'],
      required: true,
      default: 'franchise',
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetModel',
      index: true,
    },
    targetModel: {
      type: String,
      required: true,
      enum: ['Franchise', 'BusinessForSale'],
      default: 'Franchise',
    },
    // Backwards-compatible alias for existing franchise tests & code
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Franchise',
      index: true,
    },
    // The listing owner (franchise brand owner or business seller)
    listingOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Backwards-compatible alias for brandOwner
    brandOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    investmentBudget: {
      type: Number,
      required: [true, 'Planned investment budget in INR is required'],
    },
    targetCity: {
      type: String,
      required: [true, 'Target city or territory is required'],
      trim: true,
    },
    timeline: {
      type: String,
      enum: ['Immediately (Within 30 days)', '1 - 3 Months', '3 - 6 Months', 'Exploring Options'],
      default: '1 - 3 Months',
    },
    hasCommercialSpace: {
      type: Boolean,
      default: false,
    },
    spaceAvailableSqFt: {
      type: Number,
      default: 0,
    },
    message: {
      type: String,
      required: [true, 'Inquiry message or background is required'],
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['new', 'under_review', 'contacted', 'converted', 'rejected'],
      default: 'new',
      index: true,
    },
    statusHistory: [
      {
        from: { type: String, required: true },
        to: { type: String, required: true },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        at: { type: Date, default: Date.now },
        reason: { type: String, default: '' },
      },
    ],
    leadScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 75,
    },
    scoreBreakdown: {
      budgetFit: { type: Number, default: 0 },
      timelineUrgency: { type: Number, default: 0 },
      profileCompleteness: { type: Number, default: 0 },
      accountTrust: { type: Number, default: 0 },
      messageQuality: { type: Number, default: 0 },
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound indexes for rapid lookups and abuse prevention
leadSchema.index({ targetType: 1, targetId: 1, status: 1 });
leadSchema.index({ listingOwner: 1, status: 1 });
leadSchema.index({ investor: 1, targetId: 1, status: 1 });

// Synchronize legacy aliases
leadSchema.pre('save', function (next) {
  if (this.targetType === 'franchise') {
    if (!this.brandId && this.targetId) this.brandId = this.targetId;
    if (!this.targetId && this.brandId) this.targetId = this.brandId;
  }
  if (!this.brandOwner && this.listingOwner) this.brandOwner = this.listingOwner;
  if (!this.listingOwner && this.brandOwner) this.listingOwner = this.brandOwner;
  next();
});

module.exports = mongoose.model('Lead', leadSchema);
