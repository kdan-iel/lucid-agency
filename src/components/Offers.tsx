import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { Check, Search, Layers, TrendingUp } from 'lucide-react';

export default function Offers() {
  const { t } = useLanguage();

  const packs = [
    {
      id: 'audit',
      icon: Search,
      name: t('offers.audit.name'),
      type: t('offers.audit.type'),
      features: t('offers.audit.features').split(' · '),
      included: t('offers.audit.included'),
      recommended: false,
      cta: t('offers.audit.cta'),
    },
    {
      id: 'production',
      icon: Layers,
      name: t('offers.production.name'),
      type: t('offers.production.type'),
      features: t('offers.production.features').split(' · '),
      included: t('offers.production.included'),
      recommended: false,
      cta: t('offers.production.cta'),
    },
    {
      id: 'growth',
      icon: TrendingUp,
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
    <section id="offres" className="py-32 bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-mint/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-mint/5 rounded-full blur-[120px] -z-10" />

      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-[var(--text-primary)]"
          >
            {t('offers.title')}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="h-1.5 w-24 bg-brand-mint mx-auto rounded-full"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {packs.map((pack, i) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`group relative bg-[var(--bg-surface)] p-8 md:p-10 rounded-[2.5rem] shadow-2xl flex flex-col border transition-all duration-500 hover:translate-y-[-8px] ${
                pack.recommended
                  ? 'border-brand-mint/30 ring-1 ring-brand-mint/20'
                  : 'border-[var(--border-color)] hover:border-brand-mint/20'
              }`}
            >
              {pack.recommended && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-brand-mint text-[#0D1117] px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-brand-mint/20">
                  {pack.badge}
                </div>
              )}

              <div className="mb-10">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                    pack.recommended
                      ? 'bg-brand-mint/10 text-brand-mint'
                      : 'bg-white/5 text-brand-gray'
                  }`}
                >
                  <pack.icon size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-black tracking-[0.3em] uppercase text-brand-mint mb-3">
                  {pack.name}
                </h3>
                <p className="text-3xl font-bold text-[var(--text-primary)] leading-tight">
                  {pack.type}
                </p>
              </div>

              <div className="flex-grow mb-12">
                <ul className="space-y-5">
                  {pack.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-4 group/item">
                      <div className="mt-1.5 p-0.5 rounded-full bg-brand-mint/10 text-brand-mint transition-colors group-hover/item:bg-brand-mint group-hover/item:text-[#0D1117]">
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <span className="text-[var(--text-primary)] font-medium leading-relaxed opacity-90 group-hover/item:opacity-100 transition-opacity">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-10 pt-8 border-t border-white/5">
                  <p className="text-xs uppercase tracking-widest text-brand-gray font-bold mb-3 opacity-60">
                    {t('offers.included')}
                  </p>
                  <p className="text-sm text-[var(--text-primary)] font-medium italic opacity-80 leading-relaxed">
                    {pack.included}
                  </p>
                </div>
              </div>

              <a
                href="#contact"
                className={`group/btn relative w-full py-5 rounded-2xl text-center font-black uppercase tracking-widest text-sm transition-all duration-300 overflow-hidden ${
                  pack.recommended
                    ? 'bg-brand-mint text-[#0D1117] hover:shadow-[0_0_30px_rgba(0,255,163,0.3)]'
                    : 'bg-white/5 text-[var(--text-primary)] border border-white/10 hover:bg-white/10'
                }`}
              >
                <span className="relative z-10">{pack.cta}</span>
                {pack.recommended && (
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]" />
                )}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
