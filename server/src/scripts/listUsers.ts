import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Product from '../models/Product';

// Load environment variables
dotenv.config({ path: `${__dirname}/../../.env` });

const MONGODB_URI = process.env.MONGODB_URI!;

const listUsers = async () => {
    try {
        await mongoose.connect(MONGODB_URI);

        const users = await User.find({});
        console.log('--- Current Users ---');
        users.forEach(u => {
            console.log(`Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
        });

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error listing users:', error);
        process.exit(1);
    }
};

listUsers();
