/**
 * Cart Routes
 * API endpoints for shopping cart
 */

const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper to get or create cart
async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

// GET /api/cart - Get user's cart
router.get('/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId })
      .populate('items.product', 'name price image isAvailable stock');

    if (!cart) {
      return res.json({
        items: [],
        totals: { subtotal: 0, tax: 0, deliveryFee: 0, total: 0, itemCount: 0 }
      });
    }

    // Filter out unavailable products and calculate totals
    cart.items = cart.items.filter(item => item.product && item.product.isAvailable);
    const totals = cart.calculateTotals();

    res.json({
      items: cart.items,
      totals,
      lastUpdated: cart.lastUpdated
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Error fetching cart' });
  }
});

// POST /api/cart/add - Add item to cart
router.post('/add', async (req, res) => {
  try {
    const { userId, productId, quantity = 1, specialInstructions } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ message: 'User ID and Product ID are required' });
    }

    // Verify product exists and is available
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (!product.isAvailable) {
      return res.status(400).json({ message: 'Product is not available' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Get or create cart
    let cart = await getOrCreateCart(userId);

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
      if (specialInstructions) {
        cart.items[existingItemIndex].specialInstructions = specialInstructions;
      }
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        specialInstructions
      });
    }

    await cart.save();

    // Populate and return updated cart
    await cart.populate('items.product', 'name price image isAvailable stock');
    const totals = cart.calculateTotals();

    console.log(`✅ Added to cart: ${product.name} x${quantity}`);
    res.json({
      message: 'Item added to cart',
      items: cart.items,
      totals
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Error adding to cart' });
  }
});

// PUT /api/cart/update - Update item quantity
router.put('/update', async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || quantity === undefined) {
      return res.status(400).json({ message: 'User ID, Product ID, and quantity are required' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not in cart' });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items.splice(itemIndex, 1);
    } else {
      // Verify stock
      const product = await Product.findById(productId);
      if (product.stock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.product', 'name price image isAvailable stock');
    const totals = cart.calculateTotals();

    res.json({
      message: 'Cart updated',
      items: cart.items,
      totals
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Error updating cart' });
  }
});

// DELETE /api/cart/remove - Remove item from cart
router.delete('/remove', async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ message: 'User ID and Product ID are required' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate('items.product', 'name price image isAvailable stock');
    const totals = cart.calculateTotals();

    res.json({
      message: 'Item removed from cart',
      items: cart.items,
      totals
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Error removing from cart' });
  }
});

// DELETE /api/cart/clear/:userId - Clear entire cart
router.delete('/clear/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    res.json({
      message: 'Cart cleared',
      items: [],
      totals: { subtotal: 0, tax: 0, deliveryFee: 0, total: 0, itemCount: 0 }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Error clearing cart' });
  }
});

module.exports = router;
