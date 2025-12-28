import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Translation } from '../types';

interface MerchantLoginProps {
  t: Translation;
}

const MerchantLogin: React.FC<MerchantLoginProps> = ({ t }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { merchantLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await merchantLogin(email, password);
      navigate('/merchant-dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-100">
        <h2 className="text-3xl font-bold text-stone-800 mb-6 text-center">
          {t.merchantLogin}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-stone-500 mb-1">{t.email}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-500 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-amber-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Logging in...' : t.merchantLogin}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MerchantLogin;

