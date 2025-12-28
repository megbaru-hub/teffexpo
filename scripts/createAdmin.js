const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './server/.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teffexpo')
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => {
    console.error('Could not connect to MongoDB:', err);
    process.exit(1);
  });

// Import the User model
const User = require('../server/src/models/User');

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@teffexpo.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@teffexpo.com',
      password: hashedPassword,
      role: 'admin',
      active: true
    });

    // Save admin user
    await admin.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('-----------------------------------');
    console.log('Email: admin@teffexpo.com');
    console.log('Password: Admin@123');
    console.log('-----------------------------------');
    console.log('\n🔒 IMPORTANT: Please change this password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

// Run the function
createAdmin();
