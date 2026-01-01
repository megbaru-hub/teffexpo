// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// API Error class
export class ApiError extends Error {
  status: number;
  errors?: any[];

  constructor(message: string, status: number, errors?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// Helper function for making API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle query parameters
  let url = `${API_BASE_URL}${endpoint}`;
  if (options.method === 'GET' && (options as any).params) {
    const params = new URLSearchParams((options as any).params);
    url += `?${params.toString()}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.error || data.message || 'Something went wrong',
      response.status,
      data.errors
    );
  }

  // For auth endpoints that return token, return the whole response
  // For other endpoints, extract data property if it exists
  if (data.token !== undefined) {
    return data;
  }

  // Extract data property if response has { success: true, data: ... } format
  // Otherwise return the whole response
  return data.data !== undefined ? data.data : data;
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (userData: any) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  getMe: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'GET' }),
  merchantLogin: (email: string, password: string) =>
    apiRequest('/auth/merchant/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  merchantRegister: (userData: any) =>
    apiRequest('/auth/merchant/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
};

// Products API
export const productsApi = {
  getAll: (params?: any) => apiRequest('/products', { method: 'GET', params } as any),
  getById: (id: string) => apiRequest(`/products/${id}`),
  create: (productData: any) =>
    apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),
  update: (id: string, productData: any) =>
    apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    }),
  delete: (id: string) =>
    apiRequest(`/products/${id}`, { method: 'DELETE' }),
};

// Cart API
export const cartApi = {
  getCart: () => apiRequest('/cart'),
  addToCart: (productId: string, quantity: number = 1) =>
    apiRequest('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),
  updateCartItem: (itemIndex: number, quantity: number) =>
    apiRequest(`/cart/items/${itemIndex}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),
  removeFromCart: (itemIndex: number) =>
    apiRequest(`/cart/items/${itemIndex}`, { method: 'DELETE' }),
  clearCart: () => apiRequest('/cart', { method: 'DELETE' }),
};

// Orders API
export const ordersApi = {
  createOrder: (orderData: any) =>
    apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
  getOrder: (id: string) => apiRequest(`/orders/${id}`),
  getUserOrders: () => apiRequest('/orders/user'),
  updateOrderStatus: (id: string, status: string) =>
    apiRequest(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// Admin API
export const adminApi = {
  // Users
  getAllUsers: () => apiRequest('/admin/users'),
  updateUserRole: (userId: string, role: string) =>
    apiRequest(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  // Products
  adminGetAllProducts: () => apiRequest('/admin/products'),
  adminCreateProduct: (productData: any) =>
    apiRequest('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),

  // Orders
  getAllOrders: () => apiRequest('/admin/orders'),
  getOrderDetails: (orderId: string) => apiRequest(`/admin/orders/${orderId}`),
  assignOrder: (orderId: string, merchantIds: string[], notificationMethod: 'phone' | 'dashboard' | 'both' = 'dashboard') =>
    apiRequest(`/admin/orders/${orderId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ merchantIds, notificationMethod }),
    }),
  completeOrder: (orderId: string) =>
    apiRequest(`/admin/orders/${orderId}/complete`, {
      method: 'PUT',
    }),
  getMerchantBreakdown: (orderId: string) =>
    apiRequest(`/admin/orders/${orderId}/breakdown`),
  updateOrderStatus: (orderId: string, status: string) =>
    apiRequest(`/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Merchants
  getAllMerchants: () => apiRequest('/admin/merchants'),

  // Analytics
  getAnalytics: () => apiRequest('/admin/analytics'),
};

// Merchant API
export const merchantApi = {
  // Products
  getMerchantProducts: () => apiRequest('/merchant/products'),
  createProduct: (productData: any) =>
    apiRequest('/merchant/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),
  updateProduct: (id: string, productData: any) =>
    apiRequest(`/merchant/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    }),
  deleteProduct: (id: string) =>
    apiRequest(`/merchant/products/${id}`, { method: 'DELETE' }),

  // Orders
  getMerchantOrders: () => apiRequest('/merchant/orders'),
  getAssignedOrders: () => apiRequest('/merchant/orders'),
  confirmOrder: (orderId: string) =>
    apiRequest(`/merchant/orders/${orderId}/confirm`, { method: 'PUT' }),
  updateOrderStatus: (orderId: string, status: string) =>
    apiRequest(`/merchant/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Notifications
  getNotifications: () => apiRequest('/merchant/notifications'),
  markNotificationRead: (id: string) =>
    apiRequest(`/merchant/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () =>
    apiRequest('/merchant/notifications/read-all', { method: 'PUT' }),

  // Analytics
  getMerchantAnalytics: () => apiRequest('/merchant/analytics'),
};

