# TeffExpo API Documentation

## Backend API Endpoints

### Authentication Routes (`/api/v1/auth`)
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user profile
- `GET /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/merchant/register` - Register a merchant
- `POST /api/v1/auth/merchant/login` - Login merchant
- `GET /api/v1/auth/merchant/me` - Get merchant profile
- `GET /api/v1/auth/merchant/products` - Get merchant's products

### Product Routes (`/api/v1/products`)
- `GET /api/v1/products` - Get all products (with filters: merchant, teffType, minPrice, maxPrice)
- `GET /api/v1/products/:id` - Get single product
- `POST /api/v1/products` - Create product (Merchant only)
- `PUT /api/v1/products/:id` - Update product (Merchant only)
- `DELETE /api/v1/products/:id` - Delete product (Merchant only)

### Cart Routes (`/api/v1/cart`) - All require authentication
- `GET /api/v1/cart` - Get user's cart
- `POST /api/v1/cart/items` - Add item to cart
- `PUT /api/v1/cart/items/:itemIndex` - Update cart item quantity
- `DELETE /api/v1/cart/items/:itemIndex` - Remove item from cart
- `DELETE /api/v1/cart` - Clear cart

### Order Routes (`/api/v1/orders`) - All require authentication
- `GET /api/v1/orders` - Get user's orders
- `POST /api/v1/orders` - Create order from cart (checkout)
- `GET /api/v1/orders/:id` - Get single order

### Admin Routes (`/api/v1/admin`) - All require admin role
- `GET /api/v1/admin/orders` - Get all orders (with filters: status, paymentStatus)
- `GET /api/v1/admin/orders/:id` - Get order details
- `POST /api/v1/admin/orders/:id/assign` - Assign order to merchants
- `PUT /api/v1/admin/orders/:id/complete` - Mark order as completed (decreases stock)
- `GET /api/v1/admin/orders/:id/breakdown` - Get merchant payment breakdown
- `GET /api/v1/admin/merchants` - Get all merchants

### Merchant Routes (`/api/v1/merchant`) - All require merchant role
- `GET /api/v1/merchant/orders` - Get assigned orders
- `GET /api/v1/merchant/orders/:id` - Get assigned order details
- `PUT /api/v1/merchant/orders/:id/confirm` - Confirm order assignment
- `GET /api/v1/merchant/notifications` - Get notifications
- `PUT /api/v1/merchant/notifications/:id/read` - Mark notification as read
- `PUT /api/v1/merchant/notifications/read-all` - Mark all notifications as read

## Database Models

### User
- Fields: name, email, password, role (user/admin/merchant), active
- Already exists

### Product
- Fields: merchant, teffType (White/Red/Mixed), pricePerKilo, stockAvailable, description, active

### Order
- Fields: customer (name, phone, email, address, kebele, googleMapsLink), items, totalAmount, orderStatus, paymentStatus, paymentProof, assignedToMerchants, merchantBreakdown, createdBy, assignedBy, completedAt, notes

### Cart
- Fields: user, items (product, merchant, teffType, quantity, pricePerKilo)

### Notification
- Fields: user, type, title, message, order, status (unread/read), readAt

## Features Implemented

✅ **Product Management**
- Merchants can create/update/delete products
- Products track inventory (stockAvailable)
- Products linked to merchants

✅ **Shopping Cart**
- Add items from different merchants
- Add different teff types
- Update quantities
- Remove items
- Clear cart

✅ **Order System**
- Create orders from cart
- Customer information form (name, phone, address, kebele, Google Maps link)
- Payment proof upload
- Order status tracking
- Merchant breakdown for payment distribution

✅ **Admin Features**
- View all orders
- See merchant breakdown (separate balances per merchant)
- Assign orders to merchants (via phone call or dashboard message)
- Mark orders as completed (automatically decreases stock)
- View all merchants

✅ **Merchant Dashboard**
- View assigned orders
- See notifications when orders are assigned
- Confirm order assignments
- View order details

✅ **Notification System**
- Merchants receive notifications when orders are assigned
- Notifications can be marked as read
- Support for phone call and dashboard message notifications

## Next Steps (Frontend)

The backend is complete. The frontend needs to be updated to:
1. Display products with inventory
2. Shopping cart functionality
3. Checkout form with customer details
4. Admin dashboard for order management
5. Merchant dashboard for assigned orders
6. Notification system UI


