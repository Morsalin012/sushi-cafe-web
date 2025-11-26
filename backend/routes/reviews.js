/**
 * Review Routes
 * API endpoints for product reviews
 */

const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');

// GET /api/reviews/product/:productId - Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [reviews, total] = await Promise.all([
      Review.find({ product: req.params.productId, isVisible: true })
        .populate('user', 'name avatar')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments({ product: req.params.productId, isVisible: true })
    ]);

    // Calculate rating breakdown
    const ratingBreakdown = await Review.aggregate([
      { $match: { product: require('mongoose').Types.ObjectId(req.params.productId), isVisible: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      ratingBreakdown: ratingBreakdown.reduce((acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// POST /api/reviews - Create a review
router.post('/', async (req, res) => {
  try {
    const { userId, productId, orderId, rating, title, comment } = req.body;

    if (!userId || !productId || !rating) {
      return res.status(400).json({ message: 'User ID, Product ID, and rating are required' });
    }

    // Check if user has ordered this product
    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        user: userId,
        'items.product': productId,
        status: { $in: ['delivered', 'completed'] }
      });
      isVerifiedPurchase = !!order;
    } else {
      // Check any past order
      const order = await Order.findOne({
        user: userId,
        'items.product': productId,
        status: { $in: ['delivered', 'completed'] }
      });
      isVerifiedPurchase = !!order;
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      user: userId,
      product: productId,
      order: orderId,
      rating,
      title,
      comment,
      isVerifiedPurchase
    });

    await review.populate('user', 'name avatar');

    console.log(`✅ Review created for product ${productId}`);
    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Error creating review' });
  }
});

// PUT /api/reviews/:id - Update a review
router.put('/:id', async (req, res) => {
  try {
    const { userId, rating, title, comment } = req.body;

    const review = await Review.findOne({ _id: req.params.id, user: userId });
    if (!review) {
      return res.status(404).json({ message: 'Review not found or not authorized' });
    }

    if (rating) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;

    await review.save();
    await review.populate('user', 'name avatar');

    res.json(review);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Error updating review' });
  }
});

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.body;

    const review = await Review.findOne({ _id: req.params.id, user: userId });
    if (!review) {
      return res.status(404).json({ message: 'Review not found or not authorized' });
    }

    const productId = review.product;
    await review.remove();

    // Recalculate product rating
    await Review.calculateAverageRating(productId);

    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Error deleting review' });
  }
});

// POST /api/reviews/:id/helpful - Mark review as helpful
router.post('/:id/helpful', async (req, res) => {
  try {
    const { userId } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user already marked as helpful
    if (review.helpful.users.includes(userId)) {
      // Remove vote
      review.helpful.users.pull(userId);
      review.helpful.count = Math.max(0, review.helpful.count - 1);
    } else {
      // Add vote
      review.helpful.users.push(userId);
      review.helpful.count += 1;
    }

    await review.save();
    res.json({ helpfulCount: review.helpful.count });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ message: 'Error updating review' });
  }
});

module.exports = router;
