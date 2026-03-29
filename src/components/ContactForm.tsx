import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useState, FormEvent } from 'react';

export default function ContactForm() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Simulation d'envoi
    setStatus('success');
    setTimeout(() => setStatus('idle'), 5000);
  };

  return (
    <section id="contact" className="py-24 bg-brand-anthracite">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">{t('contact.title')}</h2>
          <p className="text-brand-mint font-bold tracking-wide uppercase text-sm">
            {t('contact.reassurance')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-brand-darkblue p-8 md:p-12 rounded-3xl border border-white/5 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">{t('contact.name')}</label>
              <input
                required
                type="text"
                className="w-full bg-brand-anthracite border border-white/10 rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors"
                placeholder="Ex: Jean Dupont"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">{t('contact.company')}</label>
              <input
                required
                type="text"
                className="w-full bg-brand-anthracite border border-white/10 rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors"
                placeholder="Ex: Lucid Agency"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">{t('contact.type')}</label>
              <select className="w-full bg-brand-anthracite border border-white/10 rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors appearance-none">
                <option>Logo / Branding</option>
                <option>Site Web</option>
                <option>Vidéo</option>
                <option>Stratégie</option>
                <option>Autre</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">{t('contact.budget')}</label>
              <select className="w-full bg-brand-anthracite border border-white/10 rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors appearance-none">
                <option>&lt; 500K FCFA</option>
                <option>500K – 1M FCFA</option>
                <option>1M – 3M FCFA</option>
                <option>+3M FCFA</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">{t('contact.message')}</label>
            <textarea
              rows={4}
              className="w-full bg-brand-anthracite border border-white/10 rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors resize-none"
              placeholder="Dites-nous en plus sur votre projet..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand-mint text-[#1A1A2E] py-5 rounded-xl font-bold text-lg hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-brand-mint/10"
          >
            {t('contact.submit')}
          </button>

          {status === 'success' && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-center text-brand-mint font-bold"
            >
              Demande envoyée avec succès ! Nous vous recontactons sous 24h.
            </motion.p>
          )}
        </form>
      </div>
    </section>
  );
}
