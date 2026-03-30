import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

export default function Philosophy() {
  const { t } = useLanguage();

  const values = [
    { title: t('philosophy.values.1.title'), body: t('philosophy.values.1.body') },
    { title: t('philosophy.values.2.title'), body: t('philosophy.values.2.body') },
    { title: t('philosophy.values.3.title'), body: t('philosophy.values.3.body') },
    { title: t('philosophy.values.4.title'), body: t('philosophy.values.4.body') },
  ];

  return (
    <section id="philosophie" className="py-24 bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-mint/5 -skew-x-12 translate-x-1/2 pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Vision & Mission - Editorial Layout */}
        <div className="space-y-48 mb-48">
          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-12 gap-12 items-center"
          >
            <div className="md:col-span-5">
              <div className="inline-block px-4 py-1 rounded-full bg-brand-mint/10 text-brand-mint text-xs font-bold uppercase tracking-widest mb-8">
                01 — {t('philosophy.vision.title')}
              </div>
              <h2 className="text-5xl md:text-8xl font-black leading-[0.85] tracking-tighter uppercase mb-8">
                {t('philosophy.vision.subtitle')}
              </h2>
            </div>
            <div className="md:col-span-6 md:col-start-7">
              <div className="relative">
                <div className="absolute -left-12 top-0 text-8xl font-serif text-brand-mint/20 leading-none">“</div>
                <p className="text-brand-gray text-2xl md:text-3xl leading-relaxed font-light italic">
                  {t('philosophy.vision.body')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-12 gap-12 items-center"
          >
            <div className="md:col-span-5 md:order-2 md:col-start-8">
              <div className="inline-block px-4 py-1 rounded-full bg-brand-mint/10 text-brand-mint text-xs font-bold uppercase tracking-widest mb-8">
                02 — {t('philosophy.mission.title')}
              </div>
              <h2 className="text-5xl md:text-8xl font-black leading-[0.85] tracking-tighter uppercase mb-8">
                {t('philosophy.mission.subtitle')}
              </h2>
            </div>
            <div className="md:col-span-6 md:order-1">
              <div className="space-y-12 text-brand-gray text-xl md:text-2xl leading-relaxed">
                <div className="flex gap-8 group">
                  <span className="text-brand-mint font-mono text-sm pt-2 group-hover:translate-x-2 transition-transform">/01</span>
                  <p>{t('philosophy.mission.body1')}</p>
                </div>
                <div className="flex gap-8 group">
                  <span className="text-brand-mint font-mono text-sm pt-2 group-hover:translate-x-2 transition-transform">/02</span>
                  <p>{t('philosophy.mission.body2')}</p>
                </div>
                <div className="flex gap-8 group">
                  <span className="text-brand-mint font-mono text-sm pt-2 group-hover:translate-x-2 transition-transform">/03</span>
                  <p>{t('philosophy.mission.body3')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Values */}
        <div className="pt-24 border-t border-[var(--border-color)]">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('philosophy.values.title')}</h2>
            <p className="text-brand-gray text-xl">{t('philosophy.values.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border-color)] hover:border-brand-mint/50 transition-all group"
              >
                <h3 className="text-xl font-bold mb-4 group-hover:text-brand-mint transition-colors">
                  {value.title}
                </h3>
                <p className="text-brand-gray leading-relaxed">
                  {value.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
