import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight } from 'lucide-react';

export default function Method() {
  const { t } = useLanguage();

  const steps = [
    {
      id: '01',
      title: t('method.step1.title'),
      body: t('method.step1.body'),
    },
    {
      id: '02',
      title: t('method.step2.title'),
      body: t('method.step2.body'),
    },
    {
      id: '03',
      title: t('method.step3.title'),
      body: t('method.step3.body'),
    },
  ];

  return (
    <section id="methode" className="py-24 bg-brand-anthracite">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-[var(--text-primary)]">{t('method.title')}</h2>
          <div className="flex items-center justify-center gap-4 text-brand-mint font-bold tracking-widest text-sm uppercase">
            <span>DATA</span>
            <ArrowRight size={16} />
            <span>STRATÉGIE</span>
            <ArrowRight size={16} />
            <span>CRÉATION</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="bg-brand-darkblue p-10 rounded-2xl border border-white/5 hover:border-brand-mint/30 transition-colors group"
            >
              <span className="text-brand-mint font-bold text-5xl mb-8 block opacity-20 group-hover:opacity-100 transition-opacity">
                {step.id}
              </span>
              <h3 className="text-xl font-bold mb-4 tracking-wider">{step.title}</h3>
              <p className="text-brand-gray leading-relaxed">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
