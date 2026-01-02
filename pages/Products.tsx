import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Search,
  Filter,
  Clock,
  ShieldCheck,
  ArrowRight,
  Minus,
  Plus,
  X,
  Star,
  Package,
  ArrowUpRight
} from 'lucide-react';
import { Language, Translation, TeffType } from '../types';
import { productsApi, ApiError } from '../services/api';
import { useCart } from '../contexts/CartContext';

interface ProductsProps {
  lang: Language;
  t: Translation;
}

interface Product {
  _id: string;
  teffType: TeffType;
  pricePerKilo: number;
  stockAvailable: number;
  description?: string;
  merchant: {
    _id: string;
    name: string;
    photo?: string;
  };
}

const Products: React.FC<ProductsProps> = ({ lang, t }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<TeffType | 'All'>('All');
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(data as Product[]);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.teffType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || p.teffType === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  const handleBuyClick = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setShowModal(true);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    try {
      await addToCart(selectedProduct._id, quantity, {
        _id: selectedProduct._id,
        teffType: selectedProduct.teffType,
        pricePerKilo: selectedProduct.pricePerKilo,
        stockAvailable: selectedProduct.stockAvailable,
        merchant: selectedProduct.merchant,
        merchantId: selectedProduct.merchant._id,
        merchantName: selectedProduct.merchant.name,
      });
      setShowModal(false);
    } catch (error: any) {
      alert(error.message || 'Failed to add item to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full"
        />
        <p className="text-stone-500 font-bold animate-pulse">{t.syncingCart}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      {/* Premium Hero Header */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-50 rounded-full -mr-96 -mt-96 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-stone-100 rounded-full -ml-48 -mb-48 opacity-30 blur-3xl"></div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-amber-100/50"
          >
            <Star className="w-3 h-3 fill-amber-700" />
            {t.popularTeff}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-stone-900 tracking-tight mb-6 leading-[1.1]"
          >
            {t.exploreMarket}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-stone-500 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            {t.heroSub}
          </motion.p>
        </div>
      </section>

      {/* Modern Filter Bar */}
      <div className="container mx-auto px-6 mb-16">
        <div className="bg-white/70 backdrop-blur-xl border border-stone-100 rounded-[2.5rem] p-4 shadow-xl shadow-stone-900/5 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-amber-600 transition-colors" />
            <input
              type="text"
              placeholder={t.searchItems}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-stone-50/50 border-none rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-amber-500/10 focus:bg-white transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-stone-50/50 rounded-[2rem] w-full md:w-auto">
            {['All', 'White', 'Red', 'Mixed'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as any)}
                className={`flex-1 md:flex-none px-8 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all ${activeCategory === cat
                    ? 'bg-stone-900 text-white shadow-lg'
                    : 'text-stone-400 hover:text-stone-900'
                  }`}
              >
                {cat === 'All' ? t.allTypes : cat === 'White' ? t.whiteTeff : cat === 'Red' ? t.redTeff : t.mixedTeff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, idx) => (
              <motion.div
                layout
                key={product._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative bg-white rounded-[3.5rem] border border-stone-100 p-8 hover:shadow-2xl hover:shadow-stone-900/5 transition-all duration-500 flex flex-col"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-stone-50 rounded-full translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>

                {/* Product Icon/Type */}
                <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center text-4xl mb-8 relative border border-amber-100/50 z-10 group-hover:scale-110 transition-transform duration-500">
                  {product.teffType === 'White' ? '🌾' : product.teffType === 'Red' ? '🤎' : '🥞'}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform delay-100">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex-1 relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{t.verifiedMerchant}</span>
                  </div>
                  <h3 className="text-3xl font-black text-stone-900 tracking-tight mb-1 group-hover:text-amber-700 transition-colors">
                    {product.teffType === 'White' ? t.whiteTeff : product.teffType === 'Red' ? t.redTeff : t.mixedTeff}
                  </h3>
                  <p className="text-stone-400 font-bold text-sm mb-6 flex items-center gap-2">
                    <Package className="w-4 h-4" /> {product.merchant.name}
                  </p>

                  <div className="bg-stone-50/50 p-6 rounded-[2.5rem] mb-8 border border-stone-50 transition-colors group-hover:bg-amber-50/30 group-hover:border-amber-100/50">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">{t.pricePerKilo}</span>
                      <span className="text-xl font-black text-stone-900">{product.pricePerKilo} <span className="text-xs text-amber-600">ETB</span></span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">{t.availableWeight}</span>
                      <span className={`text-sm font-black ${product.stockAvailable < 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {product.stockAvailable} <span className="text-[10px] uppercase">{t.kilo}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={product.stockAvailable <= 0}
                  onClick={() => handleBuyClick(product)}
                  className={`w-full py-6 rounded-[2.5rem] font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3 relative z-10 overflow-hidden group/btn ${product.stockAvailable > 0
                      ? 'bg-amber-600 text-white shadow-xl shadow-amber-600/20 hover:bg-amber-700 active:scale-95'
                      : 'bg-stone-100 text-stone-400 opacity-50 cursor-not-allowed'
                    }`}
                >
                  {product.stockAvailable > 0 ? (
                    <>
                      {t.buyNow}
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  ) : t.noStock}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Premium Product Selection Modal */}
      <AnimatePresence>
        {showModal && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl bg-stone-900/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-2xl p-10 relative overflow-hidden"
            >
              {/* Decorative Gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full -mr-32 -mt-32 opacity-50"></div>

              <div className="relative z-10">
                <header className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-4xl font-black text-stone-900 tracking-tight leading-tight mb-1">
                      {selectedProduct.teffType === 'White' ? t.whiteTeff :
                        selectedProduct.teffType === 'Red' ? t.redTeff : t.mixedTeff}
                    </h2>
                    <p className="text-stone-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> {selectedProduct.merchant.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-14 h-14 rounded-2xl bg-stone-50 text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all flex items-center justify-center"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </header>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">
                      {t.quantity} ({t.kilo})
                    </label>
                    <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-[2.5rem] border border-stone-100">
                      <button
                        onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}
                        className="w-16 h-16 rounded-[1.8rem] bg-white text-stone-700 flex items-center justify-center transition-all hover:bg-stone-900 hover:text-white shadow-sm"
                      >
                        <Minus className="w-6 h-6" />
                      </button>

                      <div className="flex-1 flex flex-col items-center">
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setQuantity(Math.min(selectedProduct.stockAvailable, Math.max(0, val)));
                          }}
                          className="w-full text-center text-4xl font-black bg-transparent border-none focus:ring-0 text-stone-900"
                        />
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{t.kilo}</span>
                      </div>

                      <button
                        onClick={() => setQuantity(Math.min(selectedProduct.stockAvailable, quantity + 0.5))}
                        className="w-16 h-16 rounded-[1.8rem] bg-stone-900 text-white flex items-center justify-center transition-all hover:scale-105 shadow-xl shadow-stone-900/10"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-stone-900 p-8 rounded-[3rem] flex justify-between items-center shadow-2xl shadow-stone-900/20">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] mb-1">{t.totalPrice}</span>
                      <span className="text-4xl font-black text-white tracking-tight">
                        {(quantity * selectedProduct.pricePerKilo).toLocaleString()} <span className="text-xl text-amber-500">ETB</span>
                      </span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] mb-1">{t.delivery}</span>
                      <span className="text-white font-bold text-sm tracking-tight">{t.secureNotice}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-amber-600 text-white py-8 rounded-[3rem] font-black text-xl shadow-2xl shadow-amber-600/30 hover:bg-amber-700 transition-all flex items-center justify-center gap-4 active:scale-95 group"
                  >
                    <ShoppingBag className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    {t.addToCart}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
