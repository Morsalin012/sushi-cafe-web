/**
 * Reservation Model
 * Table reservations for Haru Sora Café
 */

const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  guestName: {
    type: String,
    required: [true, 'Guest name is required'],
    trim: true
  },
  guestEmail: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  guestPhone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  date: {
    type: Date,
    required: [true, 'Reservation date is required']
  },
  time: {
    type: String,
    required: [true, 'Reservation time is required']
  },
  partySize: {
    type: Number,
    required: [true, 'Party size is required'],
    min: [1, 'Party size must be at least 1'],
    max: [20, 'For parties larger than 20, please call us']
  },
  tableNumber: {
    type: Number,
    min: 1
  },
  occasion: {
    type: String,
    enum: ['none', 'birthday', 'anniversary', 'business', 'date', 'celebration', 'other']
  },
  specialRequests: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  confirmationCode: {
    type: String,
    unique: true
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  notes: String, // Internal staff notes
  cancelledAt: Date,
  cancellationReason: String
}, {
  timestamps: true
});

// Generate confirmation code before saving
reservationSchema.pre('save', function(next) {
  if (!this.confirmationCode) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'HSC-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.confirmationCode = code;
  }
  next();
});

// Indexes
reservationSchema.index({ date: 1, time: 1 });
reservationSchema.index({ user: 1 });
reservationSchema.index({ guestEmail: 1 });
reservationSchema.index({ confirmationCode: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
