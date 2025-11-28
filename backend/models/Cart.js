/**
 * Cart Model
 * Shopping cart for Haru Sora Café
 */

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  specialInstructions: {
    type: String,
    maxlength: 500
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Method to calculate totals (needs to be called after populate)
cartSchema.methods.calculateTotals = function() {
  let subtotal = 0;
  
  this.items.forEach(item => {
    if (item.product && item.product.price) {
      subtotal += item.product.price * item.quantity;
    }
  });
  
  const tax = Math.round(subtotal * 0.05); // 5% VAT
  const deliveryFee = subtotal > 1000 ? 0 : 50; // Free delivery over ৳1000
  const total = subtotal + tax + deliveryFee;
  
  return {
    subtotal,
    tax,
    deliveryFee,
    total,
    itemCount: this.totalItems
  };
};

// Pre-save middleware to update lastUpdated
cartSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Index for user lookup (auto-created by unique:true on user field)

module.exports = mongoose.model('Cart', cartSchema);
