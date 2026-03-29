import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { Check } from 'lucide-react';

export default function Offers() {
  const { t } = useLanguage();

  const packs = [
    {
      id: 'audit',
      name: t('offers.audit.name'),
      type: t('offers.audit.type'),
      features: t('offers.audit.features').split(' · '),
      included: t('offers.audit.included'),
      recommended: false,
      cta: t('offers.audit.cta'),
    },
    {
      id: 'production',
      name: t('offers.production.name'),
      type: t('offers.production.type'),
      features: t('offers.production.features').split(' · '),
      included: t('offers.production.included'),
      recommended: false,
      cta: t('offers.production.cta'),
    },
    {
      id: 'growth',
      name: t('offers.growth.name'),
      type: t('offers.growth.type'),
      features: t('offers.growth.features').split(' · '),
      included: t('offers.growth.included'),
      recommended: true,
      cta: t('offers.growth.cta'),
      badge: t('offers.growth.badge'),
    },
  ];

  return (
    <section id="offres" className="py-24 bg-[var(--bg-primary)]">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-16 text-center text-[var(--text-primary)]">
          {t('offers.title')}
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {packs.map((pack, i) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-[var(--bg-surface)] p-10 rounded-3xl shadow-xl flex flex-col border border-[var(--border-color)] ${
                pack.recommended ? 'ring-2 ring-brand-mint' : ''
              }`}
            >
              {pack.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-mint text-[#0D1117] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  {pack.badge}
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">{pack.name}</h3>
                <p className="text-brand-gray font-medium">{pack.type}</p>
              </div>

              <div className="flex-grow mb-10">
                <ul className="space-y-4">
                  {pack.features.map(feature => (
                    <li key={feature} className="flex items-start gap-3 font-medium text-[var(--text-primary)]">
                      <Check size={18} className="text-brand-mint mt-1 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 pt-8 border-t border-[var(--border-color)] text-sm text-brand-gray italic">
                  {t('offers.included')}: {pack.included}
                </div>
              </div>

              <a
                href="#contact"
                className={`w-full py-4 rounded-xl text-center font-bold transition-all ${
                  pack.recommended
                    ? 'bg-brand-mint text-[#0D1117] hover:scale-[1.02]'
                    : 'bg-transparent text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-white/5'
                }`}
              >
                {pack.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
