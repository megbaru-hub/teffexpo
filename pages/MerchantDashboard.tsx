import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { merchantApi, productsApi, ApiError } from '../services/api';
import { Translation } from '../types';

interface MerchantDashboardProps {
  t: Translation;
}

const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ t }) => {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'notifications'>('orders');

  // Add Product State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    teffType: 'White',
    pricePerKilo: '',
    stockAvailable: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'merchant') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      const [ordersData, notificationsData, productsData] = await Promise.all([
        merchantApi.getAssignedOrders(),
        merchantApi.getNotifications(),
        productsApi.getAll({ merchant: user?.id }),
      ]);
      setOrders(ordersData as any[]);
      setNotifications(notificationsData as any[]);
      setProducts(productsData as any[]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    try {
      await merchantApi.confirmOrder(orderId);
      alert('Order confirmed!');
      fetchData();
    } catch (error: any) {
      if (error instanceof ApiError) {
        alert(error.message);
      } else {
        alert('Failed to confirm order');
      }
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      await merchantApi.markNotificationRead(notificationId);
      fetchData();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await merchantApi.markAllNotificationsRead();
      fetchData();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await productsApi.create({
        teffType: newProduct.teffType,
        pricePerKilo: Number(newProduct.pricePerKilo),
        stockAvailable: Number(newProduct.stockAvailable),
        description: newProduct.description
      });
      alert('Product created successfully!');
      setShowAddModal(false);
      setNewProduct({
        teffType: 'White',
        pricePerKilo: '',
        stockAvailable: '',
        description: ''
      });
      fetchData();
    } catch (error: any) {
      if (error instanceof ApiError) {
        alert(error.message);
      } else {
        alert('Failed to create product');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return <div className="max-w-7xl mx-auto py-12 text-center">Loading...</div>;
  }

  if (!user || user.role !== 'merchant') {
    return null;
  }

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-stone-800">{t.merchantDashboard}</h1>
        <button
          onClick={logout}
          className="text-amber-600 font-bold hover:underline"
        >
          {t.logout}
        </button>
      </div>

      <div className="flex gap-4 mb-6 border-b border-stone-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 font-bold ${activeTab === 'orders'
            ? 'border-b-2 border-amber-600 text-amber-600'
            : 'text-stone-600 hover:text-stone-800'
            }`}
        >
          {t.orders}
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 font-bold ${activeTab === 'products'
            ? 'border-b-2 border-amber-600 text-amber-600'
            : 'text-stone-600 hover:text-stone-800'
            }`}
        >
          {t.products}
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 font-bold relative ${activeTab === 'notifications'
            ? 'border-b-2 border-amber-600 text-amber-600'
            : 'text-stone-600 hover:text-stone-800'
            }`}
        >
          {t.notifications}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="p-6 border-b border-stone-100 bg-stone-50">
            <h2 className="text-xl font-bold text-stone-800">{t.orders}</h2>
          </div>

          <div className="divide-y divide-stone-100">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-stone-500">{t.noOrders}</div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-stone-800">{t.orders} #{order._id.slice(-6)}</h3>
                      <p className="text-sm text-stone-500 mt-1">
                        {t.customer}: {order.customer.name} ({order.customer.phone})
                      </p>
                      <p className="text-sm text-stone-500">
                        {order.customer.address}, {order.customer.kebele}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.myStatus === 'completed' ? 'bg-green-100 text-green-700' :
                        order.myStatus === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                        {order.myStatus}
                      </span>
                      <p className="text-lg font-bold text-amber-700 mt-2">
                        {order.myAmount.toFixed(2)} ETB
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-bold text-stone-700 mb-2">{t.items}:</h4>
                    <div className="space-y-2">
                      {order.myItems?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm bg-stone-50 p-2 rounded">
                          <span>{item.teffType} - {item.quantity} {t.kilo}</span>
                          <span className="font-bold">{(item.quantity * item.pricePerKilo).toFixed(2)} ETB</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.myStatus === 'pending' && (
                    <button
                      onClick={() => handleConfirmOrder(order._id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
                    >
                      {t.confirmOrder}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-stone-800">{t.myProducts}</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Product
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product._id} className="border border-stone-200 rounded-xl p-4">
                <h3 className="font-bold text-stone-800 mb-2">{product.teffType}</h3>
                <p className="text-sm text-stone-600 mb-1">
                  {t.price}: {product.pricePerKilo} ETB/{t.kilo}
                </p>
                <p className="text-sm text-stone-600">
                  {t.stock}: {product.stockAvailable} {t.kilo}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="p-6 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-stone-800">{t.notifications}</h2>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-amber-600 hover:underline"
              >
                {t.markAllAsRead}
              </button>
            )}
          </div>

          <div className="divide-y divide-stone-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-stone-500">{t.noNotifications}</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-6 ${notification.status === 'unread' ? 'bg-amber-50' : ''}`}
                  onClick={() => {
                    if (notification.status === 'unread') {
                      handleMarkNotificationRead(notification._id);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-stone-800">{notification.title}</h3>
                      <p className="text-sm text-stone-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-stone-400 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {notification.status === 'unread' && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        {t.new}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-stone-800">Add New Product</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Teff Type
                </label>
                <select
                  value={newProduct.teffType}
                  onChange={(e) => setNewProduct({ ...newProduct, teffType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                >
                  <option value="White">White Teff</option>
                  <option value="Red">Red Teff</option>
                  <option value="Mixed">Mixed Teff</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Price per Kilo (ETB)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newProduct.pricePerKilo}
                  onChange={(e) => setNewProduct({ ...newProduct, pricePerKilo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Available Stock (Kg)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newProduct.stockAvailable}
                  onChange={(e) => setNewProduct({ ...newProduct, stockAvailable: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  rows={3}
                  placeholder="Product details..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-stone-600 border-2 border-stone-100 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantDashboard;

