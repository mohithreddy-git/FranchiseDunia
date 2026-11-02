const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['exhibition', 'investor_summit', 'networking', 'webinar'],
      default: 'exhibition',
      index: true,
    },
    city: {
      type: String,
      required: [true, 'Host city is required'],
      trim: true,
      index: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue location is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Attendee capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    ticketPrice: {
      type: Number,
      default: 0, // Integer INR Rupees, 0 = Free admission
      min: 0,
    },
    description: {
      type: String,
      required: [true, 'Event summary is required'],
    },
    agenda: [
      {
        time: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
      },
    ],
    speakers: [
      {
        name: { type: String, required: true },
        title: { type: String, required: true },
        org: { type: String, default: '' },
        photoUrl: { type: String, default: '' },
      },
    ],
    exhibitors: [
      {
        name: { type: String, required: true },
        boothNo: { type: String, default: '' },
        industry: { type: String, default: '' },
      },
    ],
    organizer: {
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
    isSampleData: {
      type: Boolean,
      default: false,
    },
    coverImageUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound index on (city, startDate) for fast date-ordered city queries
eventSchema.index({ city: 1, startDate: 1 });
eventSchema.index({ status: 1, startDate: 1 });

module.exports = mongoose.model('Event', eventSchema);
