import mongoose from 'mongoose';
import Order from './src/models/Order';
import dotenv from 'dotenv';

dotenv.config();

const checkOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        const orders = await Order.find({});
        console.log(`Found ${orders.length} orders`);

        orders.forEach(order => {
            console.log(`Order ID: ${order._id}`);
            console.log(`  Status: ${order.orderStatus}`);
            console.log(`  Assigned: ${order.assignedToMerchants.length} merchants`);
            order.assignedToMerchants.forEach(a => {
                console.log(`    Merchant: ${a.merchant}, Status: ${a.status}`);
            });
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkOrders();
