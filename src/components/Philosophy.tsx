import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Minus } from 'lucide-react';

export default function Philosophy() {
  const { t } = useLanguage();
  const [visionExpanded, setVisionExpanded] = useState(false);
  const [missionExpanded, setMissionExpanded] = useState(false);

  const values = [
    { title: t('philosophy.values.1.title'), body: t('philosophy.values.1.body') },
    { title: t('philosophy.values.2.title'), body: t('philosophy.values.2.body') },
    { title: t('philosophy.values.3.title'), body: t('philosophy.values.3.body') },
    { title: t('philosophy.values.4.title'), body: t('philosophy.values.4.body') },
  ];

  return (
    <section
      id="philosophie"
      className="py-24 bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 relative overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-mint/5 -skew-x-12 translate-x-1/2 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Vision & Mission - Compact Accordion Layout */}
        <div className="space-y-6 mb-32">
          {/* Vision Accordion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`bg-[var(--bg-surface)] rounded-[2rem] border transition-all duration-500 overflow-hidden ${
              visionExpanded
                ? 'border-brand-mint ring-1 ring-brand-mint/20 shadow-2xl shadow-brand-mint/5'
                : 'border-[var(--border-color)]'
            }`}
          >
            <button
              onClick={() => setVisionExpanded(!visionExpanded)}
              className="w-full p-7 md:p-8 flex items-center justify-between group"
            >
              <div className="flex items-center gap-6">
                <span className="text-brand-mint font-mono text-sm">/01</span>
                <span className="text-xl md:text-2xl font-bold uppercase tracking-widest text-[var(--text-primary)] group-hover:text-brand-mint transition-colors">
                  {t('philosophy.vision.title')}
                </span>
              </div>
              <div
                className={`p-2 rounded-full transition-all duration-300 ${
                  visionExpanded
                    ? 'bg-brand-mint text-[#0D1117] rotate-180'
                    : 'bg-brand-mint/10 text-brand-mint'
                }`}
              >
                {visionExpanded ? <Minus size={20} /> : <Plus size={20} />}
              </div>
            </button>

            <AnimatePresence>
              {visionExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="px-6 md:px-8 pb-8 md:pb-12 pt-4 border-t border-brand-mint/10">
                    <div className="grid md:grid-cols-12 gap-8 items-start">
                      <div className="md:col-span-5">
                        <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tighter uppercase text-brand-mint">
                          {t('philosophy.vision.subtitle')}
                        </h2>
                      </div>
                      <div className="md:col-span-7 relative pt-4 md:pt-0">
                        <div className="absolute -left-4 md:-left-8 -top-6 md:-top-4 text-6xl font-serif text-brand-mint/20 leading-none">
                          “
                        </div>
                        <p className="text-brand-gray text-lg md:text-xl leading-relaxed font-light italic">
                          {t('philosophy.vision.body')}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Mission Accordion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`bg-[var(--bg-surface)] rounded-[2rem] border transition-all duration-500 overflow-hidden ${
              missionExpanded
                ? 'border-brand-mint ring-1 ring-brand-mint/20 shadow-2xl shadow-brand-mint/5'
                : 'border-[var(--border-color)]'
            }`}
          >
            <button
              onClick={() => setMissionExpanded(!missionExpanded)}
              className="w-full p-6 md:p-8 flex items-center justify-between group"
            >
              <div className="flex items-center gap-6">
                <span className="text-brand-mint font-mono text-sm">/02</span>
                <span className="text-xl md:text-2xl font-bold uppercase tracking-widest text-[var(--text-primary)] group-hover:text-brand-mint transition-colors">
                  {t('philosophy.mission.title')}
                </span>
              </div>
              <div
                className={`p-2 rounded-full transition-all duration-300 ${
                  missionExpanded
                    ? 'bg-brand-mint text-[#0D1117] rotate-180'
                    : 'bg-brand-mint/10 text-brand-mint'
                }`}
              >
                {missionExpanded ? <Minus size={20} /> : <Plus size={20} />}
              </div>
            </button>

            <AnimatePresence>
              {missionExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="px-6 md:px-8 pb-8 md:pb-12 pt-4 border-t border-brand-mint/10">
                    <div className="grid md:grid-cols-12 gap-8 items-start">
                      <div className="md:col-span-5">
                        <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tighter uppercase text-brand-mint">
                          {t('philosophy.mission.subtitle')}
                        </h2>
                      </div>
                      <div className="md:col-span-7 space-y-6 text-brand-gray text-lg md:text-xl leading-relaxed">
                        <div className="flex gap-4">
                          <span className="text-brand-mint font-mono text-sm pt-1">/01</span>
                          <p>{t('philosophy.mission.body1')}</p>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-brand-mint font-mono text-sm pt-1">/02</span>
                          <p>{t('philosophy.mission.body2')}</p>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-brand-mint font-mono text-sm pt-1">/03</span>
                          <p>{t('philosophy.mission.body3')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border-color)] hover:border-brand-mint/50 transition-all group"
              >
                <h3 className="text-xl font-bold mb-4 group-hover:text-brand-mint transition-colors">
                  {value.title}
                </h3>
                <p className="text-brand-gray leading-relaxed">{value.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
