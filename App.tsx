import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Package
} from 'lucide-react';
import { Language } from './types';
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

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(Language.AMHARIC);
  const t = TRANSLATIONS[lang];
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-[#FDFCFB]">
        {/* Premium Global Navigation */}
        <header className="sticky top-0 z-[100] w-full px-6 pt-6 pointer-events-none">
          <div className="max-w-7xl mx-auto pointer-events-auto">
            <div className="bg-white/70 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] px-8 py-5 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex justify-between items-center transition-all duration-500">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-12 h-12 bg-stone-900 rounded-[1.2rem] flex items-center justify-center text-white transition-all group-hover:rotate-12 group-hover:scale-110">
                  <span className="font-black text-2xl tracking-tighter">T</span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl font-black text-stone-900 tracking-tight block leading-none">{t.title}</span>
                  <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest leading-none">Marketplace</span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                <Link to="/products" className="px-6 py-2.5 rounded-xl text-xs font-black text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all uppercase tracking-widest">
                  {t.browseTeff}
                </Link>

                {isAuthenticated && user?.role === 'admin' && (
                  <Link to="/admin" className="px-6 py-2.5 rounded-xl text-xs font-black text-stone-500 hover:bg-stone-50 transition-all flex items-center gap-2 uppercase tracking-widest">
                    <LayoutDashboard className="w-4 h-4" /> {t.adminDashboard}
                  </Link>
                )}

                {isAuthenticated && user?.role === 'merchant' && (
                  <Link to="/merchant-dashboard" className="px-6 py-2.5 rounded-xl text-xs font-black text-stone-500 hover:bg-stone-50 transition-all flex items-center gap-2 uppercase tracking-widest">
                    <Package className="w-4 h-4" /> {t.merchantDashboard}
                  </Link>
                )}

                {!isAuthenticated && (
                  <Link to="/merchant-login" className="px-6 py-2.5 rounded-xl text-xs font-black text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all uppercase tracking-widest">
                    {t.merchantLogin}
                  </Link>
                )}
              </nav>

              <div className="flex items-center gap-4">
                <LanguageSwitcher current={lang} onChange={setLang} />

                <Link to="/cart" className="relative group">
                  <div className="w-14 h-14 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-600/20 group-hover:scale-110 group-hover:bg-amber-700 transition-all">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-stone-900 text-[10px] font-black text-white w-6 h-6 border-4 border-white rounded-full flex items-center justify-center"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </Link>

                {isAuthenticated && (
                  <button
                    onClick={logout}
                    className="hidden lg:flex w-12 h-12 rounded-2xl bg-red-50 text-red-500 items-center justify-center hover:bg-red-100 transition-all group"
                    title={t.logout}
                  >
                    <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </button>
                )}

                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-900"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile menu overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-[90] bg-white pt-32 px-10 md:hidden"
            >
              <div className="space-y-6">
                {['products', 'cart', 'merchant-login'].map((path) => (
                  <Link
                    key={path}
                    to={`/${path}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-4xl font-black text-stone-900 tracking-tight"
                  >
                    {path === 'products' ? t.browseTeff : path === 'cart' ? t.cart : t.merchantLogin}
                  </Link>
                ))}
                {isAuthenticated && (
                  <button onClick={logout} className="text-4xl font-black text-red-500">{t.logout}</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-grow pt-10">
          <Routes>
            <Route path="/" element={<Home lang={lang} t={t} />} />
            <Route path="/products" element={<Products lang={lang} t={t} />} />
            <Route path="/cart" element={<Cart t={t} />} />
            <Route path="/checkout" element={<Checkout t={t} />} />
            <Route path="/login" element={
              isAuthenticated ?
                (user?.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/" replace />) :
                <Login t={t} />
            } />
            <Route path="/merchant-login" element={
              isAuthenticated && user?.role === 'merchant' ?
                <Navigate to="/merchant-dashboard" replace /> :
                <MerchantLogin t={t} />
            } />
            <Route path="/admin/*" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard t={t} />
              </ProtectedRoute>
            } />
            <Route path="/merchant-dashboard/*" element={
              <ProtectedRoute requiredRole="merchant">
                <MerchantDashboard t={t} />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Premium Global Footer */}
        <footer className="bg-stone-900 text-white rounded-t-[5rem] pt-32 pb-12 px-10 mt-24 relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[1000px] h-[1000px] bg-amber-600/5 rounded-full -mt-[500px] blur-3xl"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-24">
              <div className="lg:col-span-5">
                <Link to="/" className="flex items-center gap-4 mb-8 group">
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-amber-600 transition-all group-hover:scale-110">
                    <span className="font-black text-3xl">T</span>
                  </div>
                  <span className="text-3xl font-black tracking-tight">{t.title}</span>
                </Link>
                <p className="text-stone-400 text-lg font-medium leading-relaxed max-w-md">
                  {t.footerAbout}
                </p>
                <div className="mt-10 flex gap-4">
                  <div className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-white/50">{t.verifiedMerchant}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-12">
                <div>
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] mb-10">Marketplace</h4>
                  <ul className="space-y-5">
                    {[
                      { l: t.browseTeff, p: '/products' },
                      { l: t.cart, p: '/cart' },
                      { l: t.merchantLogin, p: '/merchant-login' }
                    ].map((link, i) => (
                      <li key={i}>
                        <Link to={link.p} className="text-stone-400 hover:text-white transition-colors font-bold text-sm flex items-center group">
                          {link.l} <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] mb-10">{t.legal}</h4>
                  <ul className="space-y-5">
                    {[t.termsOfService, t.privacyPolicy].map((link, i) => (
                      <li key={i}>
                        <a href="#" className="text-stone-400 hover:text-white transition-colors font-bold text-sm">{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] mb-10">Support</h4>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">Email</p>
                      <p className="text-sm font-bold text-stone-200">hello@teffexpo.com</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">Phone</p>
                      <p className="text-sm font-bold text-stone-200">+251 911 22 33 44</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em]">
                © {new Date().getFullYear()} {t.title} • Handmade with passion
              </p>
              <div className="flex gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 border border-white/5 hover:border-white/20 transition-all rounded-full flex items-center justify-center text-stone-500 hover:text-white cursor-pointer">
                    <ArrowRight className="w-4 h-4 -rotate-45" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </footer>

        <AIAssistant lang={lang} t={t} />
      </div>
    </HashRouter>
  );
};

export default App;
