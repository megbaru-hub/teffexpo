import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Package,
  Bell,
  LogOut,
  Plus,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  ChevronRight,
  Search,
  MoreVertical,
  X,
  TrendingUp,
  RefreshCcw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { merchantApi, productsApi } from '../services/api';
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
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'notifications'>('orders');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Product State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    teffType: 'White',
    pricePerKilo: '',
    stockAvailable: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'merchant') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, authLoading]);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
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
      setRefreshing(false);
    }
  };

  const handleConfirmOrder = async (orderId: string, amount: number) => {
    setConfirmingOrderId(orderId);
    try {
      await merchantApi.confirmOrder(orderId);
      alert(`${t.orderConfirmed}! ${t.moneyGained}: ${amount.toLocaleString()} ETB`);
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to confirm order');
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      await merchantApi.markOrderReady(orderId);
      alert(t.readyForDelivery);
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to mark as ready');
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
      setShowAddModal(false);
      setNewProduct({
        teffType: 'White',
        pricePerKilo: '',
        stockAvailable: '',
        description: ''
      });
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsApi.delete(productId);
      fetchData();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleUpdateStock = async (product: any) => {
    const newStock = window.prompt(`Update stock for ${product.teffType} Teff:`, product.stockAvailable.toString());
    if (newStock === null || newStock === '') return;

    try {
      await productsApi.update(product._id, {
        stockAvailable: Number(newStock)
      });
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to update stock');
    }
  };

  const stats = useMemo(() => {
    const activeOrders = orders.filter(o => o.myStatus !== 'completed').length;
    const totalRevenue = orders
      .filter(o => o.myStatus === 'completed' || o.myStatus === 'confirmed')
      .reduce((sum, o) => sum + (o.myAmount || 0), 0);
    const unreadNotifications = notifications.filter(n => n.status === 'unread').length;

    return [
      { label: t.activeOrders, value: activeOrders, icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: t.moneyGained, value: `${totalRevenue.toLocaleString()} ETB`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: t.unreadAlerts, value: unreadNotifications, icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: t.teffTypes, value: products.length, icon: Package, color: 'text-stone-600', bg: 'bg-stone-50' },
    ];
  }, [orders, notifications, products, t]);

  const filteredOrders = orders.filter(order =>
    order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order._id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarItems = [
    { id: 'orders', label: t.orders, icon: ShoppingBag },
    { id: 'products', label: t.products, icon: Package },
    { id: 'notifications', label: t.notifications, icon: Bell, badge: notifications.filter(n => n.status === 'unread').length },
  ];

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full"
        />
        <p className="text-stone-500 font-bold animate-pulse">Initializing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-stone-100 sticky top-0 h-screen flex flex-col pt-8">
        <div className="px-8 mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-600/20">
              {user?.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Merchant</p>
              <h2 className="text-lg font-black text-stone-900 leading-tight">{user?.name}</h2>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all group ${activeTab === item.id
                ? 'bg-amber-600 text-white shadow-xl shadow-amber-600/20'
                : 'text-stone-500 hover:bg-stone-50'
                }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="font-bold">{item.label}</span>
              </div>
              {item.badge ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === item.id ? 'bg-white text-amber-600' : 'bg-blue-600 text-white'
                  }`}>
                  {item.badge}
                </span>
              ) : (
                <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === item.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-50 mt-auto">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-50 font-bold transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-2">
              {activeTab === 'orders' ? t.orders : activeTab === 'products' ? t.products : t.notifications}
            </h1>
            <p className="text-stone-500 font-medium">{t.welcomeBack}, {user?.name.split(' ')[0]}!</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchData(true)}
              className={`w-12 h-12 rounded-2xl bg-white border border-stone-100 flex items-center justify-center text-stone-500 hover:text-amber-600 hover:border-amber-100 transition-all shadow-sm ${refreshing ? 'animate-spin text-amber-600 border-amber-100' : ''}`}
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 group-focus-within:text-amber-600 transition-colors" />
              <input
                type="text"
                placeholder={t.searchItems}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-6 py-3.5 bg-white border border-stone-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all w-64 shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group cursor-default hover:shadow-xl transition-all"
            >
              <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-stone-400 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-stone-900 tracking-tight">{stat.value}</p>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </motion.div>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-24 text-center border border-stone-100">
                  <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="w-10 h-10 text-stone-200" />
                  </div>
                  <h3 className="text-2xl font-black text-stone-900 mb-2">{t.noOrders}</h3>
                  <p className="text-stone-400 font-medium">{t.noOrdersDescription}</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <motion.div
                    layout
                    key={order._id}
                    className="bg-white rounded-[3rem] border border-stone-100 shadow-sm hover:shadow-xl transition-all overflow-hidden"
                  >
                    <div className="p-8 flex items-center gap-10">
                      <div className="w-24 h-24 bg-stone-50 rounded-[2rem] flex flex-col items-center justify-center text-stone-400 border border-stone-100 relative group-hover:scale-105 transition-transform">
                        <span className="text-2xl mb-1">🌾</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Order</span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-wider">#{order._id.slice(-6)}</span>
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${order.myStatus === 'confirmed' ? 'bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200' :
                            order.myStatus === 'completed' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                            {order.myStatus}
                          </span>
                          <span className="text-stone-300 text-xs text-stone-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-2xl font-black text-stone-900 mb-4">{order.customer.name}</h3>

                        <div className="flex gap-6">
                          <div className="flex items-center gap-2 text-stone-500 font-bold text-sm">
                            <Phone className="w-4 h-4 text-amber-600" />
                            {order.customer.phone}
                          </div>
                          <div className="flex items-center gap-2 text-stone-500 font-bold text-sm">
                            <MapPin className="w-4 h-4 text-amber-600" />
                            {order.customer.address}, {order.customer.kebele}
                          </div>
                        </div>
                      </div>

                      <div className="text-right px-8 border-l border-stone-50">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">
                          {order.myStatus === 'completed' || order.myStatus === 'confirmed' || order.myStatus === 'ready' ? t.moneyGained : t.potentialEarnings}
                        </p>
                        <p className={`text-3xl font-black tracking-tight ${['confirmed', 'ready', 'completed'].includes(order.myStatus) ? 'text-emerald-600' : 'text-stone-900'}`}>
                          {order.myAmount.toLocaleString()} <span className="text-xs text-amber-600">ETB</span>
                        </p>
                        <div className="mt-4 flex gap-2 justify-end">
                          {order.myStatus === 'pending' ? (
                            <button
                              disabled={confirmingOrderId === order._id}
                              onClick={() => handleConfirmOrder(order._id, order.myAmount)}
                              className="px-6 py-3 bg-amber-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-amber-600/20 hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                              {confirmingOrderId === order._id ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                  <RefreshCcw className="w-4 h-4" />
                                </motion.div>
                              ) : null}
                              {confirmingOrderId === order._id ? 'Confirming...' : t.confirmOrder}
                            </button>
                          ) : order.myStatus === 'confirmed' ? (
                            <button
                              onClick={() => handleMarkReady(order._id)}
                              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                            >
                              <Package className="w-4 h-4" /> {t.notifyAdmin}
                            </button>
                          ) : order.myStatus === 'ready' ? (
                            <div className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-sm flex items-center gap-2 border border-indigo-100">
                              <CheckCircle2 className="w-4 h-4" /> {t.ready}
                            </div>
                          ) : (
                            <div className="px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-sm flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> {t.completed}
                            </div>
                          )}
                          <button className="p-3 bg-white border border-stone-100 rounded-2xl text-stone-400 hover:text-amber-600 hover:border-amber-100 transition-all shadow-sm">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-stone-50/50 p-6 px-10 border-t border-stone-50">
                      <div className="flex flex-wrap gap-4">
                        {order.myItems?.map((item: any, idx: number) => (
                          <div key={idx} className="bg-white border border-stone-100 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                            <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center text-[10px]">🌾</div>
                            <span className="text-sm font-black text-stone-700">{item.teffType}</span>
                            <span className="text-stone-300">|</span>
                            <span className="text-sm font-black text-amber-600">{item.quantity} {t.kilo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">{t.inventory}</h2>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-stone-900/20 hover:bg-stone-800 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> {t.addGrains}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {products.map((product) => (
                  <motion.div
                    whileHover={{ y: -10 }}
                    key={product._id}
                    className="bg-white rounded-[3rem] border border-stone-100 p-8 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden group"
                  >
                    <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center text-3xl mb-6 border border-stone-100 relative z-10">
                      {product.teffType === 'White' ? '🌾' : product.teffType === 'Red' ? '🤎' : '🥞'}
                    </div>
                    <h3 className="text-2xl font-black text-stone-900 mb-2 leading-tight">{product.teffType} Teff</h3>
                    <p className="text-stone-400 font-bold mb-6 text-sm line-clamp-2">{product.description || 'Premium quality Ethiopian teff freshly sourced and processed.'}</p>

                    <div className="space-y-3 mb-8">
                      <div className="flex justify-between items-center px-4 py-3 bg-stone-50 rounded-2xl">
                        <span className="text-xs font-black text-stone-400 uppercase tracking-widest">{t.price}</span>
                        <span className="text-lg font-black text-stone-900">{product.pricePerKilo} <span className="text-[10px] text-amber-600">ETB</span></span>
                      </div>
                      <div className="flex justify-between items-center px-4 py-3 bg-stone-50 rounded-2xl">
                        <span className="text-xs font-black text-stone-400 uppercase tracking-widest">{t.stock}</span>
                        <span className={`text-lg font-black ${product.stockAvailable < 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {product.stockAvailable} <span className="text-[10px] uppercase">{t.kilo}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStock(product)}
                        className="flex-1 py-4 bg-stone-900 text-white rounded-2xl font-black text-xs hover:bg-stone-800 transition-all"
                      >
                        {t.updateStock}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="p-4 bg-stone-50 text-stone-400 rounded-2xl hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[3rem] border border-stone-100 shadow-sm overflow-hidden"
            >
              <div className="p-10 border-b border-stone-50 bg-stone-50/50 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight mb-1">{t.notifications}</h2>
                  <p className="text-stone-400 text-sm font-medium">Keep track of your order updates and system alerts</p>
                </div>
                {notifications.filter(n => n.status === 'unread').length > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-100 rounded-2xl font-black text-xs text-amber-600 hover:text-amber-700 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> {t.markAllAsRead}
                  </button>
                )}
              </div>

              <div className="divide-y divide-stone-50">
                {notifications.length === 0 ? (
                  <div className="p-24 text-center">
                    <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Bell className="w-10 h-10 text-stone-200" />
                    </div>
                    <h3 className="text-2xl font-black text-stone-900 mb-2">{t.noNotifications}</h3>
                    <p className="text-stone-400 font-medium">{t.noNotificationsDescription}</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-8 px-10 transition-all group cursor-pointer hover:bg-stone-50/50 relative ${notification.status === 'unread' ? 'bg-amber-50/30' : ''}`}
                      onClick={() => notification.status === 'unread' && handleMarkNotificationRead(notification._id)}
                    >
                      {notification.status === 'unread' && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-amber-600 rounded-full shadow-[4px_0_12px_rgba(217,119,6,0.5)]"></div>
                      )}

                      <div className="flex justify-between items-start">
                        <div className="flex gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${notification.status === 'unread' ? 'bg-white text-amber-600 shadow-xl' : 'bg-stone-50 text-stone-400'
                            }`}>
                            {notification.message.includes('order') ? <ShoppingBag className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                          </div>
                          <div>
                            <h3 className={`text-lg font-black mb-1 ${notification.status === 'unread' ? 'text-stone-900' : 'text-stone-500'}`}>
                              {notification.title}
                            </h3>
                            <p className="text-stone-500 font-medium leading-relaxed">{notification.message}</p>
                            <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">
                              <Clock className="w-3 h-3" /> {new Date(notification.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        {notification.status === 'unread' && (
                          <span className="px-3 py-1 bg-amber-600 text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow-lg shadow-amber-600/20">
                            {t.new}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl bg-stone-900/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-2xl p-10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-50 rounded-full -mr-24 -mt-24 opacity-50"></div>

              <header className="flex justify-between items-center mb-10 relative z-10">
                <div>
                  <h2 className="text-3xl font-black text-stone-900 tracking-tight mb-1">{t.addGrains}</h2>
                  <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">{t.inventory}</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-12 h-12 rounded-2xl bg-stone-50 text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all flex items-center justify-center"
                >
                  <X className="w-6 h-6" />
                </button>
              </header>

              <form onSubmit={handleAddProduct} className="space-y-6 relative z-10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">{t.teffTypeSelection}</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['White', 'Red', 'Mixed'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewProduct({ ...newProduct, teffType: type })}
                          className={`py-6 rounded-3xl font-black text-xs transition-all border-2 ${newProduct.teffType === type
                            ? 'bg-stone-900 text-white border-stone-900 shadow-xl shadow-stone-900/20'
                            : 'bg-white text-stone-400 border-stone-100 hover:border-amber-200 hover:text-amber-600'
                            }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">{t.pricePerKiloLabel}</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newProduct.pricePerKilo}
                      onChange={(e) => setNewProduct({ ...newProduct, pricePerKilo: e.target.value })}
                      className="w-full px-6 py-5 bg-stone-50 border border-stone-100 rounded-[2rem] text-sm font-black focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all placeholder-stone-200"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">{t.availableStockLabel}</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newProduct.stockAvailable}
                      onChange={(e) => setNewProduct({ ...newProduct, stockAvailable: e.target.value })}
                      className="w-full px-6 py-5 bg-stone-50 border border-stone-100 rounded-[2rem] text-sm font-black focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all placeholder-stone-200"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">{t.detailedDescription}</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full px-6 py-5 bg-stone-50 border border-stone-100 rounded-[2rem] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all placeholder-stone-200 resize-none"
                    rows={3}
                    placeholder={t.descriptionPlaceholder}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-amber-600 text-white py-6 rounded-[2.5rem] font-black shadow-2xl shadow-amber-600/30 hover:bg-amber-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>{t.commitToInventory} <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default MerchantDashboard;