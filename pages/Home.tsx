import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Language, Translation, TeffType } from '../types';
import { productsApi, ApiError } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

interface HomeProps {
  lang: Language;
  t: Translation;
}

interface Product {
  _id: string;
  teffType: TeffType;
  pricePerKilo: number;
  stockAvailable: number;
  merchant: {
    _id: string;
    name: string;
  };
}

const Home: React.FC<HomeProps> = ({ lang, t }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
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

  const handleBuyClick = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setShowModal(true);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    try {
      // Pass product data for guest cart
      await addToCart(selectedProduct._id, quantity, {
        _id: selectedProduct._id,
        teffType: selectedProduct.teffType,
        pricePerKilo: selectedProduct.pricePerKilo,
        stockAvailable: selectedProduct.stockAvailable,
        merchant: selectedProduct.merchant,
        merchantId: selectedProduct.merchant._id,
        merchantName: selectedProduct.merchant.name,
      });
      alert('Item added to cart!');
      setShowModal(false);
    } catch (error: any) {
      if (error instanceof ApiError) {
        alert(error.message);
      } else {
        alert('Failed to add item to cart');
      }
    }
  };

  // Group products by merchant
  const productsByMerchant = products.reduce((acc, product) => {
    const merchantId = product.merchant._id;
    if (!acc[merchantId]) {
      acc[merchantId] = {
        merchant: product.merchant,
        products: [],
      };
    }
    acc[merchantId].products.push(product);
    return acc;
  }, {} as Record<string, { merchant: any; products: Product[] }>);

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="text-center py-12">
          <p className="text-stone-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative h-[400px] flex items-center justify-center text-center px-6 overflow-hidden rounded-3xl bg-amber-50">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img src="https://picsum.photos/1200/800?seed=teff" className="w-full h-full object-cover" alt="Background" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold text-stone-800 mb-6">{t.heroTitle}</h1>
          <p className="text-lg md:text-xl text-stone-600 mb-8">{t.heroSub}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#browse" className="bg-amber-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-amber-700 transition-all">
              {t.browseTeff}
            </a>
            <Link to="/merchant-login" className="bg-white text-amber-600 border-2 border-amber-600 px-8 py-3 rounded-full font-bold hover:bg-amber-50 transition-all">
              {t.merchantRegister}
            </Link>
          </div>
        </div>
      </section>

      {/* Products Listing */}
      <section id="browse" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
        {Object.values(productsByMerchant).map(({ merchant, products: merchantProducts }) => (
          <div key={merchant._id} className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-stone-800">{merchant.name}</h3>
              </div>
              <div className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                Verified
              </div>
            </div>

            <div className="space-y-4">
              {merchantProducts.map((product) => (
                <div key={product._id} className="flex items-center justify-between border-b border-stone-50 pb-3">
                  <div>
                    <p className="font-medium text-stone-700">
                      {product.teffType === 'White' ? t.whiteTeff : product.teffType === 'Red' ? t.redTeff : t.mixedTeff}
                    </p>
                    <p className="text-sm text-stone-500">
                      {product.pricePerKilo} ETB / {t.kilo}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs mb-1 ${product.stockAvailable > 0 ? 'text-stone-400' : 'text-red-400'}`}>
                      {product.stockAvailable > 0 ? `${product.stockAvailable} ${t.kilo} ${t.stockAvailable}` : t.noStock}
                    </p>
                    <button
                      disabled={product.stockAvailable <= 0}
                      onClick={() => handleBuyClick(product)}
                      className={`text-sm px-4 py-1.5 rounded-full font-bold transition-all ${
                        product.stockAvailable > 0 
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white' 
                          : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      {t.buyNow}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {showModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-stone-800">
                  {selectedProduct.teffType === 'White' ? t.whiteTeff : selectedProduct.teffType === 'Red' ? t.redTeff : t.mixedTeff}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600 text-xl">✕</button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-2">{t.quantity} ({t.kilo})</label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}
                      className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center text-2xl hover:bg-stone-50"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                      min={0.5}
                      max={selectedProduct.stockAvailable}
                      step={0.5}
                      className="flex-1 text-center text-2xl font-bold border-none focus:ring-0"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(selectedProduct.stockAvailable, quantity + 0.5))}
                      className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center text-2xl hover:bg-stone-50"
                    >
                      ＋
                    </button>
                  </div>
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-stone-500 font-medium">{t.totalPrice}</span>
                  <span className="text-2xl font-black text-amber-700">{(quantity * selectedProduct.pricePerKilo).toFixed(2)} ETB</span>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full bg-amber-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-amber-700 transition-all"
                >
                  {t.addToCart}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

