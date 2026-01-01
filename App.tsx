import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Language, Translation } from './types';
import { TRANSLATIONS } from './constants';
import LanguageSwitcher from './components/LanguageSwitcher';
import AIAssistant from './components/AIAssistant';
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import MerchantDashboard from './pages/MerchantDashboard';
import MerchantLogin from './pages/MerchantLogin';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { useCart } from './contexts/CartContext';

// Simple loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
  </div>
);

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(Language.AMHARIC);
  const t = TRANSLATIONS[lang];
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-100 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-amber-600 p-2 rounded-lg group-hover:rotate-12 transition-transform">
                <span className="text-white font-black text-xl">T</span>
              </div>
              <span className="text-2xl font-black text-stone-800 tracking-tight">{t.title}</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/cart" className="text-stone-600 font-medium hover:text-amber-600 transition-colors relative">
                {t.cart}
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
              
              {/* Show merchant login for non-authenticated users */}
              {!isAuthenticated && (
                <Link to="/merchant-login" className="text-stone-600 font-medium hover:text-amber-600 transition-colors">
                  {t.merchantLogin}
                </Link>
              )}

              {/* Show admin dashboard link only for admin users */}
              {isAuthenticated && user?.role === 'admin' && (
                <Link to="/admin" className="text-stone-600 font-medium hover:text-amber-600 transition-colors">
                  {t.adminDashboard}
                </Link>
              )}

              {/* Show merchant dashboard link only for merchant users */}
              {isAuthenticated && user?.role === 'merchant' && (
                <Link to="/merchant-dashboard" className="text-stone-600 font-medium hover:text-amber-600 transition-colors">
                  {t.merchantDashboard}
                </Link>
              )}

              {/* Show logout button when authenticated */}
              {isAuthenticated && (
                <button
                  onClick={logout}
                  className="text-stone-600 font-medium hover:text-amber-600 transition-colors"
                >
                  {t.logout}
                </button>
              )}

              <LanguageSwitcher current={lang} onChange={setLang} />
            </nav>

            <div className="md:hidden flex items-center gap-4">
              <Link to="/cart" className="text-stone-600 relative">
                {t.cart}
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
              
              {/* Mobile menu items */}
              {isAuthenticated && (
                <button
                  onClick={logout}
                  className="text-stone-600 font-medium hover:text-amber-600 transition-colors"
                >
                  {t.logout}
                </button>
              )}
              
              <LanguageSwitcher current={lang} onChange={setLang} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home lang={lang} t={t} />} />
            <Route path="/products" element={<Products lang={lang} t={t} />} />
            <Route path="/cart" element={<Cart t={t} />} />
            <Route path="/checkout" element={<Checkout t={t} />} />
            
            {/* Auth routes */}
            <Route path="/login" element={
              isAuthenticated ? 
                (user?.role === 'admin' ? 
                  <Navigate to="/admin" replace /> : 
                  <Navigate to="/" replace />
                ) : 
                <Login t={t} />
            } />
            
            <Route path="/merchant-login" element={
              isAuthenticated && user?.role === 'merchant' ? 
                <Navigate to="/merchant-dashboard" replace /> : 
                <MerchantLogin t={t} />
            } />
            
            {/* Protected routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard t={t} />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/merchant-dashboard/*"
              element={
                <ProtectedRoute requiredRole="merchant">
                  <MerchantDashboard t={t} />
                </ProtectedRoute>
              }
            />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-stone-100 py-12 px-6 bg-stone-50 mt-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h4 className="text-xl font-bold text-stone-800 mb-4">{t.title}</h4>
              <p className="text-stone-500 max-w-sm mb-6">
                Ethiopia's digital bridge connecting traditional merchants to valued customers. 
                Quality Teff delivered with transparency and ease.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-stone-800 mb-4">Quick Links</h5>
              <ul className="space-y-2 text-stone-500">
                <li><Link to="/" className="hover:text-amber-600">{t.browseTeff}</Link></li>
                <li><Link to="/merchant-login" className="hover:text-amber-600">{t.merchantLogin}</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-stone-800 mb-4">Contact</h5>
              <ul className="space-y-2 text-stone-500">
                <li>support@teffexpo.et</li>
                <li>+251 911 000 000</li>
                <li>Addis Ababa, Ethiopia</li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-stone-200 text-center text-stone-400 text-sm">
            © {new Date().getFullYear()} TeffExpo. All rights reserved.
          </div>
        </footer>

        {/* AI Assistant */}
        <AIAssistant lang={lang} t={t} />
      </div>
    </HashRouter>
  );
};

export default App;
