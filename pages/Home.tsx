import React from 'react';
import { Link } from 'react-router-dom';
import { Language, Translation } from '../types';

interface HomeProps {
  lang: Language;
  t: Translation;
}

const Home: React.FC<HomeProps> = ({ t }) => {

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
            <Link to="/products" className="bg-amber-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-amber-700 transition-all">
              {t.browseTeff}
            </Link>
            <Link to="/merchant-login" className="bg-white text-amber-600 border-2 border-amber-600 px-8 py-3 rounded-full font-bold hover:bg-amber-50 transition-all">
              {t.merchantRegister}
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-12 bg-stone-50 rounded-3xl">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-stone-800 mb-4">Discover Fresh Teff</h2>
          <p className="text-stone-600 max-w-2xl mx-auto mb-8">
            Explore our selection of premium teff products from trusted local merchants.
            Find the perfect teff for your needs and have it delivered to your doorstep.
          </p>
          <Link 
            to="/products" 
            className="inline-block bg-amber-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-amber-700 transition-all"
          >
            {t.browseTeff}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;

