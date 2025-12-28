#!/bin/bash

# This script creates an admin user directly in MongoDB

# Check if MongoDB is running
if ! command -v mongosh &> /dev/null; then
    echo "MongoDB shell (mongosh) is not installed. Please install it first."
    exit 1
fi

# Default values
DB_NAME="teffexpo"
ADMIN_EMAIL="admin@teffexpo.com"
ADMIN_PASSWORD="Admin@123"
ADMIN_NAME="Admin User"

# Hash the password (using Node.js to generate bcrypt hash)
HASHED_PW=$(node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('$ADMIN_PASSWORD', 10));")

# Check if bcrypt is installed
if [ $? -ne 0 ]; then
    echo "bcryptjs is required. Installing..."
    npm install bcryptjs
    HASHED_PW=$(node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('$ADMIN_PASSWORD', 10));")
fi

# Create admin user
mongosh $DB_NAME --eval "
db.users.updateOne(
  { email: '$ADMIN_EMAIL' },
  { \$setOnInsert: 
    { 
      name: '$ADMIN_NAME',
      email: '$ADMIN_EMAIL',
      password: '$HASHED_PW',
      role: 'admin',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  { upsert: true }
)"

echo "✅ Admin user setup complete!"
echo "---------------------------"
echo "Email: $ADMIN_EMAIL"
echo "Password: $ADMIN_PASSWORD"
echo "---------------------------"
echo ""
echo "🔒 IMPORTANT: Please change this password after first login!"
