const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' }, // Home, Work, etc.
  street: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: String,
  phone: String,
  isDefault: { type: Boolean, default: false }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String },
  avatar: { type: String },
  // Google OAuth fields
  googleId: { type: String, sparse: true },
  isGoogleUser: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ['customer', 'staff', 'admin'],
    default: 'customer'
  },
  addresses: [addressSchema],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  preferences: {
    notifications: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false },
    dietaryRestrictions: [String] // vegetarian, vegan, gluten-free, etc.
  },
  loyaltyPoints: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastOrderDate: Date,
  isActive: { type: Boolean, default: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, { timestamps: true });

// Index for searching users
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
