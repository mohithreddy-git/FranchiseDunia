const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    investor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Franchise',
      required: true,
      index: true,
    },
    brandOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    leadScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 75,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound index as required by architecture specifications
leadSchema.index({ brandId: 1, status: 1 });
leadSchema.index({ brandOwner: 1, status: 1 });

module.exports = mongoose.model('Lead', leadSchema);
