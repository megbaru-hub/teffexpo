import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      {/* Products Listing */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-stone-800 mb-8">Browse Teff Products</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.values(productsByMerchant).map(({ merchant, products: merchantProducts }) => (
              <div key={merchant._id} className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-100 border border-stone-200">
                      <img 
                        src={merchant.photo || '/default-merchant.jpg'} 
                        alt={merchant.name}
                        className="w-full h-full object-cover"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/default-merchant.jpg';
                        }}
                      />
                    </div>
                    <h3 className="text-lg font-bold text-stone-800">{merchant.name}</h3>
                  </div>
                  <div className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider self-center">
                    Verified
                  </div>
                </div>

                <div className="space-y-4">
                  {merchantProducts.map((product) => (
                    <div key={product._id} className="flex items-center justify-between border-b border-stone-50 pb-3">
                      <div>
                        <p className="font-medium text-stone-700">
                          {product.teffType === 'White' ? 'White Teff' : product.teffType === 'Red' ? 'Red Teff' : 'Mixed Teff'}
                        </p>
                        <p className="text-sm text-stone-500">
                          {product.pricePerKilo} ETB / kg
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs mb-1 ${product.stockAvailable > 0 ? 'text-stone-400' : 'text-red-400'}`}>
                          {product.stockAvailable > 0 ? `${product.stockAvailable} kg in stock` : 'Out of stock'}
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
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-stone-800">
                  {selectedProduct.teffType === 'White' ? 'White Teff' : selectedProduct.teffType === 'Red' ? 'Red Teff' : 'Mixed Teff'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600 text-xl">✕</button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-2">Quantity (kg)</label>
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
                  <span className="text-stone-500 font-medium">Total Price</span>
                  <span className="text-2xl font-black text-amber-700">{(quantity * selectedProduct.pricePerKilo).toFixed(2)} ETB</span>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full bg-amber-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-amber-700 transition-all"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
