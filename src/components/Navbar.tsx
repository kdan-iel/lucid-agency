import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, X, Globe, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
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

  return (
    <nav className={`glass-navbar ${scrolled ? 'py-4 shadow-xl' : 'py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <a href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-bold tracking-tighter text-[var(--text-primary)]">LUCID</span>
          <span className="text-xs font-semibold tracking-widest text-brand-mint uppercase group-hover:opacity-80 transition-opacity">Agency</span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-brand-gray hover:text-brand-mint transition-colors"
            >
              {link.name}
            </a>
          ))}
          
          <div className="flex items-center gap-4 ml-4 border-l border-[var(--border-color)] pl-8">
            <button
              onClick={toggleTheme}
              className="p-2 text-brand-gray hover:text-brand-mint transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => setLang(lang === 'FR' ? 'EN' : 'FR')}
              className="flex items-center gap-1 text-xs font-bold text-brand-gray hover:text-[var(--text-primary)] transition-colors"
            >
              <Globe size={14} />
              {lang}
            </button>
            <a
              href="#contact"
              className="bg-brand-mint text-[#1A1A2E] px-5 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform"
            >
              {t('nav.cta')}
            </a>
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <button
            onClick={toggleTheme}
            className="p-2 text-brand-gray hover:text-brand-mint transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="text-[var(--text-primary)]" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-brand-anthracite border-t border-[var(--border-color)] px-6 py-8 flex flex-col gap-6"
        >
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-lg font-medium text-[var(--text-primary)]"
            >
              {link.name}
            </a>
          ))}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
            <button
              onClick={() => {
                setLang(lang === 'FR' ? 'EN' : 'FR');
                setIsOpen(false);
              }}
              className="flex items-center gap-2 text-sm font-bold text-brand-mint"
            >
              <Globe size={18} />
              {lang === 'FR' ? 'English' : 'Français'}
            </button>
            <a
              href="#contact"
              onClick={() => setIsOpen(false)}
              className="bg-brand-mint text-[#1A1A2E] px-6 py-3 rounded-full text-sm font-bold"
            >
              {t('nav.cta')}
            </a>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
