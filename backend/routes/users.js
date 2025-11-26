/**
 * User Routes
 * API endpoints for user profile and features
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const bcrypt = require('bcryptjs');

// GET /api/users/:id - Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate('wishlist', 'name price image isAvailable');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// PUT /api/users/:id - Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, preferences },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`✅ User profile updated: ${user.email}`);
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// PUT /api/users/:id/password - Change password
router.put('/:id/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    console.log(`✅ Password changed: ${user.email}`);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
});

// ============================================
// Address Management
// ============================================

// POST /api/users/:id/addresses - Add address
router.post('/:id/addresses', async (req, res) => {
  try {
    const { label, street, city, postalCode, phone, isDefault } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If this is default, unset other defaults
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({ label, street, city, postalCode, phone, isDefault });
    await user.save();

    res.status(201).json({
      message: 'Address added',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ message: 'Error adding address' });
  }
});

// PUT /api/users/:id/addresses/:addressId - Update address
router.put('/:id/addresses/:addressId', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // If setting as default, unset other defaults
    if (req.body.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    Object.assign(address, req.body);
    await user.save();

    res.json({
      message: 'Address updated',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ message: 'Error updating address' });
  }
});

// DELETE /api/users/:id/addresses/:addressId - Delete address
router.delete('/:id/addresses/:addressId', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.addresses.pull(req.params.addressId);
    await user.save();

    res.json({
      message: 'Address deleted',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Error deleting address' });
  }
});

// ============================================
// Wishlist Management
// ============================================

// GET /api/users/:id/wishlist - Get wishlist
router.get('/:id/wishlist', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('wishlist', 'name price image category isAvailable rating');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.wishlist);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Error fetching wishlist' });
  }
});

// POST /api/users/:id/wishlist - Add to wishlist
router.post('/:id/wishlist', async (req, res) => {
  try {
    const { productId } = req.body;

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: 'Already in wishlist' });
    }

    user.wishlist.push(productId);
    await user.save();

    console.log(`✅ Added to wishlist: ${product.name}`);
    res.json({ message: 'Added to wishlist' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Error adding to wishlist' });
  }
});

// DELETE /api/users/:id/wishlist/:productId - Remove from wishlist
router.delete('/:id/wishlist/:productId', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.wishlist.pull(req.params.productId);
    await user.save();

    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Error removing from wishlist' });
  }
});

module.exports = router;
