// setupAdmin.cjs
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './server/.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teffexpo')
  .then(() => console.log('✅ Connected to MongoDB...'))
  .catch(err => {
    console.error('❌ Could not connect to MongoDB:', err.message);
    process.exit(1);
  });

// Define the User model
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['user', 'admin', 'merchant'], default: 'user' },
  active: { type: Boolean, default: true },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Create model
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Create admin user
async function createAdmin() {
  try {
    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@teffexpo.com' });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      process.exit(0);
    }

    // Create and save admin
    const admin = new User({
      name: 'Megbaru',
      email: 'megbaru@teffexpo.com',
      password: 'megbar@123', // Will be hashed by pre-save hook
      role: 'admin',
      active: true
    });

    await admin.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('-----------------------------------');
    console.log('Email: admin@teffexpo.com');
    console.log('Password: Admin@123');
    console.log('-----------------------------------');
    console.log('\n🔒 IMPORTANT: Change this password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the function
createAdmin();
