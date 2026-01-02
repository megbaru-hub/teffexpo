import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  ShoppingBag,
  ArrowRight,
  Minus,
  Plus,
  AlertCircle,
  Truck,
  ShieldCheck,
  Package,
  ArrowLeft
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { Translation } from '../types';

interface CartProps {
  t: Translation;
}

const Cart: React.FC<CartProps> = ({ t }) => {
  const { cart, guestCart, updateItem, removeItem, totalAmount, loading, isAuthenticated } = useCart();
  const navigate = useNavigate();
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  // Use cart if authenticated, otherwise use guestCart
  const currentItems = (isAuthenticated && cart ? cart.items : guestCart) || [];

  if (loading && isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full"
        />
        <p className="text-stone-500 font-bold animate-pulse">{t.syncingCart}</p>
      </div>
    );
  }

  if (currentItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <ShoppingBag className="w-12 h-12 text-amber-600 opacity-20" />
        </motion.div>
        <h2 className="text-4xl font-black text-stone-900 mb-4 tracking-tight">{t.cartEmpty}</h2>
        <p className="text-stone-500 mb-10 max-w-md mx-auto font-medium">
          {t.cartDescription}
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-stone-900/20 hover:bg-stone-800 transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" /> {t.continueShopping}
        </Link>
      </div>
    );
  }

  const handleQuantityUpdate = async (index: number, newQuantity: number, maxStock: number) => {
    if (newQuantity < 0.5) return;
    if (newQuantity > maxStock) {
      alert(`Only ${maxStock} kg available in stock.`);
      return;
    }
    try {
      await updateItem(index, newQuantity);
    } catch (error: any) {
      alert(error.message || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (index: number) => {
    setRemovingIndex(index);
    try {
      await removeItem(index);
    } catch (error: any) {
      alert(error.message || 'Failed to remove item');
    } finally {
      setRemovingIndex(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-5xl font-black text-stone-900 tracking-tight mb-2">{t.cart}</h1>
          <p className="text-stone-500 font-medium">{t.items}: {currentItems.length}</p>
        </div>
        <Link to="/products" className="text-amber-600 font-black uppercase text-xs tracking-widest hover:text-amber-700 transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {t.continueShopping}
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {currentItems.map((item, index) => (
                <motion.div
                  key={`${item.product._id}-${index}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-white rounded-[2.5rem] border border-stone-100 p-8 shadow-sm hover:shadow-xl transition-all relative group"
                >
                  <div className="flex flex-wrap md:flex-nowrap items-center gap-8">
                    <div className="w-32 h-32 bg-stone-50 rounded-[2rem] flex items-center justify-center border border-stone-100 relative overflow-hidden group-hover:scale-105 transition-transform">
                      <span className="text-4xl">🌾</span>
                      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent"></div>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-wider">{item.teffType}</span>
                        <span className="text-stone-300 text-xs">|</span>
                        <span className="text-xs text-stone-400 font-bold flex items-center gap-1"><Package className="w-3 h-3" /> {item.merchant.name}</span>
                      </div>
                      <h3 className="text-2xl font-black text-stone-900 mb-1 leading-tight">{item.teffType} {t.title === 'ጤፍ ኤክስፖ' ? 'ጤፍ' : 'Teff'}</h3>
                      <p className="text-stone-500 font-bold">{item.pricePerKilo} <span className="text-xs uppercase">ETB / {t.kilo}</span></p>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="flex items-center bg-stone-50 rounded-2xl p-1.5 border border-stone-100">
                        <button
                          onClick={() => handleQuantityUpdate(index, item.quantity - 0.5, item.product.stockAvailable)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white hover:shadow-sm transition-all text-stone-400 hover:text-stone-900 disabled:opacity-20"
                          disabled={item.quantity <= 0.5}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-16 text-center font-black text-stone-800 text-lg">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityUpdate(index, item.quantity + 0.5, item.product.stockAvailable)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white hover:shadow-sm transition-all text-stone-400 hover:text-stone-900"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-right min-w-[120px]">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">{t.subtotal}</p>
                        <p className="text-2xl font-black text-stone-900 tracking-tight">
                          {(item.quantity * item.pricePerKilo).toLocaleString()} <span className="text-xs text-amber-600">ETB</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(index)}
                        disabled={removingIndex === index}
                        className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-all flex items-center justify-center disabled:opacity-50"
                        title={t.remove}
                      >
                        {removingIndex === index ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-32">
            <div className="bg-white rounded-[3rem] border border-stone-100 p-10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 opacity-50"></div>

              <h3 className="text-2xl font-black text-stone-900 mb-8 tracking-tight">{t.orderSummary}</h3>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-2">
                  <span className="text-stone-400 font-bold uppercase text-xs tracking-widest">{t.subtotal}</span>
                  <span className="text-stone-900 font-black">{totalAmount.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-stone-400 font-bold uppercase text-xs tracking-widest">{t.delivery}</span>
                  <span className="text-emerald-600 font-black text-[10px] uppercase tracking-widest">{t.calculatedAtNextStep}</span>
                </div>
                <div className="border-t border-stone-50 pt-6 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-900 font-black text-lg">{t.totalPrice}</span>
                    <div className="text-right">
                      <p className="text-3xl font-black text-amber-700 tracking-tighter">
                        {totalAmount.toLocaleString()} <span className="text-sm">ETB</span>
                      </p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{t.vatIncluded}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-10 p-6 bg-stone-50 rounded-[2rem] border border-stone-100">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-amber-600">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-stone-800 uppercase tracking-widest mb-0.5">{t.fastDelivery}</p>
                    <p className="text-[10px] text-stone-500 font-medium">{t.addisDeliveryTime}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-emerald-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-stone-800 uppercase tracking-widest mb-0.5">{t.secureTransaction}</p>
                    <p className="text-[10px] text-stone-500 font-medium">{t.secureNotice}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-stone-900 text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-stone-900/30 hover:bg-stone-800 transition-all flex items-center justify-center gap-3 group active:scale-95"
              >
                {t.proceedToCheckout} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-stone-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <AlertCircle className="w-3 h-3" /> {t.minOrder}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

