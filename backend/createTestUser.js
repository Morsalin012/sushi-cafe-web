require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sushi-cafe';

async function run() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');
  const email = 'test@example.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('User already exists:', email);
    process.exit(0);
  }
  const hashed = await bcrypt.hash('Pass1234', 12);
  const user = new User({ name: 'Test User', email, password: hashed });
  await user.save();
  console.log('Created user:', email);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
