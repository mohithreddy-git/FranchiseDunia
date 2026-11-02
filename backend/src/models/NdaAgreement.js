const mongoose = require('mongoose');

const ndaAgreementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessForSale',
      required: true,
      index: true,
    },
    agreementVersion: {
      type: String,
      default: 'v1.0',
    },
    signedName: {
      type: String,
      required: true,
      trim: true,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: '',
    },
    signedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Unique compound index on (user, businessId)
ndaAgreementSchema.index({ user: 1, businessId: 1 }, { unique: true });

module.exports = mongoose.model('NdaAgreement', ndaAgreementSchema);
