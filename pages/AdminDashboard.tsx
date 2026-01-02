import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../services/api';
import { Translation } from '../types';

interface AdminDashboardProps {
  t: Translation;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ t }) => {
  const { user, logout, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedMerchants, setSelectedMerchants] = useState<string[]>([]);
  const [notificationMethod, setNotificationMethod] = useState<'phone' | 'dashboard' | 'both'>('dashboard');
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [editingMerchantId, setEditingMerchantId] = useState<string | null>(null);
  const [newMerchant, setNewMerchant] = useState({ name: '', email: '', password: '', phone: '', address: '', photo: '', location: '' });
  const [photoUploading, setPhotoUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'merchants'>('orders');

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading]);

  const fetchData = async () => {
    try {
      const [ordersData, merchantsData] = await Promise.all([
        adminApi.getAllOrders(),
        adminApi.getAllMerchants(),
      ]);
      setOrders(ordersData as any[]);
      setMerchants(merchantsData as any[]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignOrder = async () => {
    if (!selectedOrder || selectedMerchants.length === 0) return;

    try {
      await adminApi.assignOrder(selectedOrder._id, selectedMerchants, notificationMethod);
      setShowAssignModal(false);
      setSelectedOrder(null);
      setSelectedMerchants([]);
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to assign order');
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    if (!confirm('Mark this order as completed?')) return;

    try {
      await adminApi.completeOrder(orderId);
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to complete order');
    }
  };

  const handleRegisterMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMerchantId) {
        await adminApi.updateMerchant(editingMerchantId, newMerchant);
      } else {
        await adminApi.registerMerchant(newMerchant);
      }
      setShowMerchantModal(false);
      setEditingMerchantId(null);
      setNewMerchant({ name: '', email: '', password: '', phone: '', address: '', photo: '', location: '' });
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to process merchant');
    }
  };

  const handleEditClick = (merchant: any) => {
    setEditingMerchantId(merchant._id);
    setNewMerchant({
      name: merchant.name,
      email: merchant.email,
      password: '',
      phone: merchant.phone || '',
      address: merchant.address || '',
      photo: merchant.photo || '',
      location: merchant.location || ''
    });
    setShowMerchantModal(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    setPhotoUploading(true);
    try {
      const photoPath = await adminApi.uploadMerchantPhoto(formData);
      setNewMerchant({ ...newMerchant, photo: photoPath });
    } catch (error: any) {
      alert(error.message || 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleDeleteMerchant = async (merchantId: string) => {
    if (!confirm('Are you sure you want to delete this merchant?')) return;

    try {
      await adminApi.deleteMerchant(merchantId);
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete merchant');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: '📦', color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Merchants', value: merchants.length, icon: '🏪', color: 'bg-purple-50 text-purple-600' },
    { label: 'Processing', value: orders.filter(o => o.orderStatus === 'processing').length, icon: '⏳', color: 'bg-amber-50 text-amber-600' },
    { label: 'Revenue', value: `${orders.reduce((acc, current) => acc + current.totalAmount, 0).toLocaleString()} ETB`, icon: '💰', color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-100 flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-amber-500/30">
              T
            </div>
            <span className="text-xl font-black text-stone-800 tracking-tight">TeffExpo</span>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-amber-50 text-amber-700' : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600'}`}
            >
              <span>📦</span> {t.allOrders}
            </button>
            <button
              onClick={() => setActiveTab('merchants')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'merchants' ? 'bg-amber-50 text-amber-700' : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600'}`}
            >
              <span>🏪</span> {t.merchants}
            </button>
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-stone-50">
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-800 truncate">{user.name}</p>
              <p className="text-xs text-stone-500 truncate">Administrator</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black text-stone-900 mb-2">{activeTab === 'orders' ? t.allOrders : t.merchants}</h1>
            <p className="text-stone-400 font-medium">Welcome back, {user.name.split(' ')[0]}!</p>
          </div>
          {activeTab === 'merchants' && (
            <button
              onClick={() => setShowMerchantModal(true)}
              className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/20 active:scale-95 flex items-center gap-2"
            >
              <span className="text-xl">+</span> {t.addMerchant}
            </button>
          )}
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-all group">
              <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <p className="text-stone-400 text-sm font-bold uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-stone-800">{stat.value}</p>
            </div>
          ))}
        </section>

        {activeTab === 'orders' ? (
          <section className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-stone-100">
                <div className="text-6xl mb-6Opacity-20">📭</div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">No orders found</h3>
                <p className="text-stone-400">Everything looks quiet for now.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="bg-white rounded-[2.5rem] border border-stone-100 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className="flex flex-wrap justify-between items-start gap-6 mb-8">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs font-black tracking-widest uppercase">#{order._id.slice(-6)}</span>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-sm ${order.orderStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          order.orderStatus === 'assigned' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                          {order.orderStatus}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-stone-800 mt-2">{order.customer.name}</h3>
                      <p className="text-stone-500 font-medium flex items-center gap-2">
                        <span>📞</span> {order.customer.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-stone-400 font-bold uppercase mb-1">Order Total</p>
                      <p className="text-4xl font-black text-stone-900 leading-none">
                        {order.totalAmount.toLocaleString()} <span className="text-lg text-amber-600 font-bold">ETB</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="p-6 bg-stone-50/50 rounded-3xl border border-stone-100">
                      <p className="text-xs text-stone-400 font-black uppercase tracking-widest mb-4">Merchant Breakdown</p>
                      <div className="space-y-3">
                        {order.merchantBreakdown?.map((breakdown: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="font-bold text-stone-700">{breakdown.merchantName}</span>
                            <span className="px-3 py-1 bg-white rounded-lg font-black text-amber-700 shadow-sm">{breakdown.amount.toLocaleString()} ETB</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-6 bg-stone-50/50 rounded-3xl border border-stone-100">
                      <p className="text-xs text-stone-400 font-black uppercase tracking-widest mb-4">Shipping Address</p>
                      <p className="text-stone-700 font-bold mb-1">{order.customer.address}</p>
                      <p className="text-stone-500 font-medium">{order.customer.kebele}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-stone-50">
                    {order.orderStatus === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setSelectedMerchants([]);
                          setShowAssignModal(true);
                        }}
                        className="bg-stone-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-stone-800 transition-all active:scale-95"
                      >
                        {t.assignToMerchants}
                      </button>
                    )}
                    {order.orderStatus === 'assigned' && (
                      <button
                        onClick={() => handleCompleteOrder(order._id)}
                        className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-emerald-700 transition-all active:scale-95"
                      >
                        {t.markAsCompleted}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {merchants.map((merchant) => (
              <div key={merchant._id} className="bg-white rounded-[2.5rem] border border-stone-100 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 group-hover:bg-amber-100 transition-colors"></div>

                <div className="relative">
                  <div className="flex items-center gap-6 mb-8">
                    <img
                      src={merchant.photo || '/public/uploads/merchants/default.jpg'}
                      alt={merchant.name}
                      className="h-24 w-24 object-cover rounded-[2rem] border-4 border-white shadow-xl group-hover:scale-105 transition-transform"
                    />
                    <div>
                      <h3 className="text-2xl font-black text-stone-900 mb-1">{merchant.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-stone-400 text-xs font-bold uppercase tracking-widest">Active Merchant</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-10">
                    <div className="flex items-center gap-3 text-stone-500 font-bold">
                      <span className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400">📧</span>
                      <span className="text-sm truncate">{merchant.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-500 font-bold">
                      <span className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400">📞</span>
                      <span className="text-sm">{merchant.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-500 font-bold">
                      <span className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400">📍</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{merchant.address}</p>
                        {merchant.location && (
                          <a href={merchant.location} target="_blank" rel="noopener noreferrer" className="text-[10px] text-amber-600 font-black uppercase hover:underline mt-1 block">
                            View Live Location →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditClick(merchant)}
                      className="flex-1 bg-stone-900 text-white py-4 rounded-2xl font-black hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMerchant(merchant._id)}
                      className="px-6 py-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all font-bold"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Assign Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-md" onClick={() => setShowAssignModal(false)}></div>
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full -mr-20 -mt-20"></div>

            <div className="relative">
              <header className="mb-10">
                <span className="text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase mb-2 block">Order Dispatch</span>
                <h2 className="text-3xl font-black text-stone-900">{t.assignToMerchants}</h2>
              </header>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-black text-stone-400 uppercase tracking-widest mb-4">
                    {t.notificationMethod}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['dashboard', 'phone', 'both'] as const).map((method) => (
                      <button
                        key={method}
                        onClick={() => setNotificationMethod(method)}
                        className={`py-4 px-2 rounded-2xl font-bold text-xs transition-all border-2 ${notificationMethod === method ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white border-stone-100 text-stone-400 hover:border-stone-200 uppercase'}`}
                      >
                        {method.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-stone-400 uppercase tracking-widest mb-4">
                    {t.selectMerchants}
                  </label>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedOrder.merchantBreakdown?.map((breakdown: any) => {
                      const isSelected = selectedMerchants.includes(breakdown.merchant._id || breakdown.merchant);
                      return (
                        <button
                          key={breakdown.merchant._id || breakdown.merchant}
                          onClick={() => {
                            const merchantId = breakdown.merchant._id || breakdown.merchant;
                            if (isSelected) {
                              setSelectedMerchants(selectedMerchants.filter((id) => id !== merchantId));
                            } else {
                              setSelectedMerchants([...selectedMerchants, merchantId]);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${isSelected ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-stone-50 border-transparent hover:bg-stone-100'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-stone-200'}`}>
                              {isSelected && '✓'}
                            </div>
                            <span className={`font-black ${isSelected ? 'text-blue-900' : 'text-stone-700'}`}>{breakdown.merchantName}</span>
                          </div>
                          <span className={`px-4 py-1.5 rounded-xl text-sm font-black ${isSelected ? 'bg-white text-blue-700' : 'bg-white text-stone-500'}`}>
                            {breakdown.amount.toLocaleString()} ETB
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-12 pt-8 border-t border-stone-50">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-5 rounded-3xl font-black text-stone-400 hover:bg-stone-50 transition-all uppercase tracking-widest text-xs"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleAssignOrder}
                  disabled={selectedMerchants.length === 0}
                  className="flex-[2] bg-blue-600 text-white py-5 rounded-[2rem] font-black shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95 uppercase tracking-widest text-xs"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Merchant Modal */}
      {showMerchantModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-md" onClick={() => setShowMerchantModal(false)}></div>
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl p-10 relative overflow-y-auto max-h-[95vh] custom-scrollbar">
            <header className="mb-8">
              <span className="text-[10px] font-black tracking-[0.2em] text-amber-600 uppercase mb-2 block">Merchant Management</span>
              <h2 className="text-3xl font-black text-stone-900">{editingMerchantId ? t.editMerchant : t.addMerchant}</h2>
            </header>

            <form onSubmit={handleRegisterMerchant} className="space-y-6">
              <div className="flex flex-col items-center mb-8">
                <div className="relative group cursor-pointer">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-stone-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                    {newMerchant.photo ? (
                      <img src={newMerchant.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">🏪</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    📸
                  </div>
                </div>
                {photoUploading && <p className="text-[10px] font-black text-amber-600 mt-4 uppercase tracking-widest animate-pulse">Uploading...</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{t.name}</label>
                  <input
                    type="text"
                    required
                    value={newMerchant.name}
                    onChange={(e) => setNewMerchant({ ...newMerchant, name: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-stone-50 border-2 border-transparent focus:border-amber-500/20 focus:bg-white outline-none transition-all font-bold text-stone-800"
                    placeholder="Merchant Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{t.email}</label>
                  <input
                    type="email"
                    required
                    value={newMerchant.email}
                    onChange={(e) => setNewMerchant({ ...newMerchant, email: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-stone-50 border-2 border-transparent focus:border-amber-500/20 focus:bg-white outline-none transition-all font-bold text-stone-800"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">
                  {t.password} {editingMerchantId && <span className="lowercase font-bold">(optional)</span>}
                </label>
                <input
                  type="password"
                  required={!editingMerchantId}
                  value={newMerchant.password}
                  onChange={(e) => setNewMerchant({ ...newMerchant, password: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl bg-stone-50 border-2 border-transparent focus:border-amber-500/20 focus:bg-white outline-none transition-all font-bold text-stone-800"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{t.phone}</label>
                  <input
                    type="text"
                    required
                    value={newMerchant.phone}
                    onChange={(e) => setNewMerchant({ ...newMerchant, phone: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-stone-50 border-2 border-transparent focus:border-amber-500/20 focus:bg-white outline-none transition-all font-bold text-stone-800"
                    placeholder="0912..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{t.address}</label>
                  <input
                    type="text"
                    required
                    value={newMerchant.address}
                    onChange={(e) => setNewMerchant({ ...newMerchant, address: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-stone-50 border-2 border-transparent focus:border-amber-500/20 focus:bg-white outline-none transition-all font-bold text-stone-800"
                    placeholder="Physical Address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{t.storeLocation}</label>
                <input
                  type="text"
                  value={newMerchant.location}
                  onChange={(e) => setNewMerchant({ ...newMerchant, location: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl bg-stone-50 border-2 border-transparent focus:border-amber-500/20 focus:bg-white outline-none transition-all font-bold text-stone-800"
                  placeholder="Google Maps URL"
                />
              </div>

              <div className="flex gap-4 mt-12 pt-8 border-t border-stone-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowMerchantModal(false);
                    setEditingMerchantId(null);
                    setNewMerchant({ name: '', email: '', password: '', phone: '', address: '', photo: '', location: '' });
                  }}
                  className="flex-1 py-5 rounded-3xl font-black text-stone-400 hover:bg-stone-50 transition-all uppercase tracking-widest text-xs"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-[2] bg-amber-600 text-white py-5 rounded-[2rem] font-black shadow-xl shadow-amber-600/20 hover:bg-amber-700 transition-all active:scale-95 uppercase tracking-widest text-xs"
                >
                  {editingMerchantId ? 'Update Merchant' : t.confirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;