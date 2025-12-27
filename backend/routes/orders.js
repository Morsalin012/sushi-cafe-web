/**
 * Order Routes
 * API endpoints for orders
 */

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');

// GET /api/orders - Get all orders (for admin)
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email')
        .populate('items.product', 'name image price')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query)
    ]);

    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// GET /api/orders/user/:userId - Get user's orders
router.get('/user/:userId', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { user: req.params.userId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('items.product', 'name image')
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
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// GET /api/orders/:id - Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Error fetching order' });
  }
});

// GET /api/orders/track/:orderNumber - Track order by number
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .populate('items.product', 'name image');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      orderNumber: order.orderNumber,
      status: order.status,
      orderType: order.orderType,
      items: order.items,
      total: order.total,
      estimatedReadyTime: order.estimatedReadyTime,
      createdAt: order.createdAt
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ message: 'Error tracking order' });
  }
});

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      orderType = 'dine-in',
      tableNumber,
      deliveryAddress,
      paymentMethod = 'cash',
      notes
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: userId })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Verify all items are available and have stock
    for (const item of cart.items) {
      if (!item.product.isAvailable) {
        return res.status(400).json({ 
          message: `${item.product.name} is no longer available` 
        });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.product.name}` 
        });
      }
    }

    // Calculate totals
    const totals = cart.calculateTotals();

    // Build order items
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      specialInstructions: item.specialInstructions
    }));

    // Create order
    const order = await Order.create({
      user: userId,
      items: orderItems,
      subtotal: totals.subtotal,
      tax: totals.tax,
      deliveryFee: orderType === 'delivery' ? totals.deliveryFee : 0,
      total: totals.total,
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      paymentMethod,
      notes,
      estimatedReadyTime: new Date(Date.now() + 30 * 60 * 1000) // 30 mins from now
    });

    // Update product stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity }
      });
    }

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 
        totalOrders: 1, 
        totalSpent: totals.total,
        loyaltyPoints: Math.floor(totals.total / 100) // 1 point per ৳100
      },
      lastOrderDate: new Date()
    });

    // Clear cart
    cart.items = [];
    await cart.save();

    console.log(`✅ Order created: ${order.orderNumber}`);
    
    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        estimatedReadyTime: order.estimatedReadyTime
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    
    if (status === 'delivered' || status === 'ready') {
      order.completedAt = new Date();
    }
    
    if (status === 'cancelled') {
      order.cancelledAt = new Date();
      // Restore stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    await order.save();

    console.log(`✅ Order ${order.orderNumber} status: ${status}`);
    res.json({ 
      message: 'Order status updated',
      status: order.status 
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Error updating order' });
  }
});

// POST /api/orders/:id/cancel - Cancel order
router.post('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Can only cancel pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Cannot cancel order in current status' 
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    await order.save();

    console.log(`✅ Order ${order.orderNumber} cancelled`);
    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Error cancelling order' });
  }
});

module.exports = router;
