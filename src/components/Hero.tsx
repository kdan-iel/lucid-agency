import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { ArrowDown } from 'lucide-react';

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div className="absolute inset-0 bg-radial-gradient from-brand-mint/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter leading-tight mb-6">
            <span className="block text-[var(--text-primary)]">{t('hero.title1')}</span>
            <span className="block text-brand-mint">{t('hero.title2')}</span>
          </h1>
          
          <p className="text-brand-gray text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#contact"
              className="w-full sm:w-auto bg-brand-mint text-[#0D1117] px-10 py-4 rounded-full text-lg font-bold hover:scale-105 transition-transform shadow-lg shadow-brand-mint/20"
            >
              {t('hero.cta.primary')}
            </a>
            <a
              href="#talents"
              className="w-full sm:w-auto border border-[var(--border-color)] text-[var(--text-primary)] px-10 py-4 rounded-full text-lg font-bold hover:bg-white/5 transition-colors"
            >
              {t('hero.cta.secondary')}
            </a>
          </div>
        </motion.div>
      </div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-brand-mint/50"
      >
        <ArrowDown size={32} />
      </motion.div>
    </section>
  );
}
