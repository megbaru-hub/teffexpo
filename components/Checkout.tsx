import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { ordersApi, ApiError } from '../services/api';
import { Translation } from '../types';

interface CheckoutProps {
  t: Translation;
}

const Checkout: React.FC<CheckoutProps> = ({ t }) => {
  const { cart, guestCart, clearCart, totalAmount, isAuthenticated } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    kebele: '',
    googleMapsLink: '',
    paymentProof: '',
  });

  // Use cart if authenticated, otherwise use guestCart
  const currentItems = (isAuthenticated && cart ? cart.items : guestCart) || [];

  if (currentItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.address || !formData.kebele) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Prepare items for order (format for backend)
      const items = currentItems.map((item: any) => ({
        productId: item.product?._id || item.productId || item.product,
        quantity: item.quantity,
        pricePerKilo: item.pricePerKilo,
        teffType: item.teffType,
        merchant: item.merchant?._id || item.merchant,
      }));

      const orderData: any = {
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          address: formData.address,
          kebele: formData.kebele,
          googleMapsLink: formData.googleMapsLink || undefined,
        },
        paymentProof: formData.paymentProof || undefined,
      };

      // Include items for guest checkout
      if (!isAuthenticated && items.length > 0) {
        orderData.items = items;
      }

      await ordersApi.create(orderData);

      await clearCart();
      alert('Order placed successfully!');
      navigate('/orders');
    } catch (error: any) {
      if (error instanceof ApiError) {
        alert(error.message);
      } else {
        alert('Failed to place order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-stone-800 mb-8">{t.checkout}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-6">
            <h2 className="text-xl font-bold text-stone-800 mb-4">{t.customerInformation}</h2>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {t.name} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {t.phone} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="0912345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {t.email} ({t.optional})
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {t.address} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Street address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {t.kebele} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.kebele}
                onChange={(e) => setFormData({ ...formData, kebele: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Kebele name or number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {t.googleMapsLink} ({t.optional})
              </label>
              <input
                type="url"
                value={formData.googleMapsLink}
                onChange={(e) => setFormData({ ...formData, googleMapsLink: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="https://maps.google.com/..."
              />
              <p className="text-xs text-stone-500 mt-1">Share your location for easy delivery</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {t.paymentProof} ({t.optional})
              </label>
              <input
                type="text"
                value={formData.paymentProof}
                onChange={(e) => setFormData({ ...formData, paymentProof: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Transaction reference or proof"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-amber-700 transition-all disabled:opacity-50"
            >
              {loading ? t.placingOrder : t.placeOrder}
            </button>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sticky top-4">
            <h3 className="text-lg font-bold text-stone-800 mb-4">{t.orderSummary}</h3>
            
            <div className="space-y-3 mb-6">
              {currentItems.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-stone-600">
                    {item.teffType} ({item.quantity} {t.kilo})
                  </span>
                  <span className="font-bold">{(item.quantity * item.pricePerKilo).toFixed(2)} ETB</span>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-200 pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-stone-800">{t.totalPrice}</span>
                <span className="text-2xl font-black text-amber-700">
                  {totalAmount.toFixed(2)} ETB
                </span>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl text-sm text-amber-800">
              <p className="font-bold mb-2">{t.paymentInstructions}</p>
              <p>{t.paymentNotice}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

