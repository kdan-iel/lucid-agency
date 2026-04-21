import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  Search,
  X,
  CheckCircle,
  MapPin,
  Calendar,
  DollarSign,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { Phone as WhatsAppIcon } from 'lucide-react';
import { validatePassword } from '../utils/security';
import { updateFreelancerRecordByUserId } from '../utils/remoteFunctions';

interface Mission {
  id: number;
  title: string;
  category: string;
  duration: string;
  budget: string;
  description: string;
  company: string;
  postedAt: string;
}

const MISSIONS: Mission[] = [
  {
    id: 1,
    title: 'Refonte Identité Visuelle - Startup Fintech',
    category: 'Branding',
    duration: '3-4 semaines',
    budget: '2 500 €',
    company: 'LumiPay',
    postedAt: 'Il y a 2 jours',
    description:
      "Nous recherchons un expert en branding pour refondre complètement l'identité visuelle de notre startup fintech.",
  },
  {
    id: 2,
    title: 'Landing Page High-Convert - E-commerce',
    category: 'Web Design',
    duration: '1-2 semaines',
    budget: '1 200 €',
    company: 'EcoShop',
    postedAt: 'Il y a 5 heures',
    description:
      "Besoin d'une landing page optimisée pour la conversion pour le lancement d'un nouveau produit écologique.",
  },
  {
    id: 3,
    title: 'Série de Vidéos Motion Design',
    category: 'Motion Design',
    duration: '2-3 semaines',
    budget: '3 000 €',
    company: 'TechFlow',
    postedAt: 'Hier',
    description:
      'Création de 5 vidéos en motion design de 15-30 secondes pour une campagne publicitaire.',
  },
];

