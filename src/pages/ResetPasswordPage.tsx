import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import { validatePassword } from '../utils/security';
import { useTimeoutRegistry } from '../hooks/useTimeoutRegistry';
import { runWithAsyncGuard, toErrorMessage } from '../utils/asyncTools';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const { clearAll, schedule } = useTimeoutRegistry();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAll();
    setError('');

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(`Mot de passe invalide : ${passwordValidation.errors.join(', ')}.`);
      return;
    }

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    try {
      await runWithAsyncGuard('auth.resetRecoveredPassword', async () => {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
      });
      setSuccess(true);
      schedule(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err) {
      const message = toErrorMessage(err, 'Impossible de mettre à jour le mot de passe.');
      console.error('[ResetPasswordPage] update failure', { message });
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />
      <div className="pt-32 pb-24 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[var(--bg-surface)] p-10 rounded-3xl border border-[var(--border-color)] shadow-2xl"
        >
          {success ? (
            <div className="text-center">
              <CheckCircle size={64} className="text-brand-mint mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3">Mot de passe mis à jour !</h2>
              <p className="text-brand-gray">Redirection en cours...</p>
            </div>
          ) : !validSession ? (
            <div className="text-center">
              <div className="text-5xl mb-4">🔗</div>
              <h2 className="text-2xl font-bold mb-3">Lien invalide ou expiré</h2>
              <p className="text-brand-gray mb-6">
                Ce lien de réinitialisation est invalide ou a expiré.
              </p>
              <a href="/" className="text-brand-mint font-bold hover:underline">
                Retour à l'accueil
              </a>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-brand-mint/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-mint">
                  <Lock size={32} />
                </div>
                <h1 className="text-3xl font-bold mb-2">Nouveau mot de passe</h1>
                <p className="text-brand-gray">
                  Choisissez un mot de passe sécurisé avec majuscule, chiffre et caractère spécial.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div>
                  <label className="block text-sm font-bold mb-2 text-brand-gray uppercase tracking-wider">
                    Nouveau mot de passe
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
                      placeholder="Min. 8 caractères"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gray hover:text-brand-mint"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-brand-gray uppercase tracking-wider">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray"
                      size={18}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-mint transition-all"
                      placeholder="Répétez le mot de passe"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-400 text-sm text-center bg-red-400/10 py-3 px-4 rounded-xl border border-red-400/20">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-mint text-[#0D1117] py-4 rounded-xl font-bold text-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:scale-100"
                >
                  {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
