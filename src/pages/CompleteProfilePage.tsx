import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabaseClient';

interface FreelancerData {
  phone_number: string;
  tarif_jour: number;
  bio?: string;
  specialite?: string;
}

export default function CompleteProfilePage() {
  const { profile, session } = useAuth();
  const [form, setForm] = useState<FreelancerData>({
    phone_number: '',
    tarif_jour: 25000,
    bio: '',
    specialite: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!profile) return;

    setForm((prev) => ({
      ...prev,
      phone_number: profile.phone ?? prev.phone_number,
      tarif_jour: profile.tarif_jour ?? prev.tarif_jour,
    }));

    if (profile.phone && profile.tarif_jour) {
      window.location.href = '/dashboard';
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'tarif_jour' ? Number.parseFloat(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const newErrors: Record<string, string> = {};

    if (!form.phone_number.trim()) {
      newErrors.phone_number = 'Numero de telephone requis';
    } else if (!/^\+?[1-9]\d{7,14}$/.test(form.phone_number.trim())) {
      newErrors.phone_number = 'Format invalide: +COUNTRYCODE 8-15 digits';
    }

    if (!form.tarif_jour || form.tarif_jour < 1000 || form.tarif_jour > 1000000) {
      newErrors.tarif_jour = 'Entre 1000 et 1000000 FCFA';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setStatus('loading');

    try {
      if (!session) throw new Error('No session');

      const { error } = await supabase.functions.invoke('complete-profile', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          phone_number: form.phone_number.trim(),
          tarif_jour: form.tarif_jour,
          bio: form.bio?.trim() || null,
          specialite: form.specialite?.trim() || null,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to complete profile');
      }

      setStatus('success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err) {
      setStatus('error');
      setServerError((err as Error).message);
      setTimeout(() => setStatus('idle'), 5000);
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
            <h2 className="text-3xl font-bold mb-4">Profil termine !</h2>
            <p className="text-brand-gray text-lg">Redirection vers le tableau de bord...</p>
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
        <div className="container mx-auto px-6 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Completer votre profil
            </h1>
            <p className="text-brand-gray text-lg">
              Pour pouvoir acceder au tableau de bord, veuillez renseigner les informations
              suivantes.
            </p>
          </motion.div>

          <div className="bg-brand-darkblue p-8 md:p-12 rounded-3xl border border-white/5">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label
                  htmlFor="complete-profile-phone"
                  className="text-xs font-bold uppercase tracking-widest text-brand-gray"
                >
                  Numero de telephone <span className="text-red-400">*</span>
                </label>
                <input
                  id="complete-profile-phone"
                  type="tel"
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="+221770000000"
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
                  Tarif journalier (FCFA) <span className="text-red-400">*</span>
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
                  <span className="text-brand-gray whitespace-nowrap">/jour</span>
                </div>
                {errors.tarif_jour && <p className="text-red-400 text-xs">{errors.tarif_jour}</p>}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="complete-profile-bio"
                  className="text-xs font-bold uppercase tracking-widest text-brand-gray"
                >
                  Bio (optionnel)
                </label>
                <textarea
                  id="complete-profile-bio"
                  name="bio"
                  value={form.bio || ''}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Parlez-nous de vous et de votre experience..."
                  className="w-full bg-brand-anthracite border border-white/10 rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors resize-none"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="complete-profile-specialite"
                  className="text-xs font-bold uppercase tracking-widest text-brand-gray"
                >
                  Specialite (optionnel)
                </label>
                <input
                  id="complete-profile-specialite"
                  type="text"
                  name="specialite"
                  value={form.specialite || ''}
                  onChange={handleChange}
                  placeholder="Ex: Developpeur React, Videoaste..."
                  className="w-full bg-brand-anthracite border border-white/10 rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors"
                />
              </div>

              {serverError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm text-center font-medium"
                >
                  ❌ {serverError}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-brand-mint text-[#1A1A2E] py-5 rounded-xl font-bold text-lg hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-brand-mint/10 disabled:opacity-60"
              >
                {status === 'loading' ? 'Enregistrement...' : 'Completer mon profil'}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
