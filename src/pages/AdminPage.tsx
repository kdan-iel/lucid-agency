import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Briefcase,
  MessageSquare,
  Settings,
  LogOut,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  X,
  Mail,
  Phone,
  Globe,
  DollarSign,
  ChevronRight,
  Shield,
  Database,
  Eye,
  EyeOff,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { Phone as WhatsAppIcon } from 'lucide-react';
import { validatePassword } from '../utils/security';
import { listAdminTalentRequests, updateAdminTalentStatus } from '../utils/remoteFunctions';

interface TalentRequest {
  id: string;
  name: string;
  specialty: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  email: string;
  phone: string;
  phone_number?: string | null;
  tarif_jour?: number | null;
  onboarding_completed?: boolean | null;
  portfolio: string;
  experience: string;
  user_id: string;
}

interface Project {
  id: number;
  title: string;
  client: string;
  talent: string;
  budget: string;
  status: 'in-progress' | 'completed' | 'on-hold';
  deadline: string;
}

const INITIAL_PROJECTS: Project[] = [
  {
    id: 1,
    title: 'Refonte Site Web',
    client: 'EcoShop',
    talent: 'Amina L.',
    budget: '1 200 €',
    status: 'in-progress',
    deadline: '15/04/2026',
  },
  {
    id: 2,
    title: 'Campagne Social Ads',
    client: 'TechFlow',
    talent: 'Thomas K.',
    budget: '3 000 €',
    status: 'completed',
    deadline: '20/03/2026',
  },
];

