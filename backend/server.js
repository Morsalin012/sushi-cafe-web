/**
 * Sushi & Mocha Café - Backend Server
 * Full-featured Express server with e-commerce capabilities
 * Works with your existing HTML pages
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// ============================================
// Middleware
// ============================================

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Serve static files from the parent directory (your HTML/CSS/JS)
app.use(express.static(path.join(__dirname, '..')));

// ============================================
// MongoDB Connection
// ============================================

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sushi-cafe';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.log('⚠️  MongoDB not available, using in-memory storage');
    console.log('   To use MongoDB, set MONGO_URI in backend/.env');
  });

// ============================================
// Import Models
// ============================================

const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const Review = require('./models/Review');
const Reservation = require('./models/Reservation');

// In-memory fallback storage
let inMemoryUsers = [];

// ============================================
// Import Routes
// ============================================

const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const reservationRoutes = require('./routes/reservations');
const adminRoutes = require('./routes/admin');

// ============================================
// Auth Routes (inline for simplicity)
// ============================================

// POST /api/signup - Create new user
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword
      });

      console.log(`✅ New user registered: ${email}`);
      return res.status(201).json({ 
        message: 'Account created successfully',
        user: { id: user._id, name: user.name, email: user.email }
      });
    } else {
      const exists = inMemoryUsers.find(u => u.email === email.toLowerCase());
      if (exists) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      const userId = Date.now().toString();
      inMemoryUsers.push({
        id: userId,
        name,
        email: email.toLowerCase(),
        password
      });

      console.log(`✅ New user registered (in-memory): ${email}`);
      return res.status(201).json({ 
        message: 'Account created successfully',
        user: { id: userId, name, email }
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/login - Authenticate user
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      console.log(`✅ User logged in: ${email}`);
      return res.json({ 
        message: 'Login successful',
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email,
          role: user.role,
          loyaltyPoints: user.loyaltyPoints
        }
      });
    } else {
      const user = inMemoryUsers.find(u => 
        u.email === email.toLowerCase() && u.password === password
      );

      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      console.log(`✅ User logged in (in-memory): ${email}`);
      return res.json({ 
        message: 'Login successful',
        user: { id: user.id, name: user.name, email: user.email, role: 'customer' }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/request-reset
app.post('/api/request-reset', async (req, res) => {
  const { email } = req.body;
  console.log(`🔑 Password reset requested for: ${email}`);
  res.json({ message: 'If that email exists, a reset link was sent.' });
});

// POST /api/reset-password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    if (mongoose.connection.readyState === 1) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { password: hashedPassword },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      console.log(`✅ Password reset for: ${email}`);
      return res.json({ message: 'Password updated successfully' });
    } else {
      const user = inMemoryUsers.find(u => u.email === email.toLowerCase());
      if (user) {
        user.password = newPassword;
        console.log(`✅ Password reset (in-memory) for: ${email}`);
        return res.json({ message: 'Password updated successfully' });
      }
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// API Routes
// ============================================

// Auth routes (Google OAuth)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// HTML Page Routes
// ============================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'sign-up.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Home page', 'home.html'));
});

app.get('/menu', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Home page', 'menu.html'));
});

app.get('/reserve', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Home page', 'reserve.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Home page', 'admin.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Home page', 'admin.html'));
});

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Home page', 'admin-login.html'));
});

app.get('/admin-login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Home page', 'admin-login.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Home page', 'cart.html'));
});

app.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Home page', 'orders.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Home page', 'profile.html'));
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║          🍣 Haru Sora Café - Backend Server 🍵               ║
╠══════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                   ║
║                                                              ║
║  📄 Pages:                                                   ║
║  • Login:     http://localhost:${PORT}/login                   ║
║  • Sign Up:   http://localhost:${PORT}/signup                  ║
║  • Home:      http://localhost:${PORT}/home                    ║
║  • Menu:      http://localhost:${PORT}/menu                    ║
║  • Reserve:   http://localhost:${PORT}/reserve                 ║
║                                                              ║
║  🔌 API Endpoints:                                           ║
║  ─────────────────────────────────────────────────────────── ║
║  Auth:      /api/login, /api/signup, /api/reset-password     ║
║  Products:  /api/products, /api/products/categories          ║
║  Cart:      /api/cart/:userId, /api/cart/add                 ║
║  Orders:    /api/orders, /api/orders/track/:orderNumber      ║
║  Users:     /api/users/:id, /api/users/:id/wishlist          ║
║  Reviews:   /api/reviews/product/:id                         ║
║  Reserve:   /api/reservations                                ║
║  Admin:     /api/admin/dashboard, /api/admin/analytics       ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
