import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv to read from .env file in root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function createAdmin() {
  try {
    // Connect to your MongoDB
    // Use environment variable if available, otherwise fallback to local default
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/teffexpo';
    console.log('Connecting to MongoDB at:', mongoURI);

    await mongoose.connect(mongoURI);

    console.log('✅ Connected to MongoDB');

    const userSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: { type: String, select: false },
      role: { type: String, default: 'user', enum: ['user', 'merchant', 'admin'] },
      createdAt: { type: Date, default: Date.now }
    });

    // Add comparePassword method if it doesn't exist on the schema in this context
    // (though for seeding we just need to save)

    // Check if model already exists to avoid recompilation errors
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Admin details
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('⚠️ Admin user already exists.');

      // Optional: Update password if needed, or just notify
      // For now, we'll just log that it exists. 
      // Uncomment below to force update password:
      /*
      const salt = await bcrypt.genSalt(10);
      existingAdmin.password = await bcrypt.hash(adminPassword, salt);
      existingAdmin.role = 'admin'; // Ensure role is admin
      await existingAdmin.save();
      console.log('✅ Admin password and role updated.');
      */

      console.log(`📧 Email: ${adminEmail}`);
      console.log('🔑 Password: (as previously set)');
    } else {
      // Create admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const admin = new User({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });

      await admin.save();
      console.log('✅ Admin user created successfully!');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