export default function AdminPage() {
  const { t } = useLanguage();
  const { logout, profile, updatePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('talents');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    'all'
  );
  const [requests, setRequests] = useState<TalentRequest[]>([]);
  const [loadingTalents, setLoadingTalents] = useState(false);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedTalent, setSelectedTalent] = useState<TalentRequest | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    client: '',
    talent: '',
    budget: '',
    deadline: '',
  });
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'main' | 'agency' | 'security' | 'roles' | 'system'
  >('main');
  const [passwordForm, setPasswordForm] = useState({ new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle'
  );
  const [settingsError, setSettingsError] = useState('');

  // ✅ Charger les talents depuis Supabase
  const loadTalents = async () => {
    setLoadingTalents(true);
    try {
      const data = await listAdminTalentRequests();

      const mapped: TalentRequest[] = data.map((f) => ({
        id: f.id,
        user_id: f.user_id,
        name: `${f.first_name ?? ''} ${f.last_name ?? ''}`.trim() || 'N/A',
        specialty: f.specialty,
        date: new Date(f.created_at).toLocaleDateString('fr-FR'),
        status: f.status,
        email: f.email ?? '',
        phone: f.phone ?? f.phone_number ?? 'N/A',
        phone_number: f.phone_number ?? f.phone ?? null,
        tarif_jour: f.tarif_jour ?? null,
        onboarding_completed:
          f.onboarding_completed ?? Boolean((f.phone_number ?? f.phone) && f.tarif_jour),
        portfolio: f.portfolio_url ?? 'N/A',
        experience: '',
      }));
      setRequests(mapped);
    } catch (err) {
      console.error('Erreur chargement talents:', err);
    } finally {
      setLoadingTalents(false);
    }
  };

  // Charger au montage
  useEffect(() => {
    loadTalents();
  }, []);

  // ✅ Mettre à jour le statut dans Supabase
  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateAdminTalentStatus(id, newStatus);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
      if (selectedTalent?.id === id)
        setSelectedTalent((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    setProjects([{ id: projects.length + 1, ...newProject, status: 'in-progress' }, ...projects]);
    setIsProjectModalOpen(false);
    setNewProject({ title: '', client: '', talent: '', budget: '', deadline: '' });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    if (passwordForm.new !== passwordForm.confirm) {
      setSettingsError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (passwordForm.new.length < 8) {
      setSettingsError('Minimum 8 caractères.');
      return;
    }
    const passwordValidation = validatePassword(passwordForm.new);
    if (!passwordValidation.valid) {
      setSettingsError(`Mot de passe invalide : ${passwordValidation.errors.join(', ')}.`);
      return;
    }
    setSettingsStatus('saving');
    try {
      await updatePassword(passwordForm.new);
      setSettingsStatus('success');
      setPasswordForm({ new: '', confirm: '' });
      setTimeout(() => {
        setSettingsStatus('idle');
        setActiveSettingsTab('main');
      }, 1500);
    } catch (err) {
      setSettingsError((err as Error).message);
      setSettingsStatus('error');
    }
  };

  const filteredRequests = useMemo(
    () =>
      requests.filter((r) => {
        const matchSearch =
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.specialty.toLowerCase().includes(searchQuery.toLowerCase());
        const matchStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [requests, searchQuery, statusFilter]
  );

  const sidebarItems = [
    { id: 'talents', icon: <Users size={20} />, label: t('admin.nav.talents') },
    { id: 'projects', icon: <Briefcase size={20} />, label: t('admin.nav.projects') },
    { id: 'messages', icon: <MessageSquare size={20} />, label: t('admin.nav.messages') },
    { id: 'settings', icon: <Settings size={20} />, label: t('admin.nav.settings') },
  ];

  const stats = [
    {
      id: 'all',
      label: t('admin.stats.activeTalents'),
      value: requests.filter((r) => r.status === 'approved').length.toString(),
      color: 'text-brand-mint',
    },
    {
      id: 'projects',
      label: t('admin.stats.activeProjects'),
      value: projects.filter((p) => p.status === 'in-progress').length.toString(),
      color: 'text-blue-400',
    },
    {
      id: 'pending',
      label: t('admin.stats.pendingRequests'),
      value: requests.filter((r) => r.status === 'pending').length.toString(),
      color: 'text-yellow-400',
    },
  ];

  const initials = profile ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}` : 'A';

  const renderTalents = () => (
    <div className="bg-[var(--bg-surface)] rounded-2xl md:rounded-3xl border border-[var(--border-color)] p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-xl font-bold">{t('admin.talents.title')}</h2>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-mint w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')
            }
            className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-sm text-brand-gray focus:outline-none"
          >
            <option value="all">Tous</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvés</option>
            <option value="rejected">Refusés</option>
          </select>
        </div>
      </div>

      {loadingTalents ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-mint mx-auto" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 text-brand-gray">
          {requests.length === 0 ? 'Aucune candidature reçue pour le moment.' : 'Aucun résultat.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-brand-gray text-sm">
                <th className="pb-4 font-medium">{t('admin.talents.table.talent')}</th>
                <th className="pb-4 font-medium">{t('admin.talents.table.specialty')}</th>
                <th className="pb-4 font-medium">Telephone</th>
                <th className="pb-4 font-medium">Tarif jour</th>
                <th className="pb-4 font-medium">Onboarding</th>
                <th className="pb-4 font-medium">{t('admin.talents.table.date')}</th>
                <th className="pb-4 font-medium">{t('admin.talents.table.status')}</th>
                <th className="pb-4 font-medium text-right">{t('admin.talents.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredRequests.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-white/5 transition-all cursor-pointer"
                  onClick={() => setSelectedTalent(row)}
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-mint/20 flex items-center justify-center text-brand-mint font-bold text-xs">
                        {row.name.charAt(0)}
                      </div>
                      <span className="font-bold">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-brand-gray">{row.specialty}</td>
                  <td className="py-4 text-brand-gray">{row.phone_number || 'N/A'}</td>
                  <td className="py-4 text-brand-gray">
                    {row.tarif_jour ? `${row.tarif_jour} FCFA` : 'N/A'}
                  </td>
                  <td className="py-4 text-brand-gray">
                    {row.onboarding_completed ? '✓' : '✗'}
                  </td>
                  <td className="py-4 text-brand-gray">{row.date}</td>
                  <td className="py-4">
                    {row.status === 'approved' && (
                      <span className="flex items-center gap-1 text-green-400 text-xs font-bold uppercase">
                        <CheckCircle size={14} />
                        {t('admin.status.approved')}
                      </span>
                    )}
                    {row.status === 'pending' && (
                      <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold uppercase">
                        <Clock size={14} />
                        {t('admin.status.pending')}
                      </span>
                    )}
                    {row.status === 'rejected' && (
                      <span className="flex items-center gap-1 text-red-400 text-xs font-bold uppercase">
                        <XCircle size={14} />
                        {t('admin.status.rejected')}
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <button
                      className="p-2 rounded-lg hover:bg-white/10 text-brand-gray"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTalent(row);
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderProjects = () => (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold">{t('admin.nav.projects')}</h2>
        <button
          onClick={() => setIsProjectModalOpen(true)}
          className="bg-brand-mint text-[#0D1117] px-6 py-2 rounded-full font-bold hover:scale-105 transition-all text-sm"
        >
          + {t('admin.nav.projects.new')}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border-color)] text-brand-gray text-sm">
              <th className="pb-4 font-medium">{t('admin.projects.table.project')}</th>
              <th className="pb-4 font-medium">{t('admin.projects.table.client')}</th>
              <th className="pb-4 font-medium">{t('admin.projects.table.talent')}</th>
              <th className="pb-4 font-medium">{t('admin.projects.table.budget')}</th>
              <th className="pb-4 font-medium">{t('admin.projects.table.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-white/5 transition-all">
                <td className="py-4 font-bold">{project.title}</td>
                <td className="py-4 text-brand-gray">{project.client}</td>
                <td className="py-4 text-sm">{project.talent}</td>
                <td className="py-4 text-brand-gray">{project.budget}</td>
                <td className="py-4">
                  <select
                    value={project.status}
                    onChange={(e) =>
                      setProjects(
                        projects.map((p) =>
                          p.id === project.id
                            ? { ...p, status: e.target.value as Project['status'] }
                            : p
                        )
                      )
                    }
                    className={`text-xs font-bold uppercase px-2 py-1 rounded bg-transparent border border-transparent hover:border-[var(--border-color)] focus:outline-none ${project.status === 'completed' ? 'text-green-400' : project.status === 'in-progress' ? 'text-blue-400' : 'text-yellow-400'}`}
                  >
                    <option value="in-progress">{t('admin.projects.status.inprogress')}</option>
                    <option value="completed">{t('admin.projects.status.completed')}</option>
                    <option value="on-hold">{t('admin.projects.status.onhold')}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMessages = () => {
    const approved = requests.filter((r) => r.status === 'approved');
    return (
      <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
        <h2 className="text-2xl font-bold mb-2">Messagerie WhatsApp</h2>
        <p className="text-brand-gray mb-8">Contactez directement vos talents approuvés.</p>
        {approved.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-[var(--border-color)] rounded-3xl text-brand-gray">
            Aucun talent approuvé.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approved.map((f) => (
              <div
                key={f.id}
                className="p-6 rounded-2xl border border-[var(--border-color)] bg-white/5 hover:border-brand-mint/30 transition-all"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-brand-mint/10 flex items-center justify-center text-brand-mint font-bold text-lg">
                    {f.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold">{f.name}</h3>
                    <p className="text-xs text-brand-mint font-medium uppercase">{f.specialty}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-6 text-sm text-brand-gray">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-brand-mint" />
                    {f.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-brand-mint" />
                    <span className="truncate">{f.email}</span>
                  </div>
                </div>
                <a
                  href={`https://wa.me/${f.phone.replace(/[^0-9]/g, '')}?text=Bonjour%20${encodeURIComponent(f.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-brand-mint text-[#0D1117] py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                >
                  <WhatsAppIcon size={18} />
                  Discuter
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">
          {activeSettingsTab === 'main' ? (
            t('admin.nav.settings')
          ) : (
            <button
              onClick={() => setActiveSettingsTab('main')}
              className="flex items-center gap-2 hover:text-brand-mint"
            >
              <ChevronRight className="rotate-180" size={24} />
              {activeSettingsTab === 'security' && 'Sécurité'}
              {activeSettingsTab === 'system' && 'Système'}
            </button>
          )}
        </h2>
      </div>

      {activeSettingsTab === 'main' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              id: 'security',
              label: 'Sécurité',
              desc: 'Mot de passe et authentification.',
              icon: <Shield size={20} />,
            },
            {
              id: 'system',
              label: 'Paramètres Système',
              desc: 'Maintenance et logs.',
              icon: <Database size={20} />,
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveSettingsTab(item.id as 'security' | 'system')}
              className="p-6 rounded-2xl border border-[var(--border-color)] hover:border-brand-mint/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="text-brand-mint">{item.icon}</div>
                <h3 className="font-bold group-hover:text-brand-mint">{item.label}</h3>
              </div>
              <p className="text-sm text-brand-gray">{item.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Sécurité via Supabase */}
      {activeSettingsTab === 'security' && (
        <form className="space-y-6 max-w-xl" onSubmit={handlePasswordChange}>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                placeholder="Min. 8 caractères"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-brand-mint"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gray"
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">Confirmer</label>
            <input
              type={showPwd ? 'text' : 'password'}
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              placeholder="Répétez le mot de passe"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint"
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
              className="bg-brand-mint text-[#0D1117] px-8 py-3 rounded-xl font-bold hover:scale-105 disabled:opacity-60"
            >
              {settingsStatus === 'saving' ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
            <button
              type="button"
              onClick={() => setActiveSettingsTab('main')}
              className="px-8 py-3 rounded-xl border border-[var(--border-color)] text-brand-gray font-bold hover:bg-white/5"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {activeSettingsTab === 'system' && (
        <div className="space-y-8">
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: 'Talents inscrits',
                value: requests.length.toString(),
                color: 'text-brand-mint',
              },
              {
                label: 'Talents approuvés',
                value: requests.filter((r) => r.status === 'approved').length.toString(),
                color: 'text-green-400',
              },
              {
                label: 'En attente',
                value: requests.filter((r) => r.status === 'pending').length.toString(),
                color: 'text-yellow-400',
              },
            ].map((s, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-[var(--border-color)] bg-white/5"
              >
                <p className="text-xs text-brand-gray mb-1">{s.label}</p>
                <p className={`font-bold text-2xl ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setActiveSettingsTab('main')}
            className="px-8 py-3 rounded-xl border border-[var(--border-color)] text-brand-gray font-bold hover:bg-white/5"
          >
            Retour
          </button>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'talents':
        return renderTalents();
      case 'projects':
        return renderProjects();
      case 'messages':
        return renderMessages();
      case 'settings':
        return renderSettings();
      default:
        return renderTalents();
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
          className={`fixed md:static inset-y-0 left-0 z-50 w-64 border-r border-[var(--border-color)] bg-[var(--bg-primary)] md:bg-transparent transform transition-transform duration-300 p-6 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          <div className="flex justify-between items-center mb-8 md:hidden">
            <span className="text-brand-mint font-bold text-xl">LUCID</span>
            <button onClick={() => setIsSidebarOpen(false)}>
              <X size={24} className="text-brand-gray" />
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
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10"
            >
              <LogOut size={20} />
              <span className="font-bold">{t('dashboard.nav.logout')}</span>
            </button>
          </nav>
        </aside>

        <main className="flex-grow p-4 md:p-8 w-full overflow-x-hidden">
          <header className="flex justify-between items-center gap-4 mb-8 md:mb-12">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg bg-white/5 border border-[var(--border-color)] text-brand-mint"
              >
                <Users size={20} />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1">{t('admin.welcome')}</h1>
                <p className="text-brand-gray text-sm">{t('admin.welcome.sub')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-mint flex items-center justify-center text-[#0D1117] font-bold">
                {initials}
              </div>
            </div>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => {
                  if (stat.id === 'pending') {
                    setActiveTab('talents');
                    setStatusFilter('pending');
                  } else if (stat.id === 'all') {
                    setActiveTab('talents');
                    setStatusFilter('all');
                  } else setActiveTab('projects');
                }}
                className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-color)] cursor-pointer hover:border-brand-mint/50 transition-all group"
              >
                <div className="text-brand-gray text-sm font-medium mb-2">{stat.label}</div>
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              </motion.div>
            ))}
          </div>

          {renderContent()}
        </main>
      </div>

      {/* Modal talent */}
      <AnimatePresence>
        {selectedTalent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTalent(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-mint/10 flex items-center justify-center text-brand-mint font-bold text-xl">
                    {selectedTalent.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{selectedTalent.name}</h2>
                    <p className="text-brand-mint font-medium">{selectedTalent.specialty}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTalent(null)}
                  className="p-2 rounded-full hover:bg-white/5 text-brand-gray"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-brand-gray">
                  <Mail size={18} className="text-brand-mint" />
                  <span className="text-sm">{selectedTalent.email}</span>
                </div>
                <div className="flex items-center gap-3 text-brand-gray">
                  <Phone size={18} className="text-brand-mint" />
                  <span className="text-sm">
                    {selectedTalent.phone_number || selectedTalent.phone || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-brand-gray">
                  <DollarSign size={18} className="text-brand-mint" />
                  <span className="text-sm">
                    {selectedTalent.tarif_jour
                      ? `${selectedTalent.tarif_jour} FCFA/jour`
                      : 'N/A'}
                  </span>
                </div>
                {selectedTalent.portfolio !== 'N/A' && (
                  <div className="flex items-center gap-3 text-brand-gray">
                    <Globe size={18} className="text-brand-mint" />
                    <a
                      href={selectedTalent.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline text-brand-mint"
                    >
                      {selectedTalent.portfolio}
                    </a>
                  </div>
                )}
              </div>

              {selectedTalent.status === 'pending' ? (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleUpdateStatus(selectedTalent.id, 'approved')}
                    className="flex-grow bg-green-500 text-white py-4 rounded-xl font-bold hover:bg-green-600 transition-all"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedTalent.id, 'rejected')}
                    className="flex-grow bg-red-500 text-white py-4 rounded-xl font-bold hover:bg-red-600 transition-all"
                  >
                    Refuser
                  </button>
                </div>
              ) : (
                <div
                  className={`p-4 rounded-xl text-center font-bold uppercase ${selectedTalent.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                >
                  {selectedTalent.status === 'approved' ? '✅ Approuvé' : '❌ Refusé'}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal nouveau projet */}
      <AnimatePresence>
        {isProjectModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProjectModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-lg bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Nouveau Projet</h2>
                <button
                  onClick={() => setIsProjectModalOpen(false)}
                  className="text-brand-gray hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCreateProject} className="space-y-4">
                {['title', 'client', 'budget', 'deadline'].map((field) => (
                  <div key={field} className="space-y-1">
                    <label className="text-xs text-brand-gray uppercase font-bold">
                      {field === 'title'
                        ? 'Titre'
                        : field === 'client'
                          ? 'Client'
                          : field === 'budget'
                            ? 'Budget'
                            : 'Deadline'}
                    </label>
                    <input
                      required
                      type="text"
                      value={newProject[field as keyof typeof newProject]}
                      onChange={(e) => setNewProject({ ...newProject, [field]: e.target.value })}
                      placeholder={
                        field === 'budget' ? '1 500 €' : field === 'deadline' ? 'JJ/MM/AAAA' : ''
                      }
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint"
                    />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-xs text-brand-gray uppercase font-bold">
                    Talent assigné
                  </label>
                  <select
                    required
                    value={newProject.talent}
                    onChange={(e) => setNewProject({ ...newProject, talent: e.target.value })}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint"
                  >
                    <option value="">Sélectionner un talent</option>
                    {requests
                      .filter((r) => r.status === 'approved')
                      .map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name} ({r.specialty})
                        </option>
                      ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-brand-mint text-[#0D1117] py-4 rounded-xl font-bold hover:scale-[1.02] mt-4"
                >
                  Créer le projet
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
