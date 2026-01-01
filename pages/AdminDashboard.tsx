import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, ApiError } from '../services/api';
import { Translation } from '../types';

interface AdminDashboardProps {
  t: Translation;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ t }) => {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedMerchants, setSelectedMerchants] = useState<string[]>([]);
  const [notificationMethod, setNotificationMethod] = useState<'phone' | 'dashboard' | 'both'>('dashboard');

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
      alert('Order assigned successfully!');
      setShowAssignModal(false);
      setSelectedOrder(null);
      setSelectedMerchants([]);
      fetchData();
    } catch (error: any) {
      if (error instanceof ApiError) {
        alert(error.message);
      } else {
        alert('Failed to assign order');
      }
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    if (!confirm('Mark this order as completed? This will decrease inventory.')) return;

    try {
      await adminApi.completeOrder(orderId);
      alert('Order marked as completed!');
      fetchData();
    } catch (error: any) {
      if (error instanceof ApiError) {
        alert(error.message);
      } else {
        alert('Failed to complete order');
      }
    }
  };

  if (authLoading || loading) {
    return <div className="max-w-7xl mx-auto py-12 text-center">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-stone-800">{t.adminDashboard}</h1>
        <button
          onClick={logout}
          className="text-amber-600 font-bold hover:underline"
        >
          {t.logout}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-6 border-b border-stone-100 bg-stone-50">
          <h2 className="text-xl font-bold text-stone-800">{t.allOrders}</h2>
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
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.orderStatus === 'completed' ? 'bg-green-100 text-green-700' :
                      order.orderStatus === 'assigned' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                      {order.orderStatus}
                    </span>
                    <p className="text-lg font-bold text-amber-700 mt-2">
                      {order.totalAmount.toFixed(2)} ETB
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-bold text-stone-700 mb-2">{t.merchantBreakdown}</h4>
                  <div className="space-y-2">
                    {order.merchantBreakdown?.map((breakdown: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm bg-stone-50 p-2 rounded">
                        <span>{breakdown.merchantName}</span>
                        <span className="font-bold">{breakdown.amount.toFixed(2)} ETB</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {order.orderStatus === 'pending' && (
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setSelectedMerchants([]);
                        setShowAssignModal(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
                    >
                      {t.assignToMerchants}
                    </button>
                  )}
                  {order.orderStatus === 'assigned' && (
                    <button
                      onClick={() => handleCompleteOrder(order._id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700"
                    >
                      {t.markAsCompleted}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-stone-800 mb-4">{t.assignToMerchants}</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {t.notificationMethod}
              </label>
              <select
                value={notificationMethod}
                onChange={(e) => setNotificationMethod(e.target.value as any)}
                className="w-full px-4 py-2 rounded-lg border border-stone-200"
              >
                <option value="dashboard">{t.dashboardMessage}</option>
                <option value="phone">{t.phoneCall}</option>
                <option value="both">{t.both}</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {t.selectMerchants}
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedOrder.merchantBreakdown?.map((breakdown: any) => {
                  const merchant = merchants.find((m) => m._id === breakdown.merchant._id || m._id === breakdown.merchant);
                  return (
                    <label key={breakdown.merchant._id || breakdown.merchant} className="flex items-center gap-2 p-2 hover:bg-stone-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedMerchants.includes(breakdown.merchant._id || breakdown.merchant)}
                        onChange={(e) => {
                          const merchantId = breakdown.merchant._id || breakdown.merchant;
                          if (e.target.checked) {
                            setSelectedMerchants([...selectedMerchants, merchantId]);
                          } else {
                            setSelectedMerchants(selectedMerchants.filter((id) => id !== merchantId));
                          }
                        }}
                      />
                      <span>{breakdown.merchantName} ({breakdown.amount.toFixed(2)} ETB)</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedOrder(null);
                  setSelectedMerchants([]);
                }}
                className="flex-1 border-2 border-stone-200 text-stone-600 py-3 rounded-xl font-bold hover:bg-stone-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleAssignOrder}
                disabled={selectedMerchants.length === 0}
                className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50"
              >
                {t.assign}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;