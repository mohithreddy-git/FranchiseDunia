const mongoose = require('mongoose');

const businessForSaleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
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
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    askingPrice: {
      type: Number,
      required: true, // Integer INR Rupees
    },
    city: {
      type: String,
      required: true,
    },
    establishedYear: {
      type: Number,
      required: true,
    },
    teaserDescription: {
      type: String,
      required: true,
    },
    // Protected Fields (Stripped unless NDA signed)
    protectedFinancials: {
      annualRevenue: { type: Number, default: 0 },
      netProfit: { type: Number, default: 0 },
      inventoryValue: { type: Number, default: 0 },
      monthlyRent: { type: Number, default: 0 },
      exactAddress: { type: String, default: '' },
      customerCount: { type: Number, default: 0 },
      confidentialNotes: { type: String, default: '' },
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BusinessForSale', businessForSaleSchema);
