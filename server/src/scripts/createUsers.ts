import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Product from '../models/Product';

// Load environment variables
dotenv.config({ path: `${__dirname}/../../.env` });

const MONGODB_URI = process.env.MONGODB_URI!;

const createUsers = async () => {
  try {
    await mongoose.connect(MONGODB_URI);

    // Create Admin User
    const adminEmail = 'admin@teffexpo.com';
    const adminPassword = 'Admin123!@#';
    
    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      console.log('Admin user already exists');
    } else {
      admin = await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      console.log('✅ Admin user created:');
      console.log('   Email:', adminEmail);
      console.log('   Password:', adminPassword);
    }

    // Create Merchant User
    const merchantEmail = 'merchant@teffexpo.com';
    const merchantPassword = 'Merchant123!@#';
    
    let merchant = await User.findOne({ email: merchantEmail });
    if (merchant) {
      console.log('Merchant user already exists');
    } else {
      merchant = await User.create({
        name: 'Test Merchant',
        email: merchantEmail,
        password: merchantPassword,
        role: 'merchant'
      });
      console.log('✅ Merchant user created:');
      console.log('   Email:', merchantEmail);
      console.log('   Password:', merchantPassword);
    }

    // Create sample products for merchant
    if (merchant) {
      const existingProducts = await Product.find({ merchant: merchant._id });
      if (existingProducts.length === 0) {
        await Product.create([
          {
            merchant: merchant._id,
            teffType: 'White',
            pricePerKilo: 120,
            stockAvailable: 500,
            description: 'Premium white teff'
          },
          {
            merchant: merchant._id,
            teffType: 'Red',
            pricePerKilo: 100,
            stockAvailable: 300,
            description: 'Premium red teff'
          },
          {
            merchant: merchant._id,
            teffType: 'Mixed',
            pricePerKilo: 110,
            stockAvailable: 200,
            description: 'Mixed teff blend'
          }
        ]);
        console.log('✅ Sample products created for merchant');
      } else {
        console.log('Merchant already has products');
      }
    }

    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 ADMIN:');
    console.log('   Email: admin@teffexpo.com');
    console.log('   Password: Admin123!@#');
    console.log('   URL: http://localhost:3001/#/admin');
    console.log('');
    console.log('🏪 MERCHANT:');
    console.log('   Email: merchant@teffexpo.com');
    console.log('   Password: Merchant123!@#');
    console.log('   URL: http://localhost:3001/#/merchant-login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  }
};

createUsers();


