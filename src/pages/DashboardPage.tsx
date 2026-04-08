import { useState, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
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
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  Download,
  ChevronRight,
} from 'lucide-react';
import Navbar from '../components/Navbar';

import { useAuth } from '../context/AuthContext';
import { Phone as WhatsAppIcon } from 'lucide-react';

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
      "Nous recherchons un expert en branding pour refondre complètement l'identité visuelle de notre startup fintech. Le projet inclut la création d'un nouveau logo, d'une charte graphique complète et de supports de communication.",
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
      "Besoin d'une landing page optimisée pour la conversion pour le lancement d'un nouveau produit écologique. Design moderne, épuré et mobile-first requis.",
  },
  {
    id: 3,
    title: 'Série de Vidéos Motion Design pour Réseaux Sociaux',
    category: 'Motion Design',
    duration: '2-3 semaines',
    budget: '3 000 €',
    company: 'TechFlow',
    postedAt: 'Hier',
    description:
      'Création de 5 vidéos en motion design de 15-30 secondes pour une campagne publicitaire sur Instagram et LinkedIn.',
  },
];

interface Contract {
  id: number;
  title: string;
  client: string;
  status: 'active' | 'completed';
  budget: string;
  deadline: string;
}

const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 1,
    title: 'Campagne Social Ads',
    client: 'TechFlow',
    status: 'completed',
    budget: '3 000 €',
    deadline: '20/03/2026',
  },
];

