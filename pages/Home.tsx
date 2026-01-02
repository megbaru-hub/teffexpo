import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Star,
  ArrowUpRight,
  Zap,
  Users
} from 'lucide-react';
import { Language, Translation } from '../types';

interface HomeProps {
  lang: Language;
  t: Translation;
}

const Home: React.FC<HomeProps> = ({ t }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-[#FDFCFB]">
      {/* Premium Hero Section */}
      <section className="relative min-h-[90vh] flex items-center px-6 overflow-hidden pt-20">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-amber-50 rounded-full -mr-48 -mt-48 opacity-50 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-stone-100 rounded-full -ml-48 -mb-48 opacity-30 blur-3xl"></div>

        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="max-w-3xl"
            >
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-amber-100/50"
              >
                <Star className="w-3 h-3 fill-amber-700" />
                {t.title} Official
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-6xl md:text-8xl font-black text-stone-900 tracking-tight mb-8 leading-[1.05]"
              >
                {t.heroTitle.split(' ').map((word, i) => (
                  <span key={i} className={word.toLowerCase() === 'teff' || word === 'ጤፍ' ? 'text-amber-600' : ''}>
                    {word}{' '}
                  </span>
                ))}
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-xl md:text-2xl text-stone-500 mb-12 font-medium leading-relaxed max-w-xl"
              >
                {t.heroSub}
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-wrap gap-6">
                <Link
                  to="/products"
                  className="group bg-stone-900 text-white px-10 py-6 rounded-[2.5rem] font-black text-lg shadow-2xl shadow-stone-900/20 hover:bg-stone-800 transition-all active:scale-95 flex items-center gap-3"
                >
                  {t.browseTeff}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/merchant-register"
                  className="group bg-white text-stone-900 border-2 border-stone-100 px-10 py-6 rounded-[2.5rem] font-black text-lg hover:border-amber-200 hover:text-amber-600 transition-all active:scale-95 flex items-center gap-3"
                >
                  {t.merchantRegister}
                  <ArrowUpRight className="w-5 h-5 opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-16 flex items-center gap-8">
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-stone-100 overflow-hidden shadow-sm">
                      <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="text-sm font-bold text-stone-400">
                  <span className="text-stone-900 font-black">2,000+</span> Customers served this month
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              <div className="relative z-10 rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white group">
                <img
                  src="https://images.unsplash.com/photo-1599307734121-030ca4a9b400?q=80&w=1000&auto=format&fit=crop"
                  className="w-full aspect-[4/5] object-cover transition-transform duration-1000 group-hover:scale-110"
                  alt="Premium Teff"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-12 left-12 right-12">
                  <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-3xl p-6 text-white translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-70">Harvest of the Week</p>
                    <h3 className="text-2xl font-black">Premium Magna White Teff</h3>
                  </div>
                </div>
              </div>
              {/* Floating Cards */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -left-10 bg-white p-6 rounded-3xl shadow-2xl z-20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Authenticity</p>
                    <p className="text-sm font-black text-stone-900">100% Verified Grain</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-24 container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-10">
          {[
            { icon: Zap, title: t.fastDeliveryTitle, color: 'text-amber-600', bg: 'bg-amber-50' },
            { icon: Users, title: t.trustedMerchantsTitle, color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: ShieldCheck, title: t.qualityGuaranteedTitle, color: 'text-emerald-600', bg: 'bg-emerald-50' }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className={`${item.bg} ${item.color} w-16 h-16 rounded-[1.8rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-stone-900 mb-4">{item.title}</h3>
              <p className="text-stone-500 font-medium leading-relaxed">
                Experience the best of Ethiopian agriculture with our direct-to-consumer platform.
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-stone-900 rounded-[5rem] mx-6 mb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-600/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="container mx-auto px-12 text-center relative z-10">
          <h2 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-6">{t.howItWorks}</h2>
          <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-20 leading-tight flex items-center justify-center gap-4 flex-wrap">
            Three steps to <span className="text-amber-500 underline decoration-amber-500/30">pure Ethiopian teff</span>
          </h3>

          <div className="grid md:grid-cols-3 gap-20">
            {[
              { icon: ShoppingBag, title: t.step1Title, step: '01' },
              { icon: ShieldCheck, title: t.step2Title, step: '02' },
              { icon: Truck, title: t.step3Title, step: '03' }
            ].map((step, i) => (
              <div key={i} className="relative group text-left">
                <span className="text-7xl font-black text-white/5 absolute -top-8 -left-4 group-hover:text-amber-500/10 transition-colors uppercase tracking-widest">{step.step}</span>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8 group-hover:border-amber-500/50 transition-colors">
                    <step.icon className="w-8 h-8 text-amber-500" />
                  </div>
                  <h4 className="text-2xl font-black text-white mb-4">{step.title}</h4>
                  <p className="text-stone-500 font-medium">Simple, transparent, and built for your convenience.</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-24 pt-20 border-t border-white/5">
            <Link
              to="/products"
              className="inline-flex items-center gap-3 text-white font-black text-[10px] uppercase tracking-[0.4em] border-2 border-white/20 px-12 py-6 rounded-full hover:bg-white hover:text-stone-900 transition-all hover:scale-105"
            >
              Start Shopping Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Modern Newsletter/Footer Style Call to Action */}
      <section className="container mx-auto px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto bg-amber-50 rounded-[4rem] p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight mb-6">Ready to taste perfection?</h2>
            <p className="text-lg text-stone-600 mb-10 font-bold">Join thousands of households getting their teff direct from source.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/products"
                className="bg-stone-900 text-white px-12 py-6 rounded-full font-black shadow-xl shadow-stone-900/20 hover:scale-105 hover:bg-stone-800 transition-all active:scale-95"
              >
                {t.buyNow}
              </Link>
              <Link
                to="/merchant-login"
                className="bg-white text-stone-900 px-12 py-6 rounded-full font-black border border-amber-200 hover:border-amber-300 transition-all active:scale-95"
              >
                {t.merchantLogin}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
