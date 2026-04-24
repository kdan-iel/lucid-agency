import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabaseClient';
import { resetPasswordFormSchema, type ResetPasswordFormInput } from '../schemas';
import { runWithAsyncGuard, toErrorMessage } from '../utils/asyncTools';
import { useTimeoutRegistry } from '../hooks/useTimeoutRegistry';

type FormErrors = Partial<Record<keyof ResetPasswordFormInput, string>>;
const SESSION_HYDRATION_TIMEOUT_MS = 1500;

export default function UpdatePasswordPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState<ResetPasswordFormInput>({ password: '', confirmPassword: '' });
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { clearAll, schedule } = useTimeoutRegistry();

  const translateValidationMessage = (message: string) => {
    const lookup: Record<string, string> = {
      'Minimum 8 caracteres': t('validation.passwordMin'),
      'Au moins une majuscule': t('validation.passwordUppercase'),
      'Au moins un chiffre': t('validation.passwordDigit'),
      'Au moins un caractere special': t('validation.passwordSpecial'),
      'Les mots de passe ne correspondent pas': t('validation.passwordMismatch'),
    };

    return lookup[message] ?? message;
  };

  const navigateTo = (path: string) => {
    if (window.location.pathname === path) return;
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const mapRecoveryError = (message: string) => {
    const normalized = message.toLowerCase();

    if (
      normalized.includes('expired') ||
      normalized.includes('invalid') ||
      normalized.includes('recovery') ||
      normalized.includes('token')
    ) {
      return t('resetPassword.error.invalidLink');
    }

    if (normalized.includes('session')) {
      return t('resetPassword.error.missingRecoverySession');
    }

    return t('resetPassword.error.generic');
  };

  useEffect(() => {
    let active = true;
    let hydrationTimeout: number | null = null;

    const clearHydrationTimeout = () => {
      if (hydrationTimeout === null) return;
      window.clearTimeout(hydrationTimeout);
      hydrationTimeout = null;
    };

    const resolveSession = (nextSession: Session | null) => {
      if (!active) return;
      clearHydrationTimeout();
      setSession(nextSession);
      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (session) {
        resolveSession(session);
        return;
      }

      if (event === 'SIGNED_OUT') {
        resolveSession(null);
      }
    });

    const initializeRecovery = async () => {
      setLoading(true);
      setServerError('');

      try {
        const {
          data: { session: nextSession },
        } = await runWithAsyncGuard('auth.getSession', () => supabase.auth.getSession(), {
          fallbackMessage: t('resetPassword.error.missingRecoverySession'),
        });

        if (!active) return;

        if (nextSession) {
          resolveSession(nextSession);
          return;
        }

        hydrationTimeout = window.setTimeout(() => {
          if (!active) return;
          resolveSession(null);
        }, SESSION_HYDRATION_TIMEOUT_MS);
      } catch (err) {
        if (!active) return;
        clearHydrationTimeout();
        setSession(null);
        setLoading(false);
        setServerError(mapRecoveryError(toErrorMessage(err, t('resetPassword.error.generic'))));
      }
    };

    void initializeRecovery();

    return () => {
      active = false;
      clearHydrationTimeout();
      clearAll();
      subscription.unsubscribe();
    };
  }, [clearAll, t]);

  useEffect(() => {
    if (loading) return;
    if (!window.location.search && !window.location.hash) return;
    window.history.replaceState({}, document.title, '/update-password');
  }, [loading, session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));

    if (errors[name as keyof ResetPasswordFormInput]) {
      setErrors((previous) => ({ ...previous, [name]: undefined }));
    }

    if (serverError) {
      setServerError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAll();
    setErrors({});
    setServerError('');

    const result = resetPasswordFormSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ResetPasswordFormInput;
        if (!fieldErrors[field]) {
          fieldErrors[field] = translateValidationMessage(issue.message);
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { session: nextSession },
      } = await runWithAsyncGuard(
        'auth.getSessionBeforePasswordUpdate',
        () => supabase.auth.getSession(),
        {
          fallbackMessage: t('resetPassword.error.missingRecoverySession'),
        }
      );

      if (!nextSession) {
        setSession(null);
        setServerError(t('resetPassword.error.invalidLink'));
        return;
      }

      setSession(nextSession);

      const { error } = await runWithAsyncGuard(
        'auth.updateRecoveredPassword',
        () => supabase.auth.updateUser({ password: result.data.password }),
        {
          fallbackMessage: t('resetPassword.error.generic'),
        }
      );

      if (error) {
        throw error;
      }

      clearAll();
      setIsSuccess(true);

      schedule(() => {
        navigateTo('/dashboard');
      }, 2000);
    } catch (err) {
      const message = toErrorMessage(err, t('resetPassword.error.generic'));
      console.error('[UpdatePasswordPage] password update failure', { message });
      setServerError(mapRecoveryError(message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center">
          <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-b-2 border-brand-mint" />
          <h1 className="mb-2 text-2xl font-bold">{t('resetPassword.loading.title')}</h1>
          <p className="text-brand-gray">{t('resetPassword.loading.body')}</p>
        </div>
      );
    }

    if (!session) {
      return (
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-400/10 text-red-400">
            <AlertTriangle size={32} />
          </div>
          <h1 className="mb-3 text-2xl font-bold">{t('resetPassword.invalid.title')}</h1>
          <p className="mb-8 text-brand-gray">
            {serverError || t('resetPassword.error.invalidLink')}
          </p>
          <button
            type="button"
            onClick={() => navigateTo('/login')}
            className="rounded-xl bg-brand-mint px-6 py-3 font-bold text-[#0D1117] transition-all hover:scale-[1.02]"
          >
            {t('resetPassword.invalid.cta')}
          </button>
        </div>
      );
    }

    if (isSuccess) {
      return (
        <div className="text-center">
          <CheckCircle size={64} className="mx-auto mb-4 text-brand-mint" />
          <h1 className="mb-3 text-2xl font-bold">{t('resetPassword.success.title')}</h1>
          <p className="text-brand-gray">{t('resetPassword.success.body')}</p>
        </div>
      );
    }

    return (
      <>
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-mint/10 text-brand-mint">
            <Lock size={32} />
          </div>
          <h1 className="mb-2 text-3xl font-bold">{t('resetPassword.title')}</h1>
          <p className="text-brand-gray">{t('resetPassword.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="space-y-2">
            <label className="ml-1 text-xs font-bold uppercase tracking-widest text-brand-gray">
              {t('join.field.password')} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                aria-label={`${t('join.field.password')} *`}
                className={`w-full rounded-xl border bg-[var(--bg-primary)] px-4 py-4 pr-12 text-[var(--text-primary)] outline-none transition-colors focus:border-brand-mint ${
                  errors.password ? 'border-red-400' : 'border-[var(--border-color)]'
                }`}
                placeholder={t('join.placeholder.password')}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gray transition-colors hover:text-brand-mint"
                aria-label={t('login.togglePassword')}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="ml-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-xs font-bold uppercase tracking-widest text-brand-gray">
              {t('join.field.confirmPassword')} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                aria-label={`${t('join.field.confirmPassword')} *`}
                className={`w-full rounded-xl border bg-[var(--bg-primary)] px-4 py-4 pr-12 text-[var(--text-primary)] outline-none transition-colors focus:border-brand-mint ${
                  errors.confirmPassword ? 'border-red-400' : 'border-[var(--border-color)]'
                }`}
                placeholder={t('join.placeholder.confirmPassword')}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((previous) => !previous)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gray transition-colors hover:text-brand-mint"
                aria-label={t('login.togglePassword')}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="ml-1 text-xs text-red-400">{errors.confirmPassword}</p>
            )}
          </div>

          {serverError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm font-medium text-red-400"
            >
              {serverError}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-brand-mint py-4 text-lg font-bold text-[#0D1117] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:opacity-60"
          >
            {isSubmitting ? t('resetPassword.submitLoading') : t('resetPassword.submit')}
          </button>
        </form>
      </>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 pb-24 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-8 shadow-2xl md:p-10"
        >
          {renderContent()}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
