import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useState, FormEvent } from 'react';
import Navbar from '../components/Navbar';
import { checkRateLimit, getRateLimitWait } from '../utils/security';
import Footer from '../components/Footer';
import { freelancerSpecialties, joinFormSchema, JoinFormInput } from '../schemas';
import { supabase } from '../context/AuthContext';

// État initial du formulaire
const initialForm: JoinFormInput = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  specialty: '',
  portfolio: '',
  message: '',
};

const specialtyLabels: Record<(typeof freelancerSpecialties)[number], string> = {
  graphisme: 'Graphisme',
  video: 'Video',
  redaction: 'Redaction',
  webdev: 'Webdev',
  photo: 'Photo',
  marketing: 'Marketing',
  autre: 'Autre',
};

export default function JoinPage() {
  const { t } = useLanguage();

  const [form, setForm] = useState<JoinFormInput>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof JoinFormInput, string>>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Mise à jour d'un champ
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Effacer l'erreur du champ modifié
    if (errors[name as keyof JoinFormInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // ✅ Rate limiting — max 3 inscriptions par 10 minutes
    if (!checkRateLimit('join_submit', 3, 600_000)) {
      const wait = getRateLimitWait('join_submit', 600_000);
      setServerError('Trop de tentatives. Réessayez dans ' + Math.ceil(wait / 60) + ' minutes.');
      return;
    }

    // ✅ Validation Zod
    const result = joinFormSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof JoinFormInput, string>> = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof JoinFormInput;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      setStatus('loading');

      // ✅ Étape 1 : Créer le compte Supabase Auth
      // Le mot de passe est hashé automatiquement par Supabase (bcrypt)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          // Données passées au trigger (si configuré)
          data: {
            first_name: result.data.firstName,
            last_name: result.data.lastName,
            role: 'freelancer',
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erreur lors de la création du compte');

      // ✅ Étape 2 : Créer le profil dans la table profiles
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: authData.user.id,
        email: result.data.email.toLowerCase().trim(),
        first_name: result.data.firstName.trim(),
        last_name: result.data.lastName.trim(),
        role: 'freelancer',
      });

      if (profileError) throw profileError;

      // ✅ Étape 3 : Créer l'entrée freelancer
      const { error: freelancerError } = await supabase.from('freelancers').insert({
        user_id: authData.user.id,
        specialty: result.data.specialty.trim(),
        portfolio_url: result.data.portfolio?.trim() || null,
        bio: result.data.message?.trim() || null,
        status: 'pending', // En attente de validation admin
      });

      if (freelancerError) throw freelancerError;

      setStatus('success');
      setForm(initialForm);
    } catch (err) {
      console.error('Erreur inscription:', err);
      setStatus('error');

      // Message d'erreur lisible
      const message = (err as Error).message;
      if (message.includes('already registered')) {
        setServerError('Cet email est déjà utilisé.');
      } else {
        setServerError('Une erreur est survenue. Veuillez réessayer.');
      }
    }
  };

  // ✅ Page succès après inscription
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
            <h2 className="text-3xl font-bold mb-4">Candidature envoyée !</h2>
            <p className="text-brand-gray text-lg mb-2">
              Vérifie ta boîte mail pour confirmer ton adresse email.
            </p>
            <p className="text-brand-gray">
              Notre équipe examinera ta candidature et te contactera sous 48h.
            </p>
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
          {/* Header */}
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

          {/* Bénéfices */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-brand-darkblue p-8 rounded-2xl border border-white/5">
                <p className="text-brand-gray text-sm leading-relaxed">{t(`join.benefit${i}`)}</p>
              </div>
            ))}
          </div>

          {/* Formulaire */}
          <div className="bg-brand-darkblue p-6 md:p-10 rounded-3xl border border-white/5 shadow-2xl">
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Prénom + Nom */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                    Prénom <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${
                      errors.firstName ? 'border-red-400' : 'border-white/10'
                    }`}
                    placeholder="Ex: Jean"
                  />
                  {errors.firstName && (
                    <p className="text-red-400 text-xs ml-1">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                    Nom <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${
                      errors.lastName ? 'border-red-400' : 'border-white/10'
                    }`}
                    placeholder="Ex: Dupont"
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-xs ml-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${
                    errors.email ? 'border-red-400' : 'border-white/10'
                  }`}
                  placeholder="Ex: jean@email.com"
                />
                {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email}</p>}
              </div>

              {/* Mot de passe + Confirmation */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                    Mot de passe <span className="text-red-400">*</span>
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
                      placeholder="Min. 8 caractères"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gray hover:text-white transition-colors text-sm"
                    >
                      {showPassword ? 'Cacher' : 'Voir'}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs ml-1">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                    Confirmer <span className="text-red-400">*</span>
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
                      placeholder="Répète ton mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gray hover:text-white transition-colors text-sm"
                    >
                      {showConfirm ? 'Cacher' : 'Voir'}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-xs ml-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Spécialité + Portfolio */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                    Spécialité <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="specialty"
                    value={form.specialty}
                    onChange={handleChange}
                    className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors appearance-none ${
                      errors.specialty ? 'border-red-400' : 'border-white/10'
                    }`}
                  >
                    <option value="">Choisir une specialite</option>
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
                    Lien portfolio
                  </label>
                  <input
                    type="url"
                    name="portfolio"
                    value={form.portfolio}
                    onChange={handleChange}
                    className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors ${
                      errors.portfolio ? 'border-red-400' : 'border-white/10'
                    }`}
                    placeholder="https://monportfolio.com"
                  />
                  {errors.portfolio && (
                    <p className="text-red-400 text-xs ml-1">{errors.portfolio}</p>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">
                  Message (optionnel)
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full bg-brand-anthracite border rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none transition-colors resize-none ${
                    errors.message ? 'border-red-400' : 'border-white/10'
                  }`}
                  placeholder="Parle-nous de toi, de ton expérience..."
                />
                {errors.message && <p className="text-red-400 text-xs ml-1">{errors.message}</p>}
              </div>

              {/* Erreur serveur */}
              {serverError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm text-center font-medium"
                >
                  ❌ {serverError}
                </motion.p>
              )}

              {/* Bouton submit */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-brand-mint text-[#1A1A2E] py-5 rounded-xl font-bold text-lg hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-brand-mint/10 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              >
                {status === 'loading' ? 'Envoi en cours...' : t('join.cta')}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
