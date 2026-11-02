const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
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
    eventType: {
      type: String,
      enum: ['Exhibition', 'Investor Summit', 'Networking Meetup', 'Webinar'],
      default: 'Exhibition',
    },
    city: {
      type: String,
      required: true,
      index: true,
    },
    venue: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    ticketPrice: {
      type: Number,
      default: 0, // 0 = Free Entry
    },
    description: {
      type: String,
      required: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    speakers: [
      {
        name: String,
        designation: String,
        company: String,
        avatarUrl: String,
      },
    ],
    exhibitorsCount: {
      type: Number,
      default: 50,
    },
    coverImageUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound index on (city, startDate)
eventSchema.index({ city: 1, startDate: 1 });

module.exports = mongoose.model('Event', eventSchema);
