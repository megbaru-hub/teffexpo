import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv to read from .env file in root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function createMerchant() {
    try {
        // Connect to your MongoDB
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

        const User = mongoose.models.User || mongoose.model('User', userSchema);

        // Merchant details
        const merchantEmail = 'merchant@example.com';
        const merchantPassword = 'merchant123';

        // Check if merchant already exists
        const existingMerchant = await User.findOne({ email: merchantEmail });

        if (existingMerchant) {
            console.log('⚠️ Merchant user already exists.');

            // Update role to ensure it is merchant
            if (existingMerchant.role !== 'merchant') {
                existingMerchant.role = 'merchant';
                await existingMerchant.save();
                console.log('✅ Updated user role to merchant');
            }

            console.log(`📧 Email: ${merchantEmail}`);
            console.log('🔑 Password: (as previously set)');
        } else {
            // Create merchant user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(merchantPassword, salt);

            const merchant = new User({
                name: 'Merchant User',
                email: merchantEmail,
                password: hashedPassword,
                role: 'merchant'
            });

            await merchant.save();
            console.log('✅ Merchant user created successfully!');
            console.log(`📧 Email: ${merchantEmail}`);
            console.log(`🔑 Password: ${merchantPassword}`);
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating merchant user:', error);
        process.exit(1);
    }
}

createMerchant();
