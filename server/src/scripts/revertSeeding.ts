import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Product from '../models/Product';

// Load environment variables
dotenv.config({ path: `${__dirname}/../../.env` });

const MONGODB_URI = process.env.MONGODB_URI!;

const revertSeeding = async () => {
    try {
        await mongoose.connect(MONGODB_URI);

        // Delete the users I created
        const emailsToDelete = ['admin@teffexpo.com', 'merchant@teffexpo.com'];

        // Also delete products created for the test merchant
        const merchant = await User.findOne({ email: 'merchant@teffexpo.com' });
        if (merchant) {
            await Product.deleteMany({ merchant: merchant._id });
            console.log('✅ Deleted sample products for merchant@teffexpo.com');
        }

        const result = await User.deleteMany({ email: { $in: emailsToDelete } });
        console.log(`✅ Deleted ${result.deletedCount} users created by the seeding script.`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error reverting changes:', error);
        process.exit(1);
    }
};

revertSeeding();
