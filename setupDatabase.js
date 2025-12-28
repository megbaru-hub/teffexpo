import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

async function setupDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Try to connect without authentication first
    try {
      await mongoose.connect('mongodb://localhost:27017/teffexpo');
    } catch (error) {
      console.log('⚠️  Could not connect without authentication, trying with default credentials...');
      // Try with default admin credentials
      await mongoose.connect('mongodb://admin:password@localhost:27017/teffexpo?authSource=admin');
    }
    
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Create Users Collection
    if (!collectionNames.includes('users')) {
      await db.createCollection('users', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'email', 'password', 'role'],
            properties: {
              name: { bsonType: 'string' },
              email: { bsonType: 'string', pattern: '^.+@.+\\..+$' },
              password: { bsonType: 'string' },
              role: { 
                bsonType: 'string',
                enum: ['user', 'merchant', 'admin'],
                default: 'user'
              },
              phone: { bsonType: 'string' },
              address: { bsonType: 'string' },
              isActive: { bsonType: 'bool', default: true },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('✅ Created users collection');
    }

    // Create Products Collection
    if (!collectionNames.includes('products')) {
      await db.createCollection('products', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'price', 'merchant', 'category'],
            properties: {
              name: { bsonType: 'string' },
              description: { bsonType: 'string' },
              price: { bsonType: 'number', minimum: 0 },
              merchant: { bsonType: 'objectId' },
              category: { bsonType: 'string' },
              stock: { bsonType: 'number', minimum: 0, default: 0 },
              images: { 
                bsonType: 'array',
                items: { bsonType: 'string' }
              },
              isActive: { bsonType: 'bool', default: true },
              ratings: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    user: { bsonType: 'objectId' },
                    rating: { bsonType: 'number', minimum: 1, maximum: 5 },
                    comment: { bsonType: 'string' },
                    createdAt: { bsonType: 'date' }
                  }
                }
              },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('✅ Created products collection');
    }

    // Create Orders Collection
    if (!collectionNames.includes('orders')) {
      await db.createCollection('orders', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['user', 'items', 'totalAmount', 'status'],
            properties: {
              orderNumber: { bsonType: 'string' },
              user: { bsonType: 'objectId' },
              items: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  required: ['product', 'quantity', 'price'],
                  properties: {
                    product: { bsonType: 'objectId' },
                    name: { bsonType: 'string' },
                    quantity: { bsonType: 'number', minimum: 1 },
                    price: { bsonType: 'number', minimum: 0 },
                    merchant: { bsonType: 'objectId' }
                  }
                }
              },
              totalAmount: { bsonType: 'number', minimum: 0 },
              status: {
                bsonType: 'string',
                enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
                default: 'pending'
              },
              paymentStatus: {
                bsonType: 'string',
                enum: ['pending', 'paid', 'failed', 'refunded'],
                default: 'pending'
              },
              paymentMethod: { bsonType: 'string' },
              shippingAddress: { bsonType: 'object' },
              trackingNumber: { bsonType: 'string' },
              notes: { bsonType: 'string' },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('✅ Created orders collection');
    }

    // Create Categories Collection
    if (!collectionNames.includes('categories')) {
      await db.createCollection('categories', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'slug'],
            properties: {
              name: { bsonType: 'string' },
              slug: { bsonType: 'string' },
              description: { bsonType: 'string' },
              image: { bsonType: 'string' },
              isActive: { bsonType: 'bool', default: true },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('✅ Created categories collection');
    }

    // Create Indexes
    console.log('🔨 Creating indexes...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('products').createIndex({ name: 'text', description: 'text' });
    await db.collection('products').createIndex({ merchant: 1 });
    await db.collection('products').createIndex({ category: 1 });
    await db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
    await db.collection('orders').createIndex({ user: 1 });
    await db.collection('orders').createIndex({ status: 1 });
    await db.collection('orders').createIndex({ 'items.merchant': 1 });
    await db.collection('orders').createIndex({ createdAt: -1 });
    await db.collection('categories').createIndex({ slug: 1 }, { unique: true });
    console.log('✅ Created indexes');

    // Create default admin user if not exists
    const adminEmail = 'admin@teffexpo.com';
    const adminPassword = 'Admin@123'; // Change this in production
    
    const adminExists = await db.collection('users').findOne({ email: adminEmail });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await db.collection('users').insertOne({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Default admin user created');
      console.log(`📧 Email: ${adminEmail}`);
      console.log('🔑 Password: Admin@123');
      console.log('⚠️  Please change this password after first login!');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('You can now start the application with: npm run dev\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
