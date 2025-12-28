const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../server/.env') });

// Import the User model
const User = require('../server/src/models/User');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teffexpo');
    console.log('Connected to MongoDB...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@teffexpo.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      name: 'Admin',
      email: 'admin@teffexpo.com',
      password: 'Admin@123', // Default password, should be changed after first login
      role: 'admin',
      active: true
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(admin.password, salt);

    // Save admin user
    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@teffexpo.com');
    console.log('Password: Admin@123');
    console.log('\nIMPORTANT: Please change this password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
