const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sushi-cafe';

// User Schema (same as in models/User.js)
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'staff', 'admin'], default: 'customer' },
    avatar: { type: String },
    phone: { type: String },
    address: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Admin credentials - আপনি এখানে পরিবর্তন করতে পারেন
        const adminData = {
            name: 'Admin',
            email: 'admin@harusora.com',
            password: 'Admin@123',  // এটি পরে পরিবর্তন করুন!
            role: 'admin'
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminData.email });
        
        if (existingAdmin) {
            // Update existing user to admin
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            console.log('✅ Existing user updated to admin role!');
            console.log(`📧 Email: ${adminData.email}`);
        } else {
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminData.password, salt);

            // Create new admin user
            const admin = new User({
                ...adminData,
                password: hashedPassword
            });

            await admin.save();
            console.log('✅ Admin user created successfully!');
            console.log(`📧 Email: ${adminData.email}`);
            console.log(`🔑 Password: ${adminData.password}`);
        }

        console.log('\n🎉 Now you can login at admin-login.html');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
}

createAdminUser();
