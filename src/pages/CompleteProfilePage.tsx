import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useTimeoutRegistry } from '../hooks/useTimeoutRegistry';
import { toErrorMessage } from '../utils/asyncTools';
import { navigate } from '../utils/navigation';
import { toUserSafeMessage } from '../utils/authSession';
import { handleError } from '../utils/errorFilter';
import { sanitizeUrl } from '../utils/security';

interface OnboardingFormData {
  first_name: string;
  last_name: string;
  phone_number: string;
  tarif_jour: string;
  bio: string;
  specialite: string;
  portfolio_url: string;
}

const GENERIC_SAFE_ERROR_MESSAGE = 'Une erreur est survenue. Veuillez réessayer.';

function splitFullName(fullName: string | null | undefined) {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

function getMessageCandidature(
  source: { message_candidature?: unknown } | null | undefined
): string | null {
  if (!source || typeof source.message_candidature !== 'string') {
    return null;
  }

  const value = source.message_candidature.trim();
  return value || null;
}

function buildInitialFormData(
  fullName: string | null | undefined,
  freelancer: {
    phone_number: string | null;
    tarif_jour: number | null;
    bio: string | null;
    specialite: string | null;
    portfolio_url?: string | null;
    message_candidature?: unknown;
  }
): OnboardingFormData {
  const { firstName, lastName } = splitFullName(fullName);
  const fallbackBio = freelancer.bio?.trim() || getMessageCandidature(freelancer) || '';

  return {
    first_name: firstName,
    last_name: lastName,
    phone_number: freelancer.phone_number ?? '',
    tarif_jour: freelancer.tarif_jour ? String(freelancer.tarif_jour) : '',
    bio: fallbackBio,
    specialite: freelancer.specialite ?? '',
    portfolio_url: freelancer.portfolio_url ?? '',
  };
}

function trimFormValues(form: OnboardingFormData) {
  return {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    phone_number: form.phone_number.trim(),
    tarif_jour: form.tarif_jour.trim(),
    bio: form.bio.trim(),
    specialite: form.specialite.trim(),
    portfolio_url: form.portfolio_url.trim(),
  };
}

function validateForm(
  form: OnboardingFormData,
  t: (key: string) => string
): Record<string, string> {
  const trimmed = trimFormValues(form);
  const nextErrors: Record<string, string> = {};
  const parsedRate = Number.parseFloat(trimmed.tarif_jour);

  if (!trimmed.first_name) {
    nextErrors.first_name = t('completeProfile.error.firstNameRequired');
  }

  if (!trimmed.last_name) {
    nextErrors.last_name = t('completeProfile.error.lastNameRequired');
  }

  if (!trimmed.phone_number) {
    nextErrors.phone_number = t('completeProfile.error.phoneRequired');
  } else if (!/^\+?[1-9]\d{7,14}$/.test(trimmed.phone_number)) {
    nextErrors.phone_number = t('completeProfile.error.phoneInvalid');
  }

  if (!trimmed.tarif_jour) {
    nextErrors.tarif_jour = t('completeProfile.error.rateRequired');
  } else if (!Number.isFinite(parsedRate) || parsedRate < 1000 || parsedRate > 1000000) {
    nextErrors.tarif_jour = t('completeProfile.error.rateInvalid');
  }

  if (!trimmed.bio) {
    nextErrors.bio = t('completeProfile.error.bioRequired');
  }

  if (!trimmed.specialite) {
    nextErrors.specialite = t('completeProfile.error.specialityRequired');
  }

  if (!trimmed.portfolio_url) {
    nextErrors.portfolio_url = t('completeProfile.error.portfolioRequired');
  } else if (!sanitizeUrl(trimmed.portfolio_url)) {
    nextErrors.portfolio_url = t('completeProfile.error.portfolioInvalid');
  }

  return nextErrors;
}

export default function CompleteProfilePage() {
  const { t } = useLanguage();
  const { freelancer, profile, session, loading, updateProfile, updateFreelancer } = useAuth();
  const [form, setForm] = useState<OnboardingFormData>({
    first_name: '',
    last_name: '',
    phone_number: '',
    tarif_jour: '',
    bio: '',
    specialite: '',
    portfolio_url: '',
  });
  const [initialForm, setInitialForm] = useState<OnboardingFormData | null>(null);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const { clearAll, schedule } = useTimeoutRegistry();

  useEffect(() => {
    if (loading || !freelancer || !profile) return;
    if (hydratedUserId === freelancer.user_id) return;

    const nextForm = buildInitialFormData(
      profile.full_name,
      freelancer as typeof freelancer & { message_candidature?: unknown }
    );

    setForm(nextForm);
    setInitialForm(nextForm);
    setHydratedUserId(freelancer.user_id);
    setErrors({});
    setServerError('');
    setStatus('idle');
  }, [freelancer, hydratedUserId, loading, profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    const nextForm = {
      ...form,
      [name]: value,
    } as OnboardingFormData;

    setForm(nextForm);

    if (Object.keys(errors).length > 0) {
      setErrors(validateForm(nextForm, t));
    }

    if (status === 'error') {
      setStatus('idle');
    }

    if (serverError) {
      setServerError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAll();
    setServerError('');
    setStatus('idle');

    const nextErrors = validateForm(form, t);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (!initialForm || !freelancer || !profile) {
      setServerError(GENERIC_SAFE_ERROR_MESSAGE);
      return;
    }

    const trimmedCurrent = trimFormValues(form);
    const trimmedInitial = trimFormValues(initialForm);
    const parsedRate = Number.parseFloat(trimmedCurrent.tarif_jour);
    const normalizedPortfolioUrl = sanitizeUrl(trimmedCurrent.portfolio_url);

    if (!normalizedPortfolioUrl) {
      setErrors((previous) => ({
        ...previous,
        portfolio_url: t('completeProfile.error.portfolioInvalid'),
      }));
      return;
    }

    try {
      setIsSubmitting(true);
      const profileUpdates: Parameters<typeof updateProfile>[0] = {};
      const freelancerUpdates: Parameters<typeof updateFreelancer>[0] = {};
      const nextFullName = `${trimmedCurrent.first_name} ${trimmedCurrent.last_name}`.trim();
      const initialFullName = `${trimmedInitial.first_name} ${trimmedInitial.last_name}`.trim();

      if (nextFullName !== initialFullName) {
        profileUpdates.full_name = nextFullName;
      }

      if (trimmedCurrent.phone_number !== trimmedInitial.phone_number) {
        freelancerUpdates.phone_number = trimmedCurrent.phone_number;
      }

      if (parsedRate !== Number.parseFloat(trimmedInitial.tarif_jour || '0')) {
        freelancerUpdates.tarif_jour = parsedRate;
      }

      if (trimmedCurrent.bio !== trimmedInitial.bio) {
        freelancerUpdates.bio = trimmedCurrent.bio;
      }

      if (trimmedCurrent.specialite !== trimmedInitial.specialite) {
        freelancerUpdates.specialite = trimmedCurrent.specialite;
      }

      if (trimmedCurrent.portfolio_url !== trimmedInitial.portfolio_url) {
        freelancerUpdates.portfolio_url = normalizedPortfolioUrl;
      }

      if (!freelancer.onboarding_completed) {
        freelancerUpdates.onboarding_completed = true;
      }

      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(profileUpdates);
      }

      if (Object.keys(freelancerUpdates).length > 0) {
        await updateFreelancer(freelancerUpdates);
      }

      setStatus('success');
      schedule(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
    } catch (err) {
      console.error('[CompleteProfilePage] submit failure', {
        message: toErrorMessage(err, t('completeProfile.error.submit')),
      });
      setStatus('error');
      const result = handleError(err);
      setServerError(
        result.type === 'user'
          ? result.message
          : toUserSafeMessage(result.error, GENERIC_SAFE_ERROR_MESSAGE)
      );
      schedule(() => setStatus('idle'), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCenteredState = (title: string, description: string, withSpinner = false) => (
    <div className="bg-brand-darkest min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          {withSpinner ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-mint mx-auto mb-6" />
          ) : (
            <div className="text-6xl mb-6">✅</div>
          )}
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <p className="text-brand-gray text-lg">{description}</p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );

  if (loading) {
    return renderCenteredState(
      t('completeProfile.loading.title'),
      t('completeProfile.loading.body'),
      true
    );
  }

  if (!session) {
    return renderCenteredState(
      t('completeProfile.fallback.title'),
      t('completeProfile.fallback.body')
    );
  }

  if (!freelancer) {
    return renderCenteredState(
      t('completeProfile.pending.title'),
      t('completeProfile.pending.body'),
      true
    );
  }

  if (status === 'success') {
    return renderCenteredState(
      t('completeProfile.success.title'),
      t('completeProfile.success.body')
    );
  }

  return (
    <div className="bg-brand-darkest min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              {t('completeProfile.title')}
            </h1>
            <p className="text-brand-gray text-lg">{t('completeProfile.subtitle')}</p>
          </motion.div>

          <div className="bg-brand-darkblue p-8 md:p-12 rounded-3xl border border-white/5">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="complete-profile-first-name"
                    className="text-xs font-bold uppercase tracking-widest text-brand-gray"
                  >
                    {t('completeProfile.field.firstName')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="complete-profile-first-name"
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder={t('completeProfile.field.firstNamePlaceholder')}
                    required
                    className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${
                      errors.first_name ? 'border-red-400' : 'border-white/10'
                    }`}
                  />
                  {errors.first_name && (
                    <p className="text-red-400 text-xs">{errors.first_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="complete-profile-last-name"
                    className="text-xs font-bold uppercase tracking-widest text-brand-gray"
                  >
                    {t('completeProfile.field.lastName')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="complete-profile-last-name"
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder={t('completeProfile.field.lastNamePlaceholder')}
                    required
                    className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${
                      errors.last_name ? 'border-red-400' : 'border-white/10'
                    }`}
                  />
                  {errors.last_name && (
                    <p className="text-red-400 text-xs">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="complete-profile-phone"
                  className="text-xs font-bold uppercase tracking-widest text-brand-gray"
                >
                  {t('completeProfile.field.phone')} <span className="text-red-400">*</span>
                </label>
                <input
                  id="complete-profile-phone"
                  type="tel"
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder={t('completeProfile.field.phonePlaceholder')}
                  required
                  className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${
                    errors.phone_number ? 'border-red-400' : 'border-white/10'
                  }`}
                />
                {errors.phone_number && (
                  <p className="text-red-400 text-xs">{errors.phone_number}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="complete-profile-rate"
                  className="text-xs font-bold uppercase tracking-widest text-brand-gray"
                >
                  {t('completeProfile.field.rate')} <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="complete-profile-rate"
                    type="number"
                    name="tarif_jour"
                    value={form.tarif_jour}
                    onChange={handleChange}
                    min="1000"
                    max="1000000"
                    placeholder="25000"
                    required
                    className={`flex-1 bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${
                      errors.tarif_jour ? 'border-red-400' : 'border-white/10'
                    }`}
                  />
                  <span className="text-brand-gray whitespace-nowrap">
                    {t('completeProfile.field.rateSuffix')}
                  </span>
                </div>
                {errors.tarif_jour && <p className="text-red-400 text-xs">{errors.tarif_jour}</p>}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="complete-profile-bio"
                  className="text-xs font-bold uppercase tracking-widest text-brand-gray"
                >
                  {t('completeProfile.field.bio')} <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="complete-profile-bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={3}
                  placeholder={t('completeProfile.field.bioPlaceholder')}
                  required
                  className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors resize-none ${
                    errors.bio ? 'border-red-400' : 'border-white/10'
                  }`}
                />
                {errors.bio && <p className="text-red-400 text-xs">{errors.bio}</p>}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="complete-profile-specialite"
                  className="text-xs font-bold uppercase tracking-widest text-brand-gray"
                >
                  {t('completeProfile.field.speciality')} <span className="text-red-400">*</span>
                </label>
                <input
                  id="complete-profile-specialite"
                  type="text"
                  name="specialite"
                  value={form.specialite}
                  onChange={handleChange}
                  placeholder={t('completeProfile.field.specialityPlaceholder')}
                  required
                  className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${
                    errors.specialite ? 'border-red-400' : 'border-white/10'
                  }`}
                />
                {errors.specialite && (
                  <p className="text-red-400 text-xs">{errors.specialite}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="complete-profile-portfolio"
                  className="text-xs font-bold uppercase tracking-widest text-brand-gray"
                >
                  {t('completeProfile.field.portfolio')} <span className="text-red-400">*</span>
                </label>
                <input
                  id="complete-profile-portfolio"
                  type="url"
                  name="portfolio_url"
                  value={form.portfolio_url}
                  onChange={handleChange}
                  placeholder={t('completeProfile.field.portfolioPlaceholder')}
                  required
                  className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${
                    errors.portfolio_url ? 'border-red-400' : 'border-white/10'
                  }`}
                />
                {errors.portfolio_url && (
                  <p className="text-red-400 text-xs">{errors.portfolio_url}</p>
                )}
              </div>

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
                className="w-full bg-brand-mint text-[#1A1A2E] py-5 rounded-xl font-bold text-lg hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-brand-mint/10 disabled:opacity-60"
              >
                {isSubmitting
                  ? t('completeProfile.submit.loading')
                  : t('completeProfile.submit.idle')}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
