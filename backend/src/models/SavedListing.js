const mongoose = require('mongoose');

const savedListingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['franchise', 'event', 'business'],
      required: true,
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
      enum: ['Franchise', 'Event', 'BusinessForSale'],
    },
  },
  { timestamps: true }
);

// Unique on (user, targetType, targetId)
savedListingSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('SavedListing', savedListingSchema);