export default function DashboardPage() {
  const { t } = useLanguage();
  const { logout, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [appliedMissions, setAppliedMissions] = useState<number[]>([]);
  const [savedMissions, setSavedMissions] = useState<number[]>([]);
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [notifications, setNotifications] = useState([
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

  const handleApply = (missionId: number) => {
    if (!appliedMissions.includes(missionId)) {
      setAppliedMissions([...appliedMissions, missionId]);
      setSelectedMission(null);
      // Add a notification
      const newNotif = {
        id: Date.now(),
        text: `Candidature envoyée pour la mission #${missionId}`,
        time: "À l'instant",
        read: false,
      };
      setNotifications([newNotif, ...notifications]);
    }
  };

  const handleSave = (missionId: number) => {
    if (savedMissions.includes(missionId)) {
      setSavedMissions(savedMissions.filter((id) => id !== missionId));
    } else {
      setSavedMissions([...savedMissions, missionId]);
    }
  };

  const sidebarItems = [
    { id: 'overview', icon: <LayoutDashboard size={20} />, label: t('dashboard.nav.overview') },
    { id: 'projects', icon: <Briefcase size={20} />, label: t('dashboard.nav.missions') },
    { id: 'contracts', icon: <Calendar size={20} />, label: t('dashboard.nav.contracts') },
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
      id: 'contracts',
      label: 'Contrats Actifs',
      value: contracts.filter((c) => c.status === 'active').length.toString(),
      color: 'text-green-400',
    },
  ];

  const filteredMissions = useMemo(() => {
    return MISSIONS.filter(
      (m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const renderOverview = () => (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => stat.id !== 'revenue' && setActiveTab(stat.id)}
            className={`bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-color)] cursor-pointer hover:border-brand-mint/50 transition-all group`}
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
        {/* Missions Area */}
        <div className="lg:col-span-2 bg-[var(--bg-surface)] rounded-2xl md:rounded-3xl border border-[var(--border-color)] p-4 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h2 className="text-xl font-bold">{t('dashboard.missions.title')}</h2>
            <div className="relative w-full sm:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray"
                size={18}
              />
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

        {/* Notifications / Activity */}
        <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
          <h2 className="text-xl font-bold mb-8">Notifications</h2>
          <div className="space-y-6">
            {notifications.map((notif) => (
              <div key={notif.id} className="flex gap-4 group">
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
          <button className="w-full mt-8 py-3 rounded-xl border border-[var(--border-color)] text-brand-gray text-sm font-bold hover:bg-white/5 transition-all">
            Tout marquer comme lu
          </button>
        </div>
      </div>
    </>
  );

  const renderContracts = () => (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
      <h2 className="text-2xl font-bold mb-8">{t('dashboard.nav.contracts')}</h2>
      <div className="space-y-4">
        {contracts.map((contract) => (
          <div
            key={contract.id}
            className="flex items-center justify-between p-6 rounded-2xl border border-[var(--border-color)] bg-white/5"
          >
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-brand-mint/10 flex items-center justify-center text-brand-mint font-bold">
                {contract.client.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold mb-1">{contract.title}</h3>
                <p className="text-sm text-brand-gray">
                  {contract.client} · Budget: {contract.budget}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  contract.status === 'active'
                    ? 'bg-blue-400/10 text-blue-400 border-blue-400/20'
                    : 'bg-green-400/10 text-green-400 border-green-400/20'
                }`}
              >
                {contract.status === 'active'
                  ? t('admin.projects.status.inprogress')
                  : t('admin.projects.status.completed')}
              </span>
              <button className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-sm font-bold hover:bg-white/5 transition-all">
                Gérer
              </button>
            </div>
          </div>
        ))}
      </div>
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
                  <h3 className="font-bold mb-1 group-hover:text-brand-mint transition-colors">
                    {mission.title}
                  </h3>
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
              <div className="flex items-center gap-4">
                <span className="px-4 py-1 rounded-full bg-yellow-400/10 text-yellow-400 text-xs font-bold uppercase tracking-wider border border-yellow-400/20">
                  {t('admin.status.pending')}
                </span>
                <button
                  onClick={() => setSelectedMission(mission)}
                  className="p-2 rounded-lg hover:bg-white/10 text-brand-gray"
                  title="Voir les détails"
                  aria-label="Voir les détails de la mission"
                >
                  <Search size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-brand-mint/10 rounded-full flex items-center justify-center text-brand-mint mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
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

  const renderMessages = () => (
    <div className="bg-[var(--bg-surface)] rounded-2xl md:rounded-3xl border border-[var(--border-color)] p-8 md:p-12 flex flex-col items-center justify-center text-center min-h-[500px]">
      <div className="w-20 h-20 bg-brand-mint/10 rounded-full flex items-center justify-center text-brand-mint mb-8">
        <WhatsAppIcon size={40} />
      </div>
      <h2 className="text-3xl font-bold mb-4">Contactez l'agence sur WhatsApp</h2>
      <p className="text-brand-gray text-lg max-w-md mb-10">
        Pour toute question concernant vos missions ou votre compte, discutez directement avec notre
        équipe via WhatsApp.
      </p>
      <a
        href="https://wa.me/22890123456"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-brand-mint text-[#0D1117] px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all flex items-center gap-3 shadow-xl shadow-brand-mint/20"
      >
        <WhatsAppIcon size={24} />
        Ouvrir WhatsApp
      </a>
    </div>
  );

  const [profileData, setProfileData] = useState({
    name: 'Thomas K.',
    email: 'thomas.k@example.com',
    bio: 'Designer UI/UX passionné par les produits digitaux innovants.',
    skills: 'Figma, React, Tailwind CSS',
  });
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'main' | 'profile' | 'notifications' | 'security' | 'payments'
  >('main');
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  const handlePasswordChange = (e: FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }
    changePassword(passwordForm.new);
    alert('Mot de passe mis à jour avec succès !');
    setActiveSettingsTab('main');
    setPasswordForm({ current: '', new: '', confirm: '' });
  };

  const renderSettings = () => {
    const renderSettingsMain = () => (
      <div className="space-y-6">
        <div className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-[var(--border-color)]">
          <div className="w-20 h-20 rounded-full bg-brand-mint flex items-center justify-center text-[#0D1117] text-3xl font-bold">
            {profileData.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">{profileData.name}</h3>
            <p className="text-brand-gray">{profileData.email}</p>
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
            {
              id: 'payments',
              label: 'Paiements',
              desc: 'Gérez vos factures et coordonnées bancaires.',
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveSettingsTab(item.id as any)}
              className="p-6 rounded-2xl border border-[var(--border-color)] hover:border-brand-mint/30 transition-all cursor-pointer group"
            >
              <h3 className="font-bold mb-1 group-hover:text-brand-mint transition-colors">
                {item.label}
              </h3>
              <p className="text-sm text-brand-gray">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );

    const renderProfileForm = () => (
      <form
        className="space-y-6 max-w-xl"
        onSubmit={(e) => {
          e.preventDefault();
          setActiveSettingsTab('main');
        }}
      >
        <div className="space-y-2">
          <label className="text-sm text-brand-gray">Nom complet</label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            placeholder="Entrez votre nom complet"
            title="Nom complet"
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-brand-gray">Email</label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            placeholder="Entrez votre adresse email"
            title="Email"
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-brand-gray">Bio</label>
          <textarea
            value={profileData.bio}
            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
            rows={4}
            placeholder="Décrivez-vous"
            title="Bio"
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all resize-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-brand-gray">Compétences (séparées par des virgules)</label>
          <input
            type="text"
            value={profileData.skills}
            onChange={(e) => setProfileData({ ...profileData, skills: e.target.value })}
            placeholder="Ex: Figma, React, Tailwind CSS"
            title="Compétences"
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-brand-mint text-[#0D1117] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all"
          >
            Enregistrer
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
    );

    const renderSecurityForm = () => (
      <form className="space-y-6 max-w-xl" onSubmit={handlePasswordChange}>
        <div className="space-y-2">
          <label className="text-sm text-brand-gray">
            {t('dashboard.settings.security.current')}
          </label>
          <input
            required
            type="password"
            value={passwordForm.current}
            onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
            placeholder={t('dashboard.settings.security.current')}
            title={t('dashboard.settings.security.current')}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-brand-gray">{t('dashboard.settings.security.new')}</label>
          <input
            required
            type="password"
            value={passwordForm.new}
            onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
            placeholder={t('dashboard.settings.security.new')}
            title={t('dashboard.settings.security.new')}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-brand-gray">
            {t('dashboard.settings.security.confirm')}
          </label>
          <input
            required
            type="password"
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
            placeholder={t('dashboard.settings.security.confirm')}
            title={t('dashboard.settings.security.confirm')}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-brand-mint text-[#0D1117] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all"
          >
            {t('dashboard.settings.security.submit')}
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
    );

    const renderNotificationsSettings = () => (
      <div className="space-y-8 max-w-xl">
        <div className="space-y-4">
          <h3 className="font-bold text-lg">Alertes Email</h3>
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
        </div>
        <button
          onClick={() => setActiveSettingsTab('main')}
          className="bg-brand-mint text-[#0D1117] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all"
        >
          Enregistrer les préférences
        </button>
      </div>
    );

    const renderPaymentsSettings = () => (
      <div className="space-y-8 max-w-2xl">
        <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-white/5">
          <h3 className="font-bold mb-4">Méthode de Paiement</h3>
          <div className="flex items-center justify-between p-4 rounded-xl border border-brand-mint/20 bg-brand-mint/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center font-bold text-[10px]">
                VISA
              </div>
              <div>
                <p className="text-sm font-bold">•••• •••• •••• 4242</p>
                <p className="text-xs text-brand-gray">Expire 12/28</p>
              </div>
            </div>
            <button className="text-xs text-brand-mint font-bold hover:underline">Modifier</button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold">Dernières Factures</h3>
          {[
            { id: 'INV-001', date: '15 Mars 2026', amount: '1 200 €', status: 'Payé' },
            { id: 'INV-002', date: '01 Mars 2026', amount: '3 000 €', status: 'Payé' },
          ].map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-color)] hover:bg-white/5 transition-all"
            >
              <div>
                <p className="text-sm font-bold">{inv.id}</p>
                <p className="text-xs text-brand-gray">{inv.date}</p>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm font-bold">{inv.amount}</span>
                <span className="text-xs text-green-400 font-bold uppercase">{inv.status}</span>
                <button
                  className="text-brand-gray hover:text-brand-mint"
                  title="Télécharger la facture"
                  aria-label="Télécharger la facture"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setActiveSettingsTab('main')}
          className="px-8 py-3 rounded-xl border border-[var(--border-color)] text-brand-gray font-bold hover:bg-white/5 transition-all"
        >
          Retour
        </button>
      </div>
    );

    return (
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
                {activeSettingsTab === 'notifications' && t('dashboard.settings.notifications')}
                {activeSettingsTab === 'security' && t('dashboard.settings.security')}
                {activeSettingsTab === 'payments' && 'Paiements'}
              </button>
            )}
          </h2>
        </div>

        {activeSettingsTab === 'main' && renderSettingsMain()}
        {activeSettingsTab === 'profile' && renderProfileForm()}
        {activeSettingsTab === 'security' && renderSecurityForm()}
        {activeSettingsTab === 'notifications' && renderNotificationsSettings()}
        {activeSettingsTab === 'payments' && renderPaymentsSettings()}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
      case 'projects':
        return renderOverview();
      case 'contracts':
        return renderContracts();
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
        {/* Sidebar Overlay for Mobile */}
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

        {/* Sidebar */}
        <aside
          className={`
          fixed md:static inset-y-0 left-0 z-50 w-64 border-r border-[var(--border-color)] bg-[var(--bg-primary)] md:bg-transparent
          transform transition-transform duration-300 ease-in-out p-6
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        >
          <div className="flex justify-between items-center mb-8 md:hidden">
            <div className="text-brand-mint font-bold text-xl">LUCID</div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-brand-gray"
              title="Fermer le menu"
              aria-label="Fermer le menu"
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id
                      ? 'bg-brand-mint text-[#0D1117]'
                      : 'hover:bg-white/5 text-brand-gray'
                  }`}
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

        {/* Main Content */}
        <main className="flex-grow p-4 md:p-8 w-full overflow-x-hidden">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg bg-white/5 border border-[var(--border-color)] text-brand-mint"
                title="Ouvrir le menu"
                aria-label="Ouvrir le menu"
              >
                <LayoutDashboard size={20} />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
                  {t('dashboard.welcome').replace('{{name}}', 'Thomas')}
                </h1>
                <p className="text-brand-gray text-sm md:text-base">{t('dashboard.welcome.sub')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 ml-auto sm:ml-0">
              <button
                className="p-2 rounded-full hover:bg-white/5 text-brand-gray relative"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={24} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-brand-mint rounded-full"></span>
              </button>
              <div className="w-10 h-10 rounded-full bg-brand-mint flex items-center justify-center text-[#0D1117] font-bold">
                T
              </div>
            </div>
          </header>

          {renderContent()}
        </main>
      </div>

      {/* Mission Detail Modal */}
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
                    className="p-2 rounded-full hover:bg-white/5 text-brand-gray transition-colors"
                    title="Fermer"
                    aria-label="Fermer la fenêtre"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)]">
                    <div className="flex items-center gap-2 text-brand-gray text-xs mb-1">
                      <Calendar size={14} /> Durée
                    </div>
                    <div className="font-bold text-sm">{selectedMission.duration}</div>
                  </div>
                  <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)]">
                    <div className="flex items-center gap-2 text-brand-gray text-xs mb-1">
                      <DollarSign size={14} /> Budget
                    </div>
                    <div className="font-bold text-sm">{selectedMission.budget}</div>
                  </div>
                  <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)]">
                    <div className="flex items-center gap-2 text-brand-gray text-xs mb-1">
                      <MapPin size={14} /> Lieu
                    </div>
                    <div className="font-bold text-sm">Remote</div>
                  </div>
                </div>

                <div className="space-y-6 mb-8">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gray mb-3">
                      Description du projet
                    </h4>
                    <p className="text-brand-gray leading-relaxed">{selectedMission.description}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gray mb-3">
                      Compétences requises
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {['UI/UX', 'Figma', 'Prototypage', 'Design System'].map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 rounded-full bg-white/5 border border-[var(--border-color)] text-xs text-brand-gray"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  {appliedMissions.includes(selectedMission.id) ? (
                    <div className="flex-grow bg-brand-mint/10 text-brand-mint py-4 rounded-xl font-bold text-center border border-brand-mint/20">
                      Candidature envoyée
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApply(selectedMission.id)}
                      className="flex-grow bg-brand-mint text-[#0D1117] py-4 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-mint/20"
                    >
                      Postuler à cette mission
                    </button>
                  )}
                  <button
                    onClick={() => handleSave(selectedMission.id)}
                    className={`px-6 py-4 rounded-xl border border-[var(--border-color)] transition-all ${savedMissions.includes(selectedMission.id) ? 'bg-brand-mint text-[#0D1117] border-brand-mint' : 'hover:bg-white/5 text-brand-gray'}`}
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
