import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Globe, Sun, Moon, LayoutDashboard, LogOut, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { profile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('nav.philosophy'), href: '/#philosophie' },
    { name: t('nav.method'), href: '/#methode' },
    { name: t('nav.talents'), href: '/#talents' },
    { name: t('nav.offers'), href: '/#offres' },
    { name: t('nav.contact'), href: '/#contact' },
  ];

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  return (
    <nav className={`glass-navbar ${scrolled ? 'glass-navbar-scrolled py-4 shadow-xl' : 'py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/logo.png" alt="LUCID Agency Logo" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tighter text-[var(--text-primary)] font-ibm">LUCID</span>
            <span className="text-[10px] font-semibold tracking-[0.3em] text-brand-mint uppercase group-hover:opacity-80 transition-opacity font-ibm">Agency</span>
          </div>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="text-sm font-medium text-brand-gray hover:text-brand-mint transition-colors">
              {link.name}
            </a>
          ))}

          <div className="flex items-center gap-4 ml-4 border-l border-[var(--border-color)] pl-8">
            <button onClick={toggleTheme} className="p-2 text-brand-gray hover:text-brand-mint transition-colors" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setLang(lang === 'FR' ? 'EN' : 'FR')} className="flex items-center gap-1 text-xs font-bold text-brand-gray hover:text-[var(--text-primary)] transition-colors">
              <Globe size={14} />{lang}
            </button>

            {/* ✅ Boutons selon l'état de connexion */}
            {profile ? (
              <div className="flex items-center gap-3">
                <a
                  href={profile.role === 'admin' ? '/admin' : '/dashboard'}
                  className="flex items-center gap-2 text-sm font-bold text-brand-mint hover:opacity-80 transition-opacity"
                >
                  {profile.role === 'admin' ? <Shield size={16} /> : <LayoutDashboard size={16} />}
                  {profile.role === 'admin' ? 'Admin' : 'Dashboard'}
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm font-bold text-brand-gray hover:text-red-400 transition-colors"
                >
                  <LogOut size={16} />
                  {t('dashboard.nav.logout')}
                </button>
              </div>
            ) : (
              <a href="#contact" className="bg-brand-mint text-[#1A1A2E] px-5 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform">
                {t('nav.cta')}
              </a>
            )}
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <button onClick={toggleTheme} className="p-2 text-brand-gray hover:text-brand-mint transition-colors" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="text-[var(--text-primary)]" onClick={() => setIsOpen(!isOpen)} aria-label="Menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <a href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
                <img src="/logo.png" alt="LUCID" className="w-10 h-10" />
                <span className="text-2xl font-bold tracking-tighter text-white font-ibm">LUCID</span>
              </a>
              <button className="text-white p-2" onClick={() => setIsOpen(false)} aria-label="Fermer">
                <X size={32} />
              </button>
            </div>

            <div className="flex-grow flex flex-col justify-center px-10 gap-8">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setIsOpen(false)}
                  className="text-4xl font-black uppercase tracking-tighter text-white hover:text-brand-mint transition-colors"
                >
                  {link.name}
                </motion.a>
              ))}

              {/* ✅ Lien dashboard en mobile */}
              {profile && (
                <motion.a
                  href={profile.role === 'admin' ? '/admin' : '/dashboard'}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.1 }}
                  onClick={() => setIsOpen(false)}
                  className="text-2xl font-black uppercase tracking-tighter text-brand-mint"
                >
                  {profile.role === 'admin' ? '🛠 Admin' : '📊 Dashboard'}
                </motion.a>
              )}
            </div>

            <div className="p-10 border-t border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <button onClick={() => setLang(lang === 'FR' ? 'EN' : 'FR')} className="flex items-center gap-2 text-lg font-bold text-brand-mint">
                  <Globe size={24} />{lang === 'FR' ? 'English' : 'Français'}
                </button>
                <button onClick={toggleTheme} className="p-3 bg-white/5 rounded-full text-white">
                  {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
                </button>
              </div>

              {profile ? (
                <button
                  onClick={handleLogout}
                  className="block w-full bg-red-400/10 text-red-400 border border-red-400/20 py-5 rounded-2xl text-center font-black uppercase tracking-widest"
                >
                  {t('dashboard.nav.logout')}
                </button>
              ) : (
                <a
                  href="#contact"
                  onClick={() => setIsOpen(false)}
                  className="block w-full bg-brand-mint text-[#1A1A2E] py-5 rounded-2xl text-center font-black uppercase tracking-widest"
                >
                  {t('nav.cta')}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
