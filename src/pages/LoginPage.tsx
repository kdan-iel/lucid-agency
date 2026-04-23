import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/Navbar';
import { checkRateLimit, getRateLimitWait, isValidEmail } from '../utils/security';
import { supabase } from '../lib/supabaseClient';
import { runWithAsyncGuard, toErrorMessage } from '../utils/asyncTools';

export default function LoginPage({ role }: { role: 'admin' | 'freelancer' }) {
  const { login, resetPassword, clearError } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const isAdminLogin = role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Veuillez renseigner votre email et votre mot de passe.');
      return;
    }

    if (!isValidEmail(email.trim())) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }

    if (!checkRateLimit('login_attempt', 5, 60_000)) {
      const wait = getRateLimitWait('login_attempt', 60_000);
      setError(`Trop de tentatives. Reessayez dans ${wait} secondes.`);
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const { profile: nextProfile, freelancer: nextFreelancer } = await login(
        email.trim().toLowerCase(),
        password
      );

      if (isAdminLogin && nextProfile.role !== 'admin') {
        await runWithAsyncGuard('auth.signOutUnauthorizedAdmin', async () => {
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) throw signOutError;
        });
        setError("Ce compte n'a pas accès à l'administration.");
        return;
      }

      if (nextProfile.role === 'freelancer') {
        if (!nextFreelancer) {
          await runWithAsyncGuard('auth.signOutMissingFreelancer', async () => {
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) throw signOutError;
          });
          setError('Aucune candidature freelancer associée à ce compte.');
          return;
        }

        if (nextFreelancer.statut === 'pending') {
          await runWithAsyncGuard('auth.signOutPendingFreelancer', async () => {
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) throw signOutError;
          });
          setError('Votre candidature est en attente de validation.');
          return;
        }

        if (nextFreelancer.statut === 'rejected') {
          await runWithAsyncGuard('auth.signOutRejectedFreelancer', async () => {
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) throw signOutError;
          });
          setError('Votre candidature a été rejetée.');
          return;
        }

        if (nextFreelancer.statut === 'suspended') {
          await runWithAsyncGuard('auth.signOutSuspendedFreelancer', async () => {
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) throw signOutError;
          });
          setError('Votre compte est suspendu.');
          return;
        }

        if (
          !nextFreelancer.onboarding_completed ||
          !nextFreelancer.phone_number ||
          !nextFreelancer.tarif_jour
        ) {
          window.location.href = '/complete-profile';
          return;
        }
      }

      window.location.href = nextProfile.role === 'admin' ? '/admin' : '/dashboard';
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Veuillez confirmer votre email avant de vous connecter.');
      } else if (msg.includes('Profil introuvable')) {
        setError('Compte incomplet. Contactez un administrateur.');
      } else if (msg.includes('Aucune candidature freelancer')) {
        setError('Aucune candidature freelancer associée à ce compte.');
      } else {
        setError('Une erreur est survenue. Veuillez reessayer.');
      }
      console.error('[LoginPage] login failure', {
        message: toErrorMessage(err),
        role,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resetEmail.trim()) {
      setError('Veuillez renseigner votre email.');
      return;
    }

    if (!isValidEmail(resetEmail.trim())) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(resetEmail.trim().toLowerCase());
      setResetSent(true);
    } catch (err) {
      const message = toErrorMessage(err, "Impossible d'envoyer le lien. Verifiez l'email.");
      console.error('[LoginPage] reset password failure', { message });
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (showReset) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Navbar />
        <div className="pt-32 pb-24 flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-[var(--bg-surface)] p-10 rounded-3xl border border-[var(--border-color)] shadow-2xl"
          >
            {resetSent ? (
              <div className="text-center">
                <div className="text-5xl mb-4">📧</div>
                <h2 className="text-2xl font-bold mb-3">Email envoyé !</h2>
                <p className="text-brand-gray mb-8">
                  Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de
                  passe.
                </p>
                <button
                  onClick={() => {
                    setShowReset(false);
                    setResetSent(false);
                  }}
                  className="text-brand-mint font-bold hover:underline"
                >
                  Retour à la connexion
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-2">Mot de passe oublié ?</h2>
                <p className="text-brand-gray mb-8">
                  Entrez votre email et nous vous enverrons un lien de réinitialisation.
                </p>
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray"
                      size={18}
                    />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Votre email"
                      required
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-mint transition-all"
                    />
                  </div>
                  {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-brand-mint text-[#0D1117] py-4 rounded-xl font-bold text-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:scale-100"
                  >
                    {isLoading ? 'Envoi...' : 'Envoyer le lien'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReset(false)}
                    className="w-full text-brand-gray hover:text-brand-mint transition-colors text-sm"
                  >
                    Retour à la connexion
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />
      <div className="pt-32 pb-24 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[var(--bg-surface)] p-10 rounded-3xl border border-[var(--border-color)] shadow-2xl"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-brand-mint/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-mint">
              <Lock size={32} />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {isAdminLogin ? t('login.title.admin') : t('login.title.freelancer')}
            </h1>
            <p className="text-brand-gray">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label className="block text-sm font-bold mb-2 text-brand-gray uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray"
                  size={18}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-mint transition-all"
                  placeholder="votre@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-brand-gray uppercase tracking-wider">
                {t('login.label.password')}
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray"
                  size={18}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-4 pl-12 pr-12 focus:outline-none focus:border-brand-mint transition-all"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gray hover:text-brand-mint transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="text-sm text-brand-gray hover:text-brand-mint transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm font-medium text-center bg-red-400/10 py-3 px-4 rounded-xl border border-red-400/20"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-mint text-[#0D1117] py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-mint/20 disabled:opacity-60 disabled:scale-100"
            >
              {isLoading ? 'Connexion...' : isAdminLogin ? 'Accéder à l’admin' : t('login.button')}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-[var(--border-color)] text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-brand-gray hover:text-brand-mint transition-colors font-medium"
            >
              <ArrowLeft size={16} />
              {t('login.back')}
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
