import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { TrendingUp, Users, Target } from 'lucide-react';

export default function Results() {
  const { t } = useLanguage();

  const metrics = [
    {
      icon: <TrendingUp className="text-brand-mint" size={32} />,
      value: '+120%',
      label: t('results.roi'),
    },
    {
      icon: <Users className="text-brand-mint" size={32} />,
      value: '2M+',
      label: t('results.reach'),
    },
    {
      icon: <Target className="text-brand-mint" size={32} />,
      value: '95%',
      label: t('results.conversion'),
    },
  ];

  const testimonials = [
    {
      quote: t('Testimonials.1'),
      author: 'Jean Dupont',
      role: 'CEO, TechFlow',
    },
    {
      quote: t('Testimonials.2'),
      author: 'Marie Laurent',
      role: 'Marketing Director, LuxeStyle',
    },
  ];

  return (
    <section id="resultats" className="py-24 bg-brand-anthracite overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-[var(--text-primary)]">
            {t('results.title')}
          </h2>
          <p className="text-brand-gray text-lg max-w-2xl mx-auto">{t('results.subtitle')}</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {metrics.map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-[var(--bg-surface)] p-10 rounded-3xl border border-[var(--border-color)] text-center"
            >
              <div className="flex justify-center mb-6">{metric.icon}</div>
              <div className="text-5xl font-bold text-brand-mint mb-2">{metric.value}</div>
              <div className="text-brand-gray font-medium uppercase tracking-wider text-sm">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[var(--bg-surface)] p-10 rounded-3xl border border-[var(--border-color)] relative"
            >
              <div className="text-brand-mint text-6xl font-serif absolute top-6 left-6 opacity-20">
                "
              </div>
              <p className="text-xl text-[var(--text-primary)] italic mb-8 relative z-10">
                {testimonial.quote}
              </p>
              <div>
                <div className="font-bold text-[var(--text-primary)]">{testimonial.author}</div>
                <div className="text-brand-gray text-sm">{testimonial.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
