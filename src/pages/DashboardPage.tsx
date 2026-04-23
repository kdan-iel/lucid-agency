import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Settings,
  LogOut,
  CheckCircle,
  ChevronRight,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { validatePassword } from '../utils/security';
import { Phone as WhatsAppIcon } from 'lucide-react';
import { useTimeoutRegistry } from '../hooks/useTimeoutRegistry';
import { toErrorMessage } from '../utils/asyncTools';

function splitFullName(fullName: string | null | undefined) {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

type SettingsTab = 'main' | 'profile' | 'security' | 'notifications';

export default function DashboardPage() {
  const { t } = useLanguage();
  const { logout, profile, freelancer, updateProfile, updateFreelancer, updatePassword } =
    useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: splitFullName(profile?.full_name).firstName,
    last_name: splitFullName(profile?.full_name).lastName,
    bio: freelancer?.bio ?? '',
    phone: freelancer?.phone_number ?? '',
    portfolio_url: freelancer?.portfolio_url ?? '',
  });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('main');
  const [settingsStatus, setSettingsStatus] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle'
  );
  const [settingsError, setSettingsError] = useState('');
  const { clearAll, schedule } = useTimeoutRegistry();

  useEffect(() => {
    if (profile?.role === 'freelancer' && freelancer && !freelancer.onboarding_completed) {
      window.location.href = '/complete-profile';
    }
  }, [freelancer, profile?.role]);

  useEffect(() => {
    setProfileForm({
      first_name: splitFullName(profile?.full_name).firstName,
      last_name: splitFullName(profile?.full_name).lastName,
      bio: freelancer?.bio ?? '',
      phone: freelancer?.phone_number ?? '',
      portfolio_url: freelancer?.portfolio_url ?? '',
    });
  }, [freelancer?.bio, freelancer?.phone_number, freelancer?.portfolio_url, profile?.full_name]);

  const availableMissionsCount = 0;
  const acceptedMissionsCount = 0;
  const completedMissionsCount = 0;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAll();
    setSettingsStatus('saving');
    setSettingsError('');

    try {
      const fullName = `${profileForm.first_name.trim()} ${profileForm.last_name.trim()}`.trim();

      await updateProfile({
        full_name: fullName || null,
      });

      if (profile?.role === 'freelancer' && freelancer) {
        await updateFreelancer({
          bio: profileForm.bio.trim() || null,
          phone_number: profileForm.phone.trim() || null,
          portfolio_url: profileForm.portfolio_url.trim() || null,
        });
      }

      setSettingsStatus('success');
      schedule(() => {
        setSettingsStatus('idle');
        setActiveSettingsTab('main');
      }, 1500);
    } catch (err) {
      const message = toErrorMessage(err, t('dashboard.settings.profile.error'));
      console.error('[DashboardPage] profile save failure', { message });
      setSettingsError(message);
      setSettingsStatus('error');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAll();
    setSettingsError('');

    if (passwordForm.new !== passwordForm.confirm) {
      setSettingsError(t('dashboard.settings.security.errorMismatch'));
      return;
    }

    const passwordValidation = validatePassword(passwordForm.new);
    if (!passwordValidation.valid) {
      setSettingsError(
        t('dashboard.settings.security.errorInvalid').replace(
          '{{errors}}',
          passwordValidation.errors.join(', ')
        )
      );
      return;
    }

    setSettingsStatus('saving');

    try {
      await updatePassword(passwordForm.new);
      setSettingsStatus('success');
      setPasswordForm({ current: '', new: '', confirm: '' });
      schedule(() => {
        setSettingsStatus('idle');
        setActiveSettingsTab('main');
      }, 1500);
    } catch (err) {
      const message = toErrorMessage(err, t('dashboard.settings.security.error'));
      console.error('[DashboardPage] password update failure', { message });
      setSettingsError(message);
      setSettingsStatus('error');
    }
  };

  const sidebarItems = [
    { id: 'overview', icon: <LayoutDashboard size={20} />, label: t('dashboard.nav.overview') },
    { id: 'projects', icon: <Briefcase size={20} />, label: t('dashboard.nav.missions') },
    { id: 'applications', icon: <CheckCircle size={20} />, label: t('dashboard.nav.history') },
    { id: 'messages', icon: <MessageSquare size={20} />, label: t('dashboard.nav.messages') },
    { id: 'settings', icon: <Settings size={20} />, label: t('dashboard.nav.settings') },
  ];

  const stats = [
    {
      id: 'projects',
      label: t('dashboard.stats.available'),
      value: availableMissionsCount.toString(),
      color: 'text-brand-mint',
    },
    {
      id: 'applications',
      label: t('dashboard.stats.accepted'),
      value: acceptedMissionsCount.toString(),
      color: 'text-blue-400',
    },
    {
      id: 'applications',
      label: t('dashboard.stats.completed'),
      value: completedMissionsCount.toString(),
      color: 'text-yellow-400',
    },
  ];

  const displayName = profile?.full_name?.trim() || t('dashboard.profile.fallbackName');
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'F';

  const renderEmptyState = (
    title: string,
    description: string,
    action?: { label: string; onClick: () => void }
  ) => (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
      <div className="text-center py-16 border border-dashed border-[var(--border-color)] rounded-2xl">
        <h2 className="text-2xl font-bold mb-3">{title}</h2>
        <p className="text-brand-gray max-w-xl mx-auto">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-8 bg-brand-mint text-[#0D1117] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );

  const renderMissionsList = () =>
    renderEmptyState(t('dashboard.missions.emptyTitle'), t('dashboard.missions.emptyBody'));

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
        {stats.map((stat, index) => (
          <motion.div
            key={`${stat.id}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setActiveTab(stat.id)}
            className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-color)] cursor-pointer hover:border-brand-mint/50 transition-all group"
          >
            <div className="text-brand-gray text-sm font-medium mb-2">{stat.label}</div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="mt-4 text-xs text-brand-gray opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              {t('dashboard.overview.details')}
              <span className="text-brand-mint">→</span>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">{renderMissionsList()}</div>
        <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
          <h2 className="text-xl font-bold mb-4">{t('dashboard.overview.summaryTitle')}</h2>
          <p className="text-brand-gray leading-relaxed">{t('dashboard.overview.summaryBody')}</p>
        </div>
      </div>
    </>
  );

  const renderMissionHistory = () =>
    renderEmptyState(t('dashboard.history.emptyTitle'), t('dashboard.history.emptyBody'), {
      label: t('dashboard.history.action'),
      onClick: () => setActiveTab('projects'),
    });

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
                desc: t('dashboard.settings.card.profileDesc'),
              },
              {
                id: 'notifications',
                label: t('dashboard.settings.notifications'),
                desc: t('dashboard.settings.card.notificationsDesc'),
              },
              {
                id: 'security',
                label: t('dashboard.settings.security'),
                desc: t('dashboard.settings.card.securityDesc'),
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

      {activeSettingsTab === 'profile' && (
        <form className="space-y-6 max-w-xl" onSubmit={handleSaveProfile}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-brand-gray">
                {t('dashboard.settings.profile.firstName')}
              </label>
              <input
                type="text"
                value={profileForm.first_name}
                onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-brand-gray">
                {t('dashboard.settings.profile.lastName')}
              </label>
              <input
                type="text"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">
              {t('dashboard.settings.profile.phone')}
            </label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder={t('dashboard.settings.profile.phonePlaceholder')}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">
              {t('dashboard.settings.profile.portfolio')}
            </label>
            <input
              type="url"
              value={profileForm.portfolio_url}
              onChange={(e) => setProfileForm({ ...profileForm, portfolio_url: e.target.value })}
              placeholder={t('dashboard.settings.profile.portfolioPlaceholder')}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">{t('dashboard.settings.profile.bio')}</label>
            <textarea
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              rows={4}
              placeholder={t('dashboard.settings.profile.bioPlaceholder')}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all resize-none"
            />
          </div>
          {settingsError && <p className="text-red-400 text-sm">{settingsError}</p>}
          {settingsStatus === 'success' && (
            <p className="text-brand-mint text-sm">{t('dashboard.settings.profile.success')}</p>
          )}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={settingsStatus === 'saving'}
              className="bg-brand-mint text-[#0D1117] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-60"
            >
              {settingsStatus === 'saving'
                ? t('dashboard.settings.profile.saving')
                : t('dashboard.settings.profile.save')}
            </button>
            <button
              type="button"
              onClick={() => setActiveSettingsTab('main')}
              className="px-8 py-3 rounded-xl border border-[var(--border-color)] text-brand-gray font-bold hover:bg-white/5 transition-all"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

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
                placeholder={t('dashboard.settings.security.placeholder')}
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
              placeholder={t('dashboard.settings.security.confirmPlaceholder')}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
            />
          </div>
          {settingsError && <p className="text-red-400 text-sm">{settingsError}</p>}
          {settingsStatus === 'success' && (
            <p className="text-brand-mint text-sm">{t('dashboard.settings.security.success')}</p>
          )}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={settingsStatus === 'saving'}
              className="bg-brand-mint text-[#0D1117] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-60"
            >
              {settingsStatus === 'saving'
                ? t('dashboard.settings.security.saving')
                : t('dashboard.settings.security.submit')}
            </button>
            <button
              type="button"
              onClick={() => setActiveSettingsTab('main')}
              className="px-8 py-3 rounded-xl border border-[var(--border-color)] text-brand-gray font-bold hover:bg-white/5 transition-all"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      {activeSettingsTab === 'notifications' && (
        <div className="space-y-4 max-w-xl">
          {[
            'dashboard.settings.notifications.missions',
            'dashboard.settings.notifications.history',
            'dashboard.settings.notifications.messages',
            'dashboard.settings.notifications.newsletter',
          ].map((translationKey, index) => (
            <label
              key={translationKey}
              className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-color)] bg-white/5 cursor-pointer hover:border-brand-mint/30 transition-all"
            >
              <span className="text-sm">{t(translationKey)}</span>
              <input
                type="checkbox"
                defaultChecked={index < 3}
                className="w-5 h-5 accent-brand-mint"
              />
            </label>
          ))}
          <button
            onClick={() => setActiveSettingsTab('main')}
            className="mt-4 bg-brand-mint text-[#0D1117] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all"
          >
            {t('dashboard.settings.notifications.save')}
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
        return renderMissionHistory();
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
              aria-label={t('common.close')}
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
              onClick={() => {
                void logout().catch((error) => {
                  console.error('[DashboardPage] logout failure', {
                    message: toErrorMessage(error),
                  });
                });
              }}
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
                aria-label={t('common.menu')}
              >
                <LayoutDashboard size={20} />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1">
                  {t('dashboard.welcome').replace(
                    '{{name}}',
                    splitFullName(profile?.full_name).firstName ||
                      t('dashboard.profile.fallbackName')
                  )};
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
    </div>
  );
}
