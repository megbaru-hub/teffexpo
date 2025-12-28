import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Translation } from '../types';

interface CartProps {
  t: Translation;
}

const Cart: React.FC<CartProps> = ({ t }) => {
  const { cart, guestCart, updateItem, removeItem, totalAmount, loading, isAuthenticated } = useCart();
  const navigate = useNavigate();

  // Use cart if authenticated, otherwise use guestCart
  const currentItems = (isAuthenticated && cart ? cart.items : guestCart) || [];

  if (loading && isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-stone-500">Loading cart...</p>
      </div>
    );
  }

  if (currentItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-stone-800 mb-4">{t.cartEmpty}</h2>
        <Link to="/" className="text-amber-600 hover:underline">{t.continueShopping}</Link>
      </div>
    );
  }

  const handleQuantityChange = async (index: number, newQuantity: number) => {
    if (newQuantity < 0.1) return;
    try {
      await updateItem(index, newQuantity);
    } catch (error: any) {
      alert(error.message || 'Failed to update quantity');
    }
  };

  const handleRemove = async (index: number) => {
    if (confirm('Remove this item from cart?')) {
      try {
        await removeItem(index);
      } catch (error: any) {
        alert(error.message || 'Failed to remove item');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-stone-800 mb-8">{t.cart}</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="divide-y divide-stone-100">
          {currentItems.map((item, index) => (
            <div key={index} className="p-6 flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-stone-800 mb-2">
                  {item.teffType} {t.kilo}
                </h3>
                <p className="text-sm text-stone-500 mb-1">
                  Merchant: {item.merchant.name}
                </p>
                <p className="text-sm text-stone-600">
                  {item.pricePerKilo} ETB per {t.kilo}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(index, item.quantity - 0.5)}
                    className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50"
                  >
                    −
                  </button>
                  <span className="w-16 text-center font-bold">{item.quantity} {t.kilo}</span>
                  <button
                    onClick={() => handleQuantityChange(index, item.quantity + 0.5)}
                    className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-[100px]">
                  <p className="font-bold text-stone-800">
                    {(item.quantity * item.pricePerKilo).toFixed(2)} ETB
                  </p>
                </div>

                <button
                  onClick={() => handleRemove(index)}
                  className="text-red-500 hover:text-red-700 ml-4"
                  title={t.remove}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-stone-50 border-t border-stone-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-bold text-stone-800">{t.totalPrice}</span>
            <span className="text-2xl font-black text-amber-700">
              {totalAmount.toFixed(2)} ETB
            </span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-amber-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-amber-700 transition-all"
          >
            {t.proceedToCheckout}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;

