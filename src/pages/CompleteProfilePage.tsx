import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useTimeoutRegistry } from '../hooks/useTimeoutRegistry';
import { toErrorMessage } from '../utils/asyncTools';
import { completeFreelancerProfile } from '../utils/remoteFunctions';

interface FreelancerData {
  phone_number: string;
  tarif_jour: number;
  bio?: string;
  specialite?: string;
}

export default function CompleteProfilePage() {
  const { t } = useLanguage();
  const { freelancer, session, loading, refreshAuthState } = useAuth();
  const [form, setForm] = useState<FreelancerData>({
    phone_number: '',
    tarif_jour: 25000,
    bio: '',
    specialite: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const { clearAll, schedule } = useTimeoutRegistry();

  useEffect(() => {
    if (loading || !freelancer) return;

    setForm((previous) => ({
      ...previous,
      phone_number: freelancer.phone_number ?? previous.phone_number,
      tarif_jour: freelancer.tarif_jour ?? previous.tarif_jour,
      bio: freelancer.bio ?? previous.bio ?? '',
      specialite: freelancer.specialite ?? previous.specialite ?? '',
    }));

    if (freelancer.onboarding_completed && freelancer.phone_number && freelancer.tarif_jour) {
      window.location.href = '/dashboard';
    }
  }, [freelancer, loading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === 'tarif_jour' ? Number.parseFloat(value) || 0 : value,
    }));

    if (errors[name]) {
      setErrors((previous) => ({ ...previous, [name]: '' }));
    }

    if (serverError) {
      setServerError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAll();
    setServerError('');

    const nextErrors: Record<string, string> = {};

    if (!form.phone_number.trim()) {
      nextErrors.phone_number = t('completeProfile.error.phoneRequired');
    } else if (!/^\+?[1-9]\d{7,14}$/.test(form.phone_number.trim())) {
      nextErrors.phone_number = t('completeProfile.error.phoneInvalid');
    }

    if (!form.tarif_jour || form.tarif_jour < 1000 || form.tarif_jour > 1000000) {
      nextErrors.tarif_jour = t('completeProfile.error.rateInvalid');
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      if (!session) throw new Error(t('completeProfile.error.noSession'));

      setIsSubmitting(true);
      setStatus('idle');

      await completeFreelancerProfile(session.access_token, {
        phoneNumber: form.phone_number.trim(),
        tarifJour: form.tarif_jour,
        bio: form.bio?.trim() || null,
        specialite: form.specialite?.trim() || null,
      });

      await refreshAuthState();

      setStatus('success');
      schedule(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err) {
      const message = toErrorMessage(err, t('completeProfile.error.submit'));
      console.error('[CompleteProfilePage] submit failure', { message });
      setStatus('error');
      setServerError(message);
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
                  {t('completeProfile.field.bio')}
                </label>
                <textarea
                  id="complete-profile-bio"
                  name="bio"
                  value={form.bio || ''}
                  onChange={handleChange}
                  rows={3}
                  placeholder={t('completeProfile.field.bioPlaceholder')}
                  className="w-full bg-brand-anthracite border border-white/10 rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors resize-none"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="complete-profile-specialite"
                  className="text-xs font-bold uppercase tracking-widest text-brand-gray"
                >
                  {t('completeProfile.field.speciality')}
                </label>
                <input
                  id="complete-profile-specialite"
                  type="text"
                  name="specialite"
                  value={form.specialite || ''}
                  onChange={handleChange}
                  placeholder={t('completeProfile.field.specialityPlaceholder')}
                  className="w-full bg-brand-anthracite border border-white/10 rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors"
                />
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