export default function DashboardPage() {
  const { t } = useLanguage();
  const { logout, profile, updateProfile, updatePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [appliedMissions, setAppliedMissions] = useState<number[]>([]);
  const [savedMissions, setSavedMissions] = useState<number[]>([]);
  const [notifications] = useState([
    {
      id: 1,
      text: 'Nouvelle mission disponible en Branding !',
      time: 'Il y a 10 min',
      read: false,
    },
    {
      id: 2,
      text: 'Votre candidature pour EcoShop a été consultée.',
      time: 'Il y a 2h',
      read: true,
    },
  ]);

  // Settings state
  const [profileForm, setProfileForm] = useState({
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
    bio: profile?.bio ?? '',
    phone: profile?.phone ?? '',
  });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'main' | 'profile' | 'security' | 'notifications'
  >('main');
  const [settingsStatus, setSettingsStatus] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle'
  );
  const [settingsError, setSettingsError] = useState('');

  const handleApply = (missionId: number) => {
    if (!appliedMissions.includes(missionId)) {
      setAppliedMissions([...appliedMissions, missionId]);
      setSelectedMission(null);
    }
  };

  const handleSave = (missionId: number) => {
    setSavedMissions((prev) =>
      prev.includes(missionId) ? prev.filter((id) => id !== missionId) : [...prev, missionId]
    );
  };

  // ✅ Sauvegarde du profil dans Supabase
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordValidation = validatePassword(passwordForm.new);
    if (!passwordValidation.valid) {
      setSettingsError(`Mot de passe invalide : ${passwordValidation.errors.join(', ')}.`);
      return;
    }
    setSettingsStatus('saving');
    setSettingsError('');
    try {
      await updateProfile({
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
        bio: profileForm.bio.trim(),
        phone: profileForm.phone.trim(),
      });
      // ✅ Mettre aussi à jour la table freelancers si bio
      if (profile?.role === 'freelancer') {
        await updateFreelancerRecordByUserId(profile.user_id, {
          bio: profileForm.bio.trim(),
        });
      }
      setSettingsStatus('success');
      setTimeout(() => {
        setSettingsStatus('idle');
        setActiveSettingsTab('main');
      }, 1500);
    } catch (err) {
      setSettingsError((err as Error).message);
      setSettingsStatus('error');
    }
  };

  // ✅ Mise à jour du mot de passe via Supabase (hashé côté serveur)
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    if (passwordForm.new !== passwordForm.confirm) {
      setSettingsError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (passwordForm.new.length < 8) {
      setSettingsError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setSettingsStatus('saving');
    try {
      await updatePassword(passwordForm.new);
      setSettingsStatus('success');
      setPasswordForm({ current: '', new: '', confirm: '' });
      setTimeout(() => {
        setSettingsStatus('idle');
        setActiveSettingsTab('main');
      }, 1500);
    } catch (err) {
      setSettingsError((err as Error).message);
      setSettingsStatus('error');
    }
  };

  const filteredMissions = useMemo(
    () =>
      MISSIONS.filter(
        (m) =>
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.category.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  const sidebarItems = [
    { id: 'overview', icon: <LayoutDashboard size={20} />, label: t('dashboard.nav.overview') },
    { id: 'projects', icon: <Briefcase size={20} />, label: t('dashboard.nav.missions') },
    { id: 'applications', icon: <CheckCircle size={20} />, label: t('dashboard.nav.applications') },
    { id: 'saved', icon: <Bell size={20} />, label: t('dashboard.nav.saved') },
    { id: 'messages', icon: <MessageSquare size={20} />, label: t('dashboard.nav.messages') },
    { id: 'settings', icon: <Settings size={20} />, label: t('dashboard.nav.settings') },
  ];

  const stats = [
    {
      id: 'projects',
      label: t('dashboard.stats.missions'),
      value: MISSIONS.length.toString(),
      color: 'text-brand-mint',
    },
    {
      id: 'applications',
      label: 'Candidatures',
      value: appliedMissions.length.toString(),
      color: 'text-blue-400',
    },
    {
      id: 'saved',
      label: 'Enregistrés',
      value: savedMissions.length.toString(),
      color: 'text-yellow-400',
    },
  ];

  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : 'Freelancer';
  const initials = profile ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}` : 'F';

  const renderMissionsList = () => (
    <div className="bg-[var(--bg-surface)] rounded-2xl md:rounded-3xl border border-[var(--border-color)] p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-xl font-bold">{t('dashboard.missions.title')}</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('dashboard.missions.search')}
            className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-mint transition-all w-full"
          />
        </div>
      </div>
      <div className="space-y-4">
        {filteredMissions.length > 0 ? (
          filteredMissions.map((mission) => (
            <div
              key={mission.id}
              onClick={() => setSelectedMission(mission)}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-6 rounded-2xl border border-[var(--border-color)] hover:border-brand-mint/30 transition-all cursor-pointer group gap-4"
            >
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-brand-mint/10 flex-shrink-0 flex items-center justify-center text-brand-mint font-bold">
                  {mission.company.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold mb-1 group-hover:text-brand-mint transition-colors text-sm md:text-base">
                    {mission.title}
                  </h3>
                  <p className="text-xs md:text-sm text-brand-gray">
                    {mission.category} · {mission.duration} · {mission.budget}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {appliedMissions.includes(mission.id) ? (
                  <span className="text-brand-mint text-sm font-bold flex items-center gap-1">
                    <CheckCircle size={16} /> Postulé
                  </span>
                ) : (
                  <button className="w-full sm:w-auto px-6 py-2 rounded-full border border-brand-mint text-brand-mint text-sm font-bold hover:bg-brand-mint hover:text-[#0D1117] transition-all">
                    {t('dashboard.missions.view')}
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-brand-gray">
            Aucune mission ne correspond à votre recherche.
          </div>
        )}
      </div>
    </div>
  );

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setActiveTab(stat.id)}
            className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-color)] cursor-pointer hover:border-brand-mint/50 transition-all group"
          >
            <div className="text-brand-gray text-sm font-medium mb-2">{stat.label}</div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="mt-4 text-xs text-brand-gray opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              Voir les détails <span className="text-brand-mint">→</span>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">{renderMissionsList()}</div>
        <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
          <h2 className="text-xl font-bold mb-8">Notifications</h2>
          <div className="space-y-6">
            {notifications.map((notif) => (
              <div key={notif.id} className="flex gap-4">
                <div
                  className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.read ? 'bg-brand-gray/30' : 'bg-brand-mint shadow-[0_0_8px_rgba(0,255,186,0.5)]'}`}
                />
                <div>
                  <p
                    className={`text-sm leading-relaxed ${notif.read ? 'text-brand-gray' : 'text-[var(--text-primary)]'}`}
                  >
                    {notif.text}
                  </p>
                  <span className="text-[10px] text-brand-gray mt-1 block">{notif.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const renderApplications = () => (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
      <h2 className="text-2xl font-bold mb-8">{t('dashboard.nav.applications')}</h2>
      {appliedMissions.length > 0 ? (
        <div className="space-y-4">
          {MISSIONS.filter((m) => appliedMissions.includes(m.id)).map((mission) => (
            <div
              key={mission.id}
              className="flex items-center justify-between p-6 rounded-2xl border border-[var(--border-color)] bg-white/5"
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-brand-mint/10 flex items-center justify-center text-brand-mint font-bold">
                  {mission.company.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{mission.title}</h3>
                  <p className="text-sm text-brand-gray">
                    {mission.company} · Postulé le {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className="px-4 py-1 rounded-full bg-yellow-400/10 text-yellow-400 text-xs font-bold uppercase border border-yellow-400/20">
                {t('admin.status.pending')}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <CheckCircle size={32} className="text-brand-mint mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Aucune candidature</h3>
          <p className="text-brand-gray mb-8">Vous n'avez pas encore postulé à des missions.</p>
          <button
            onClick={() => setActiveTab('projects')}
            className="bg-brand-mint text-[#0D1117] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all"
          >
            Découvrir les missions
          </button>
        </div>
      )}
    </div>
  );

  const renderSaved = () => (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
      <h2 className="text-2xl font-bold mb-8">{t('dashboard.nav.saved')}</h2>
      {savedMissions.length > 0 ? (
        <div className="space-y-4">
          {MISSIONS.filter((m) => savedMissions.includes(m.id)).map((mission) => (
            <div
              key={mission.id}
              onClick={() => setSelectedMission(mission)}
              className="flex items-center justify-between p-6 rounded-2xl border border-[var(--border-color)] hover:border-brand-mint/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-brand-mint/10 flex items-center justify-center text-brand-mint font-bold">
                  {mission.company.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold mb-1 group-hover:text-brand-mint">{mission.title}</h3>
                  <p className="text-sm text-brand-gray">
                    {mission.category} · {mission.budget}
                  </p>
                </div>
              </div>
              <button className="px-6 py-2 rounded-full border border-brand-mint text-brand-mint text-sm font-bold hover:bg-brand-mint hover:text-[#0D1117] transition-all">
                {t('dashboard.missions.view')}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-brand-gray">
          Vous n'avez aucune mission enregistrée.
        </div>
      )}
    </div>
  );

  const renderMessages = () => (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8 flex flex-col items-center justify-center text-center min-h-[500px]">
      <div className="w-20 h-20 bg-brand-mint/10 rounded-full flex items-center justify-center text-brand-mint mb-8">
        <WhatsAppIcon size={40} />
      </div>
      <h2 className="text-3xl font-bold mb-4">Contactez l'agence sur WhatsApp</h2>
      <p className="text-brand-gray text-lg max-w-md mb-10">
        Pour toute question, discutez directement avec notre équipe via WhatsApp.
      </p>
      <a
        href="https://wa.me/22890123456"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-brand-mint text-[#0D1117] px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all flex items-center gap-3"
      >
        <WhatsAppIcon size={24} />
        Ouvrir WhatsApp
      </a>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">
          {activeSettingsTab === 'main' ? (
            t('dashboard.settings.title')
          ) : (
            <button
              onClick={() => setActiveSettingsTab('main')}
              className="flex items-center gap-2 hover:text-brand-mint transition-colors"
            >
              <ChevronRight className="rotate-180" size={24} />
              {activeSettingsTab === 'profile' && t('dashboard.settings.profile')}
              {activeSettingsTab === 'security' && t('dashboard.settings.security')}
              {activeSettingsTab === 'notifications' && t('dashboard.settings.notifications')}
            </button>
          )}
        </h2>
      </div>

      {activeSettingsTab === 'main' && (
        <div className="space-y-6">
          <div className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-[var(--border-color)]">
            <div className="w-20 h-20 rounded-full bg-brand-mint flex items-center justify-center text-[#0D1117] text-3xl font-bold">
              {initials}
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">{displayName}</h3>
              <p className="text-brand-gray">{profile?.email}</p>
              <span className="text-xs text-brand-mint font-bold uppercase">{profile?.role}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                id: 'profile',
                label: t('dashboard.settings.profile'),
                desc: 'Gérez votre visibilité et vos compétences.',
              },
              {
                id: 'notifications',
                label: t('dashboard.settings.notifications'),
                desc: 'Configurez vos alertes de missions.',
              },
              {
                id: 'security',
                label: t('dashboard.settings.security'),
                desc: 'Mot de passe et authentification.',
              },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  setActiveSettingsTab(item.id as 'profile' | 'security' | 'notifications')
                }
                className="p-6 rounded-2xl border border-[var(--border-color)] hover:border-brand-mint/30 transition-all cursor-pointer group"
              >
                <h3 className="font-bold mb-1 group-hover:text-brand-mint">{item.label}</h3>
                <p className="text-sm text-brand-gray">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ Profil sauvegardé dans Supabase */}
      {activeSettingsTab === 'profile' && (
        <form className="space-y-6 max-w-xl" onSubmit={handleSaveProfile}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-brand-gray">Prénom</label>
              <input
                type="text"
                value={profileForm.first_name}
                onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-brand-gray">Nom</label>
              <input
                type="text"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">Téléphone</label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder="+228 XX XX XX XX"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">Bio</label>
            <textarea
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              rows={4}
              placeholder="Décrivez-vous..."
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all resize-none"
            />
          </div>
          {settingsError && <p className="text-red-400 text-sm">{settingsError}</p>}
          {settingsStatus === 'success' && (
            <p className="text-brand-mint text-sm">✅ Profil mis à jour !</p>
          )}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={settingsStatus === 'saving'}
              className="bg-brand-mint text-[#0D1117] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-60"
            >
              {settingsStatus === 'saving' ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => setActiveSettingsTab('main')}
              className="px-8 py-3 rounded-xl border border-[var(--border-color)] text-brand-gray font-bold hover:bg-white/5 transition-all"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* ✅ Mot de passe via Supabase Auth */}
      {activeSettingsTab === 'security' && (
        <form className="space-y-6 max-w-xl" onSubmit={handlePasswordChange}>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">
              {t('dashboard.settings.security.new')}
            </label>
            <div className="relative">
              <input
                type={showNewPwd ? 'text' : 'password'}
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                placeholder="Min. 8 caractères"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-brand-mint transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPwd(!showNewPwd)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gray"
              >
                {showNewPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">
              {t('dashboard.settings.security.confirm')}
            </label>
            <input
              type={showNewPwd ? 'text' : 'password'}
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              placeholder="Confirmez le mot de passe"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
            />
          </div>
          {settingsError && <p className="text-red-400 text-sm">{settingsError}</p>}
          {settingsStatus === 'success' && (
            <p className="text-brand-mint text-sm">✅ Mot de passe mis à jour !</p>
          )}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={settingsStatus === 'saving'}
              className="bg-brand-mint text-[#0D1117] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-60"
            >
              {settingsStatus === 'saving'
                ? 'Mise à jour...'
                : t('dashboard.settings.security.submit')}
            </button>
            <button
              type="button"
              onClick={() => setActiveSettingsTab('main')}
              className="px-8 py-3 rounded-xl border border-[var(--border-color)] text-brand-gray font-bold hover:bg-white/5 transition-all"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {activeSettingsTab === 'notifications' && (
        <div className="space-y-4 max-w-xl">
          {[
            { label: 'Nouvelles missions correspondantes', checked: true },
            { label: 'Mises à jour de mes candidatures', checked: true },
            { label: "Messages de l'agence", checked: true },
            { label: 'Newsletter mensuelle', checked: false },
          ].map((item, i) => (
            <label
              key={i}
              className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-color)] bg-white/5 cursor-pointer hover:border-brand-mint/30 transition-all"
            >
              <span className="text-sm">{item.label}</span>
              <input
                type="checkbox"
                defaultChecked={item.checked}
                className="w-5 h-5 accent-brand-mint"
              />
            </label>
          ))}
          <button
            onClick={() => setActiveSettingsTab('main')}
            className="mt-4 bg-brand-mint text-[#0D1117] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all"
          >
            Enregistrer
          </button>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'projects':
        return renderMissionsList();
      case 'applications':
        return renderApplications();
      case 'saved':
        return renderSaved();
      case 'messages':
        return renderMessages();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />
      <div className="pt-24 flex min-h-screen relative">
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
          )}
        </AnimatePresence>

        <aside
          className={`fixed md:static inset-y-0 left-0 z-50 w-64 border-r border-[var(--border-color)] bg-[var(--bg-primary)] md:bg-transparent transform transition-transform duration-300 ease-in-out p-6 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          <div className="flex justify-between items-center mb-8 md:hidden">
            <div className="text-brand-mint font-bold text-xl">LUCID</div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-brand-gray"
              aria-label="Fermer"
            >
              <X size={24} />
            </button>
          </div>
          <nav className="space-y-2 h-full flex flex-col">
            <div className="flex-grow space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-brand-mint text-[#0D1117]' : 'hover:bg-white/5 text-brand-gray'}`}
                >
                  {item.icon}
                  <span className="font-bold">{item.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all mt-auto"
            >
              <LogOut size={20} />
              <span className="font-bold">{t('dashboard.nav.logout')}</span>
            </button>
          </nav>
        </aside>

        <main className="flex-grow p-4 md:p-8 w-full overflow-x-hidden">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg bg-white/5 border border-[var(--border-color)] text-brand-mint"
                aria-label="Menu"
              >
                <LayoutDashboard size={20} />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1">
                  {t('dashboard.welcome').replace('{{name}}', profile?.first_name ?? '')}
                </h1>
                <p className="text-brand-gray text-sm">{t('dashboard.welcome.sub')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 ml-auto sm:ml-0">
              <div className="w-10 h-10 rounded-full bg-brand-mint flex items-center justify-center text-[#0D1117] font-bold">
                {initials}
              </div>
            </div>
          </header>
          {renderContent()}
        </main>
      </div>

      {/* Modal mission */}
      <AnimatePresence>
        {selectedMission && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMission(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-mint/10 flex items-center justify-center text-brand-mint font-bold text-xl">
                      {selectedMission.company.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{selectedMission.title}</h2>
                      <p className="text-brand-mint font-medium">{selectedMission.company}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMission(null)}
                    className="p-2 rounded-full hover:bg-white/5 text-brand-gray"
                    aria-label="Fermer"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    {
                      icon: <Calendar size={14} />,
                      label: 'Durée',
                      value: selectedMission.duration,
                    },
                    {
                      icon: <DollarSign size={14} />,
                      label: 'Budget',
                      value: selectedMission.budget,
                    },
                    { icon: <MapPin size={14} />, label: 'Lieu', value: 'Remote' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)]"
                    >
                      <div className="flex items-center gap-2 text-brand-gray text-xs mb-1">
                        {item.icon} {item.label}
                      </div>
                      <div className="font-bold text-sm">{item.value}</div>
                    </div>
                  ))}
                </div>
                <p className="text-brand-gray leading-relaxed mb-8">
                  {selectedMission.description}
                </p>
                <div className="flex gap-4">
                  {appliedMissions.includes(selectedMission.id) ? (
                    <div className="flex-grow bg-brand-mint/10 text-brand-mint py-4 rounded-xl font-bold text-center border border-brand-mint/20">
                      Candidature envoyée
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApply(selectedMission.id)}
                      className="flex-grow bg-brand-mint text-[#0D1117] py-4 rounded-xl font-bold hover:scale-[1.02] transition-all"
                    >
                      Postuler à cette mission
                    </button>
                  )}
                  <button
                    onClick={() => handleSave(selectedMission.id)}
                    className={`px-6 py-4 rounded-xl border transition-all ${savedMissions.includes(selectedMission.id) ? 'bg-brand-mint text-[#0D1117] border-brand-mint' : 'border-[var(--border-color)] hover:bg-white/5 text-brand-gray'}`}
                  >
                    {savedMissions.includes(selectedMission.id) ? 'Enregistré' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
