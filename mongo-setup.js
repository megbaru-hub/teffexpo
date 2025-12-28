// mongo-setup.js
db = db.getSiblingDB('teffexpo');

print("Creating collections...");
db.createCollection('users');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('categories');

print("Creating admin user...");
db.users.insertOne({
  name: "Admin User",
  email: "admin@teffexpo.com",
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password: password
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print("✅ Database setup complete!");
print("Admin email: admin@teffexpo.com");
print("Admin password: password");
print("⚠️  Please change the password after first login!");
