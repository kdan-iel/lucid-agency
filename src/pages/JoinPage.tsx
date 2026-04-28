import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useState, FormEvent } from 'react';
import Navbar from '../components/Navbar';
import { checkRateLimit, getRateLimitWait } from '../utils/security';
import Footer from '../components/Footer';
import { freelancerSpecialties, joinFormSchema, JoinFormInput } from '../schemas';
import { submitJoinApplication } from '../utils/remoteFunctions';
import { toErrorMessage } from '../utils/asyncTools';
import { toUserSafeMessage } from '../utils/authSession';
import { handleError } from '../utils/errorFilter';

const initialForm: JoinFormInput = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phoneNumber: '',
  tarifJour: 25000,
  specialty: '',
  portfolio: '',
  message: '',
};

export default function JoinPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState<JoinFormInput>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof JoinFormInput, string>>>({});
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [legalError, setLegalError] = useState('');

  const specialtyLabels: Record<(typeof freelancerSpecialties)[number], string> = {
    graphisme: t('join.specialty.graphisme'),
    video: t('join.specialty.video'),
    redaction: t('join.specialty.redaction'),
    webdev: t('join.specialty.webdev'),
    photo: t('join.specialty.photo'),
    marketing: t('join.specialty.marketing'),
    autre: t('join.specialty.autre'),
  };

  const translateValidationMessage = (message: string) => {
    const lookup: Record<string, string> = {
      'Minimum 2 caracteres': t('validation.min2'),
      'Maximum 50 caracteres': t('validation.max50'),
      'Caracteres invalides': t('validation.invalidCharacters'),
      'Email invalide': t('validation.invalidEmail'),
      'Minimum 8 caracteres': t('validation.passwordMin'),
      'Au moins une majuscule': t('validation.passwordUppercase'),
      'Au moins un chiffre': t('validation.passwordDigit'),
      'Au moins un caractere special': t('validation.passwordSpecial'),
      'Numero de telephone requis': t('validation.phoneRequired'),
      'Format: +COUNTRYCODE 8-15 digits': t('validation.phoneFormat'),
      'Minimum 1000 FCFA': t('validation.rateMin'),
      'Maximum 1000000 FCFA': t('validation.rateMax'),
      'Veuillez choisir une specialite': t('validation.specialtyRequired'),
      'Specialite invalide': t('validation.specialtyInvalid'),
      'URL invalide (ex: https://monportfolio.com)': t('validation.invalidUrl'),
      'Maximum 1000 caracteres': t('validation.max1000'),
      'Le HTML nest pas autorise': t('validation.noHtml'),
      'Les mots de passe ne correspondent pas': t('validation.passwordMismatch'),
    };

    return lookup[message] ?? message;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((previous) => ({
      ...previous,
      [name]: name === 'tarifJour' ? Number.parseFloat(value) || 0 : value,
    }));

    if (errors[name as keyof JoinFormInput]) {
      setErrors((previous) => ({ ...previous, [name]: undefined }));
    }

    if (serverError) {
      setServerError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setErrors({});
    setLegalError('');

    if (!checkRateLimit('join_submit', 3, 600_000)) {
      const wait = Math.ceil(getRateLimitWait('join_submit', 600_000) / 60);
      setServerError(t('join.error.rateLimit').replace('{{minutes}}', String(wait)));
      return;
    }

    const result = joinFormSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof JoinFormInput, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof JoinFormInput;
        if (!fieldErrors[field]) fieldErrors[field] = translateValidationMessage(issue.message);
      });
      setErrors(fieldErrors);
      return;
    }

    if (!acceptedLegal) {
      setLegalError(t('join.legal.error'));
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus('idle');

      await submitJoinApplication({
        firstName: result.data.firstName.trim(),
        lastName: result.data.lastName.trim(),
        email: result.data.email.toLowerCase().trim(),
        password: result.data.password,
        phoneNumber: result.data.phoneNumber.trim(),
        tarifJour: result.data.tarifJour,
        specialty: result.data.specialty,
        portfolioUrl: result.data.portfolio?.trim() || '',
        message: result.data.message?.trim() || '',
      });

      setStatus('success');
      setForm(initialForm);
      setAcceptedLegal(false);
    } catch (err) {
      const message = toErrorMessage(err, t('join.error.generic'));
      console.error('[JoinPage] submit failure', { message });
      setStatus('error');
      const result = handleError(err);
      setServerError(
        result.type === 'user' ? result.message : toUserSafeMessage(result.error, t('join.error.generic'))
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-brand-darkest min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-3xl font-bold mb-4">{t('join.success.title')}</h2>
            <p className="text-brand-gray text-lg mb-2">{t('join.success.body1')}</p>
            <p className="text-brand-gray">{t('join.success.body2')}</p>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-brand-darkest min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              {t('join.title')}
            </h1>
            <p className="text-brand-gray text-xl">{t('join.subtitle')}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[1, 2, 3].map((index) => (
              <div key={index} className="bg-brand-darkblue p-8 rounded-2xl border border-white/5">
                <p className="text-brand-gray text-sm leading-relaxed">
                  {t(`join.benefit${index}`)}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-brand-darkblue p-6 md:p-10 rounded-3xl border border-white/5 shadow-2xl">
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                    {t('join.field.firstName')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${
                      errors.firstName ? 'border-red-400' : 'border-white/10'
                    }`}
                    placeholder={t('join.placeholder.firstName')}
                  />
                  {errors.firstName && (
                    <p className="text-red-400 text-xs ml-1">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                    {t('join.field.lastName')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${
                      errors.lastName ? 'border-red-400' : 'border-white/10'
                    }`}
                    placeholder={t('join.placeholder.lastName')}
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-xs ml-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                  {t('join.field.email')} <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${
                    errors.email ? 'border-red-400' : 'border-white/10'
                  }`}
                  placeholder={t('join.placeholder.email')}
                />
                {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                    {t('join.field.phone')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${
                      errors.phoneNumber ? 'border-red-400' : 'border-white/10'
                    }`}
                    placeholder={t('join.placeholder.phone')}
                  />
                  <p className="text-xs text-brand-gray ml-1">{t('join.help.phone')}</p>
                  {errors.phoneNumber && (
                    <p className="text-red-400 text-xs ml-1">{errors.phoneNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                    {t('join.field.rate')} <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="tarifJour"
                      value={form.tarifJour}
                      onChange={handleChange}
                      className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${
                        errors.tarifJour ? 'border-red-400' : 'border-white/10'
                      }`}
                      placeholder="15000"
                      min="1000"
                      max="1000000"
                    />
                    <span className="text-brand-gray text-sm whitespace-nowrap">
                      {t('join.field.rateSuffix')}
                    </span>
                  </div>
                  <p className="text-xs text-brand-gray ml-1">{t('join.help.rate')}</p>
                  {errors.tarifJour && (
                    <p className="text-red-400 text-xs ml-1">{errors.tarifJour}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                    {t('join.field.password')} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors pr-12 ${
                        errors.password ? 'border-red-400' : 'border-white/10'
                      }`}
                      placeholder={t('join.placeholder.password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gray hover:text-white transition-colors text-sm"
                    >
                      {showPassword ? t('join.password.hide') : t('join.password.show')}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs ml-1">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                    {t('join.field.confirmPassword')} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors pr-12 ${
                        errors.confirmPassword ? 'border-red-400' : 'border-white/10'
                      }`}
                      placeholder={t('join.placeholder.confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gray hover:text-white transition-colors text-sm"
                    >
                      {showConfirm ? t('join.password.hide') : t('join.password.show')}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-xs ml-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                    {t('join.field.specialty')} <span className="text-red-400">*</span>
                  </label>
                  <select
                    aria-label={t('join.field.specialty')}
                    name="specialty"
                    value={form.specialty}
                    onChange={handleChange}
                    className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors appearance-none ${
                      errors.specialty ? 'border-red-400' : 'border-white/10'
                    }`}
                  >
                    <option value="">{t('join.placeholder.specialty')}</option>
                    {freelancerSpecialties.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialtyLabels[specialty]}
                      </option>
                    ))}
                  </select>
                  {errors.specialty && (
                    <p className="text-red-400 text-xs ml-1">{errors.specialty}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                    {t('join.field.portfolio')}
                  </label>
                  <input
                    type="url"
                    name="portfolio"
                    value={form.portfolio}
                    onChange={handleChange}
                    className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${
                      errors.portfolio ? 'border-red-400' : 'border-white/10'
                    }`}
                    placeholder={t('join.placeholder.portfolio')}
                  />
                  {errors.portfolio && (
                    <p className="text-red-400 text-xs ml-1">{errors.portfolio}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                  {t('join.field.message')}
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors resize-none ${
                    errors.message ? 'border-red-400' : 'border-white/10'
                  }`}
                  placeholder={t('join.placeholder.message')}
                />
                {errors.message && <p className="text-red-400 text-xs ml-1">{errors.message}</p>}
              </div>

              <label className="flex items-start gap-3 text-sm text-brand-gray">
                <input
                  type="checkbox"
                  checked={acceptedLegal}
                  onChange={(e) => {
                    setAcceptedLegal(e.target.checked);
                    if (legalError) setLegalError('');
                  }}
                  className="mt-1 w-4 h-4 accent-brand-mint"
                />
                <span>
                  {t('join.legal.prefix')}{' '}
                  <a href="/legal" className="text-brand-mint hover:underline">
                    {t('join.legal.link')}
                  </a>
                </span>
              </label>
              {legalError && <p className="text-red-400 text-xs">{legalError}</p>}

              {serverError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm text-center font-medium"
                >
                  {serverError}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-mint text-[#1A1A2E] py-5 rounded-xl font-bold text-lg hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-brand-mint/10 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              >
                {isSubmitting ? t('join.submit.loading') : t('join.cta')}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-brand-gray">
              <span>{t('join.loginPrompt')}</span>{' '}
              <a href="/login" className="text-brand-mint font-bold hover:underline">
                {t('join.loginLink')}
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
