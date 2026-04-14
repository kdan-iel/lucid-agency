import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useState, FormEvent, useEffect } from 'react';
import { contactFormSchema, ContactFormInput } from '../schemas';
import { supabase } from '../context/AuthContext';
import {
  checkRateLimit,
  getRateLimitWait,
  generateCsrfToken,
  storeCsrfToken,
  getCsrfToken,
} from '../utils/security';

const initialForm: ContactFormInput = {
  name: '',
  company: '',
  email: '',
  type: 'Logo / Branding',
  budget: '< 500K FCFA',
  message: '',
};

export default function ContactForm() {
  const { t } = useLanguage();
  const [form, setForm] = useState<ContactFormInput>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormInput, string>>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const [rateLimitWait, setRateLimitWait] = useState(0);

  // ✅ Générer un token CSRF au montage du composant
  useEffect(() => {
    const token = generateCsrfToken();
    storeCsrfToken(token);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ContactFormInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // ✅ Rate limiting côté client — max 3 soumissions par minute
    if (!checkRateLimit('contact_submit', 3, 60_000)) {
      const wait = getRateLimitWait('contact_submit', 60_000);
      setRateLimitWait(wait);
      setServerError(`Trop de tentatives. Réessayez dans ${wait} secondes.`);
      return;
    }

    // ✅ Vérification token CSRF
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
      setServerError('Session invalide. Veuillez recharger la page.');
      return;
    }

    // ✅ Validation Zod
    const result = contactFormSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormInput, string>> = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof ContactFormInput;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      setStatus('loading');

      // ✅ Envoi vers Supabase
      const { error } = await supabase.from('contact_submissions').insert({
        name: result.data.name.trim(),
        company: result.data.company?.trim() || null,
        email: result.data.email.toLowerCase().trim(),
        type: result.data.type,
        budget: result.data.budget,
        message: result.data.message.trim(),
      });

      if (error) throw error;

      setStatus('success');
      setForm(initialForm);

      // Renouveler le token CSRF après soumission réussie
      const newToken = generateCsrfToken();
      storeCsrfToken(newToken);

      setTimeout(() => setStatus('idle'), 6000);
    } catch (err) {
      console.error('Erreur envoi contact:', err);
      setStatus('error');
      setServerError('Une erreur est survenue. Veuillez réessayer.');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const isBlocked = status === 'loading' || rateLimitWait > 0;

  return (
    <section id="contact" className="py-24 bg-brand-anthracite">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            {t('contact.title')}
          </h2>
          <p className="text-brand-mint font-bold tracking-wide uppercase text-sm">
            {t('contact.reassurance')}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-brand-darkblue p-8 md:p-12 rounded-3xl border border-white/5 shadow-2xl"
        >
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                {t('contact.name')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${errors.name ? 'border-red-400' : 'border-white/10'}`}
                placeholder="Ex: Jean Dupont"
                maxLength={100}
              />
              {errors.name && <p className="text-red-400 text-xs ml-1">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                {t('contact.company')}
              </label>
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={handleChange}
                className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${errors.company ? 'border-red-400' : 'border-white/10'}`}
                placeholder="Ex: Lucid Agency"
                maxLength={100}
              />
              {errors.company && <p className="text-red-400 text-xs ml-1">{errors.company}</p>}
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${errors.email ? 'border-red-400' : 'border-white/10'}`}
              placeholder="jean@société.com"
              maxLength={255}
              autoComplete="email"
            />
            {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                {t('contact.type')}
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                aria-label={t('contact.type')}
                className="w-full bg-brand-anthracite border border-white/10 rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors appearance-none"
              >
                {['Logo / Branding', 'Site Web', 'Vidéo', 'Stratégie', 'Autre'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                {t('contact.budget')}
              </label>
              <select
                name="budget"
                value={form.budget}
                onChange={handleChange}
                aria-label={t('contact.budget')}
                className="w-full bg-brand-anthracite border border-white/10 rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors appearance-none"
              >
                {['< 500K FCFA', '500K – 1M FCFA', '1M – 3M FCFA', '+3M FCFA'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
              {t('contact.message')} <span className="text-red-400">*</span>
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={4}
              maxLength={5000}
              className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors resize-none ${errors.message ? 'border-red-400' : 'border-white/10'}`}
              placeholder="Dites-nous en plus sur votre projet..."
            />
            <div className="flex justify-between">
              {errors.message ? (
                <p className="text-red-400 text-xs ml-1">{errors.message}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-brand-gray">{form.message.length}/5000</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isBlocked}
            className="w-full bg-brand-mint text-[#1A1A2E] py-5 rounded-xl font-bold text-lg hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-brand-mint/10 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
          >
            {status === 'loading' ? 'Envoi en cours...' : t('contact.submit')}
          </button>

          {status === 'success' && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-center text-brand-mint font-bold"
            >
              ✅ Demande envoyée ! Nous vous recontactons sous 24h.
            </motion.p>
          )}

          {(status === 'error' || rateLimitWait > 0) && serverError && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-center text-red-400 font-bold"
            >
              ❌ {serverError}
            </motion.p>
          )}
        </form>
      </div>
    </section>
  );
}
