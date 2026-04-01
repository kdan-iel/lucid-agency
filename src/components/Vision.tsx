import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

export default function Vision() {
  const { t } = useLanguage();

  const stats = [
    { val: t('vision.stat1.val'), label: t('vision.stat1.label') },
    { val: t('vision.stat2.val'), label: t('vision.stat2.label') },
    { val: t('vision.stat3.val'), label: t('vision.stat3.label') },
  ];

  return (
    <section id="vision" className="py-24 bg-brand-offwhite text-brand-anthracite relative overflow-hidden">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[15vw] font-bold text-brand-anthracite/5 pointer-events-none select-none">
        LUCID
      </div>

      <div className="container mx-auto px-7 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 leading-tight text-[var(--text-primary)]">
              {t('vision.title')}
            </h2>
            <p className="text-brand-gray text-lg leading-relaxed mb-12">
              {t('vision.body')}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-4xl font-bold text-brand-mint mb-2">{stat.val}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-gray">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-square bg-brand-anthracite rounded-2xl overflow-hidden shadow-2xl"
          >
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
              alt="Data Strategy"
              className="w-full h-full object-cover opacity-60 grayscale"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-anthracite via-transparent to-transparent" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
