/**
 * Product Model
 * Stores menu items for Haru Sora Café
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: true,
    enum: ['Sushi', 'Rolls', 'Coffee', 'Desserts', 'Drinks', 'Specials'],
    default: 'Sushi'
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 100,
    min: 0
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isSpicy: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  }
}, {
  timestamps: true
});

// Index for search and filtering
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);
