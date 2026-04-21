import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { type ContactFormInput, contactFormSchema } from '../schemas';
import { submitContact } from '../utils/remoteFunctions';
import {
  checkRateLimit,
  generateCsrfToken,
  getCsrfToken,
  getRateLimitWait,
  storeCsrfToken,
} from '../utils/security';

const CUSTOM_BUDGET_OPTION = 'Plus de 500 000 FCFA';
const DEFAULT_PROJECT_TYPE = 'Logo / Branding';

const BUDGET_OPTIONS = [
  '5 000 a 25 000 FCFA',
  '25 000 a 50 000 FCFA',
  '50 000 a 100 000 FCFA',
  '100 000 a 200 000 FCFA',
  '200 000 a 350 000 FCFA',
  '350 000 a 500 000 FCFA',
  CUSTOM_BUDGET_OPTION,
] as const;

const BUDGET_OPTION_LABELS: Record<'FR' | 'EN', Record<(typeof BUDGET_OPTIONS)[number], string>> = {
  FR: {
    '5 000 a 25 000 FCFA': '5 000 a 25 000 FCFA',
    '25 000 a 50 000 FCFA': '25 000 a 50 000 FCFA',
    '50 000 a 100 000 FCFA': '50 000 a 100 000 FCFA',
    '100 000 a 200 000 FCFA': '100 000 a 200 000 FCFA',
    '200 000 a 350 000 FCFA': '200 000 a 350 000 FCFA',
    '350 000 a 500 000 FCFA': '350 000 a 500 000 FCFA',
    'Plus de 500 000 FCFA': 'Plus de 500 000 FCFA',
  },
  EN: {
    '5 000 a 25 000 FCFA': '5,000 to 25,000 FCFA',
    '25 000 a 50 000 FCFA': '25,000 to 50,000 FCFA',
    '50 000 a 100 000 FCFA': '50,000 to 100,000 FCFA',
    '100 000 a 200 000 FCFA': '100,000 to 200,000 FCFA',
    '200 000 a 350 000 FCFA': '200,000 to 350,000 FCFA',
    '350 000 a 500 000 FCFA': '350,000 to 500,000 FCFA',
    'Plus de 500 000 FCFA': 'More than 500,000 FCFA',
  },
};

const initialForm: ContactFormInput = {
  name: '',
  company: '',
  phone: '',
  email: '',
  type: DEFAULT_PROJECT_TYPE,
  budget: BUDGET_OPTIONS[0],
  budgetDetails: '',
  message: '',
};

type ContactFormErrors = Partial<Record<keyof ContactFormInput, string | undefined>>;

export default function ContactForm() {
  const { lang, t } = useLanguage();
  const [form, setForm] = useState<ContactFormInput>(initialForm);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const [rateLimitWait, setRateLimitWait] = useState(0);

  useEffect(() => {
    const token = generateCsrfToken();
    storeCsrfToken(token);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'budget' && value !== CUSTOM_BUDGET_OPTION ? { budgetDetails: '' } : {}),
    }));

    if (errors[name as keyof ContactFormInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    if (name === 'budget' && value !== CUSTOM_BUDGET_OPTION && errors.budgetDetails) {
      setErrors((prev) => ({ ...prev, budgetDetails: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!checkRateLimit('contact_submit', 3, 60_000)) {
      const wait = getRateLimitWait('contact_submit', 60_000);
      setRateLimitWait(wait);
      setServerError(`Trop de tentatives. Réessayez dans ${wait} secondes.`);
      return;
    }

    const csrfToken = getCsrfToken();
    if (!csrfToken) {
      setServerError('Session invalide. Veuillez recharger la page.');
      return;
    }

    const result = contactFormSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: ContactFormErrors = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof ContactFormInput;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      setStatus('loading');

      const normalizedBudget =
        result.data.budget === CUSTOM_BUDGET_OPTION
          ? result.data.budgetDetails?.trim() || result.data.budget
          : result.data.budget;

      await submitContact({
        name: result.data.name.trim(),
        company: result.data.company?.trim() || '',
        email: result.data.email.toLowerCase().trim(),
        phone: result.data.phone?.trim() || '',
        type: result.data.type ?? DEFAULT_PROJECT_TYPE,
        budget: normalizedBudget ?? BUDGET_OPTIONS[0],
        budgetDetails: result.data.budgetDetails?.trim() || '',
        message: result.data.message.trim(),
      });

      // ✅ SUCCÈS
      setStatus('success');
      setForm(initialForm);

      const newToken = generateCsrfToken();
      storeCsrfToken(newToken);

      setTimeout(() => setStatus('idle'), 6000);
    } catch {
      setStatus('error');
      setServerError('Une erreur est survenue. Veuillez réessayer.');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const isBlocked = status === 'loading' || rateLimitWait > 0;
  const isCustomBudget = form.budget === CUSTOM_BUDGET_OPTION;

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
              placeholder="jean@societe.com"
              maxLength={255}
              autoComplete="email"
            />
            {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email}</p>}
          </div>

          <div className="space-y-2 mb-6">
            <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
              Téléphone <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone || ''}
              onChange={handleChange}
              className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${errors.phone ? 'border-red-400' : 'border-white/10'}`}
              placeholder="Ex: +228 90 00 00 00"
              maxLength={20}
              autoComplete="tel"
            />
            {errors.phone && <p className="text-red-400 text-xs ml-1">{errors.phone}</p>}
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
                {['Logo / Branding', 'Site Web', 'Video', 'Strategie', 'Autre'].map((option) => (
                  <option key={option}>{option}</option>
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
                {BUDGET_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {BUDGET_OPTION_LABELS[lang][option]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isCustomBudget && (
            <div className="space-y-2 mb-6">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                {t('contact.budget.details')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="budgetDetails"
                value={form.budgetDetails || ''}
                onChange={handleChange}
                className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${errors.budgetDetails ? 'border-red-400' : 'border-white/10'}`}
                placeholder={t('contact.budget.details.placeholder')}
                maxLength={50}
              />
              {errors.budgetDetails && (
                <p className="text-red-400 text-xs ml-1">{errors.budgetDetails}</p>
              )}
            </div>
          )}

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
              Demande envoyee ! Nous vous recontactons sous 24h.
            </motion.p>
          )}

          {(status === 'error' || rateLimitWait > 0) && serverError && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-center text-red-400 font-bold"
            >
              {serverError}
            </motion.p>
          )}
        </form>
      </div>
    </section>
  );
}
