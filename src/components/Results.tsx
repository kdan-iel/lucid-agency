import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { TrendingUp, Users, Target } from 'lucide-react';

// ✅ Hook d'animation des compteurs
function useCountUp(target: number, duration = 2000, active = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, active]);

  return count;
}

function AnimatedMetric({ icon, prefix = '', target, suffix = '', label, delay = 0 }: {
  icon: React.ReactNode; prefix?: string; target: number; suffix?: string; label: string; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const count = useCountUp(target, 2000, isInView);

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-[var(--bg-surface)] p-10 rounded-3xl border border-[var(--border-color)] text-center hover:border-brand-mint/30 transition-all group">
      <div className="flex justify-center mb-6 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="text-5xl font-bold text-brand-mint mb-2 tabular-nums">
        {prefix}{count}{suffix}
      </div>
      <div className="text-brand-gray font-medium uppercase tracking-wider text-sm">{label}</div>
    </motion.div>
  );
}

export default function Results() {
  const { t } = useLanguage();

  const metrics = [
    { icon: <TrendingUp className="text-brand-mint" size={32} />, prefix: '+', target: 120, suffix: '%', label: t('results.roi'), delay: 0 },
    { icon: <Users className="text-brand-mint" size={32} />, prefix: '', target: 2, suffix: 'M+', label: t('results.reach'), delay: 0.1 },
    { icon: <Target className="text-brand-mint" size={32} />, prefix: '', target: 95, suffix: '%', label: t('results.conversion'), delay: 0.2 },
  ];

  const testimonials = [
    { quote: t('testimonials.1'), author: t('testimonials.1.author'), role: t('testimonials.1.role') },
    { quote: t('testimonials.2'), author: t('testimonials.2.author'), role: t('testimonials.2.role') },
  ];

  return (
    <section id="resultats" className="py-24 bg-brand-anthracite overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-[var(--text-primary)]">
            {t('results.title')}
          </motion.h2>
          <p className="text-brand-gray text-lg max-w-2xl mx-auto">{t('results.subtitle')}</p>
        </div>

        {/* ✅ Métriques avec compteurs animés */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {metrics.map((metric, i) => (
            <AnimatedMetric key={i} {...metric} />
          ))}
        </div>

        {/* Témoignages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[var(--bg-surface)] p-10 rounded-3xl border border-[var(--border-color)] relative hover:border-brand-mint/20 transition-all">
              <div className="text-brand-mint text-6xl font-serif absolute top-6 left-8 opacity-20 select-none">"</div>
              <p className="text-lg text-[var(--text-primary)] italic mb-8 relative z-10 leading-relaxed">
                {testimonial.quote}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-mint/20 flex items-center justify-center text-brand-mint font-bold text-sm">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-[var(--text-primary)]">{testimonial.author}</div>
                  <div className="text-brand-gray text-sm">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
