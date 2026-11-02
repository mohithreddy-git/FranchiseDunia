const mongoose = require('mongoose');

const brochureDownloadSchema = new mongoose.Schema(
  {
    franchise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Franchise',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    ipHash: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
    downloadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

brochureDownloadSchema.index({ franchise: 1, downloadedAt: -1 });

module.exports = mongoose.model('BrochureDownload', brochureDownloadSchema);
