import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, User, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function LoginPage({ role }: { role: 'admin' | 'freelancer' }) {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password, role);
    if (!success) {
      setError(t('login.error'));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />

      <div className="pt-32 pb-24 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[var(--bg-surface)] p-10 rounded-3xl border border-[var(--border-color)] shadow-2xl"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-brand-mint/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-mint">
              <Lock size={32} />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {role === 'admin' ? t('login.title.admin') : t('login.title.freelancer')}
            </h1>
            <p className="text-brand-gray">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-brand-gray uppercase tracking-wider">
                {t('login.label.username')}
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray"
                  size={18}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-mint transition-all"
                  placeholder={t('login.placeholder.username')}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-brand-gray uppercase tracking-wider">
                {t('login.label.password')}
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray"
                  size={18}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-mint transition-all"
                  placeholder={t('login.placeholder.password')}
                  required
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm font-medium text-center">{error}</p>}

            <button
              type="submit"
              className="w-full bg-brand-mint text-[#0D1117] py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-mint/20"
            >
              {t('login.button')}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-[var(--border-color)] text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-brand-gray hover:text-brand-mint transition-colors font-medium"
            >
              <ArrowLeft size={16} />
              {t('login.back')}
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
