const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const OrderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model('Order', OrderSchema, 'orders');

const checkOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const orders = await Order.find({});
        console.log(`Found ${orders.length} orders`);

        orders.forEach(order => {
            console.log(`Order ID: ${order._id}`);
            console.log(`  Status: ${order.orderStatus}`);
            console.log(`  Assigned: ${order.assignedToMerchants?.length || 0} merchants`);
            if (order.assignedToMerchants) {
                order.assignedToMerchants.forEach(a => {
                    console.log(`    Merchant: ${a.merchant}, Status: ${a.status}`);
                });
            }
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkOrders();
