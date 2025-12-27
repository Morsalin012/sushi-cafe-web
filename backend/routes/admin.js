const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const Review = require('../models/Review');

// Simple admin auth header
const adminAuth = async (req, res, next) => {
  const adminId = req.header('x-admin-id');
  if (!adminId) {
    return res.status(401).json({ message: 'Missing admin identifier' });
  }
  const user = await User.findById(adminId);
  if (!user) {
    return res.status(401).json({ message: 'Admin user not found' });
  }
  if (!['admin', 'owner'].includes(user.role)) {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  req.currentAdmin = user;
  next();
};

router.use(adminAuth);

// ============================================
// Dashboard Statistics
// ============================================

// GET /api/admin/dashboard - Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // Get counts
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      todayOrders,
      pendingOrders,
      monthlyRevenue,
      lastMonthRevenue,
      todayReservations,
      pendingReservations
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: 'pending' }),
      Order.aggregate([
        { $match: { createdAt: { $gte: thisMonth }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: lastMonth, $lt: thisMonth }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Reservation.countDocuments({ date: { $gte: today } }),
      Reservation.countDocuments({ status: 'pending' })
    ]);

    const currentRevenue = monthlyRevenue[0]?.total || 0;
    const previousRevenue = lastMonthRevenue[0]?.total || 0;
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : 0;

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(5);

    // Get top products
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', count: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { name: '$product.name', count: 1, revenue: 1 } }
    ]);

    // Get order status distribution
    const orderStatusDist = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        todayOrders,
        pendingOrders,
        monthlyRevenue: currentRevenue,
        revenueGrowth: Number(revenueGrowth),
        todayReservations,
        pendingReservations
      },
      recentOrders,
      topProducts,
      orderStatusDist: orderStatusDist.reduce((acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// ============================================
// Order Management
// ============================================

// GET /api/admin/orders - Get all orders with filters
router.get('/orders', async (req, res) => {
  try {
    const { 
      status, 
      orderType,
      startDate, 
      endDate, 
      search,
      page = 1, 
      limit = 20 
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (orderType) query.orderType = orderType;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phone')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query)
    ]);

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Admin get orders error:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// ============================================
// User Management
// ============================================

// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -resetPasswordToken -resetPasswordExpires')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// PUT /api/admin/users/:id/role - Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['customer', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (role === 'owner' && req.currentAdmin.role !== 'owner') {
      return res.status(403).json({ message: 'Only owner may assign owner role' });
    }
    if (user.role === 'owner' && req.currentAdmin.role !== 'owner') {
      return res.status(403).json({ message: 'Cannot modify owner account' });
    }

    user.role = role;
    await user.save();

    console.log(`✅ User role updated: ${user.email} -> ${role}`);
    const safeUser = user.toObject ? user.toObject() : user;
    delete safeUser.password;
    res.json(safeUser);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

// PUT /api/admin/users/:id/status - Toggle user active status
router.put('/users/:id/status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    console.log(`✅ User ${user.isActive ? 'activated' : 'deactivated'}: ${user.email}`);
    res.json({ 
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
      isActive: user.isActive 
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Error updating user status' });
  }
});

// ============================================
// Product Management
// ============================================

router.get('/products', async (_req, res) => {
  try {
    const products = await Product.find().select('name price isAvailable stock category');
    res.json({ products });
  } catch (error) {
    console.error('Admin get products error:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

router.patch('/products/:productId', async (req, res) => {
  try {
    const { price, stock, isAvailable } = req.body;
    const updates = {};
    if (price !== undefined) updates.price = price;
    if (stock !== undefined) updates.stock = stock;
    if (isAvailable !== undefined) updates.isAvailable = isAvailable;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'At least one field required' });
    }

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    Object.assign(product, updates);
    await product.save();

    res.json({ message: 'Product updated', product });
  } catch (error) {
    console.error('Admin update product error:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// ============================================
// Reservation Management
// ============================================

// GET /api/admin/reservations - Get all reservations
router.get('/reservations', async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [reservations, total] = await Promise.all([
      Reservation.find(query)
        .populate('user', 'name email')
        .sort('date time')
        .skip(skip)
        .limit(Number(limit)),
      Reservation.countDocuments(query)
    ]);

    res.json({
      reservations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Admin get reservations error:', error);
    res.status(500).json({ message: 'Error fetching reservations' });
  }
});

// PUT /api/admin/reservations/:id/status - Update reservation status
router.put('/reservations/:id/status', async (req, res) => {
  try {
    const { status, tableNumber, notes } = req.body;

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (status) reservation.status = status;
    if (tableNumber) reservation.tableNumber = tableNumber;
    if (notes !== undefined) reservation.notes = notes;

    await reservation.save();

    console.log(`✅ Reservation ${reservation.confirmationCode} status: ${status}`);
    res.json(reservation);
  } catch (error) {
    console.error('Update reservation status error:', error);
    res.status(500).json({ message: 'Error updating reservation' });
  }
});

// ============================================
// Review Management
// ============================================

// GET /api/admin/reviews - Get all reviews
router.get('/reviews', async (req, res) => {
  try {
    const { isVisible, page = 1, limit = 20 } = req.query;

    const query = {};
    if (isVisible !== undefined) query.isVisible = isVisible === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'name email')
        .populate('product', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(query)
    ]);

    res.json({
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Admin get reviews error:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// PUT /api/admin/reviews/:id/visibility - Toggle review visibility
router.put('/reviews/:id/visibility', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.isVisible = !review.isVisible;
    await review.save();

    if (typeof Review.calculateAverageRating === 'function') {
      await Review.calculateAverageRating(review.product);
    }

    res.json({ 
      message: `Review ${review.isVisible ? 'shown' : 'hidden'}`,
      isVisible: review.isVisible 
    });
  } catch (error) {
    console.error('Toggle review visibility error:', error);
    res.status(500).json({ message: 'Error updating review' });
  }
});

// POST /api/admin/reviews/:id/respond - Respond to a review
router.post('/reviews/:id/respond', async (req, res) => {
  try {
    const { response } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.response = {
      text: response,
      respondedAt: new Date(),
      respondedBy: req.currentAdmin._id
    };

    await review.save();
    res.json({ message: 'Response added', review });
  } catch (error) {
    console.error('Respond to review error:', error);
    res.status(500).json({ message: 'Error responding to review' });
  }
});

// ============================================
// Analytics
// ============================================

// GET /api/admin/analytics/sales - Sales analytics
router.get('/analytics/sales', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch (period) {
      case '24h':
        startDate = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    }

    const salesData = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const categoryData = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          count: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json({ salesData, categoryData });
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

module.exports = router;
