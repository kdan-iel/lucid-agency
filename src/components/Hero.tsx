import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { ArrowDown } from 'lucide-react';

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div className="absolute inset-0 bg-radial-gradient from-brand-mint/6 to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 text-center">
        <div className="flex flex-col items-center">
          <motion.h1 
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)', scale: 0.95 }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter leading-tight mb-6"
          >
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="block text-[var(--text-primary)]"
            >
              {t('hero.title1')}
            </motion.span>
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="block text-brand-mint"
            >
              {t('hero.title2')}
            </motion.span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-brand-gray text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
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
          </motion.div>
        </div>
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
