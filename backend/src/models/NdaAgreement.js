const mongoose = require('mongoose');

const ndaAgreementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    business: {
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
      required: [true, 'Legal signed name is required'],
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

// Unique compound index on (user, business) guarantees idempotency & single active agreement per listing
ndaAgreementSchema.index({ user: 1, business: 1 }, { unique: true });

module.exports = mongoose.model('NdaAgreement', ndaAgreementSchema);
