import { LanguageProvider } from './context/LanguageContext';
import { useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import BackToTop from './components/BackToTop';
import { useEffect, useState } from 'react';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { useTimeoutRegistry } from './hooks/useTimeoutRegistry';
import { navigate } from './utils/navigation';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Philosophy from './components/Philosophy';
import Method from './components/Method';
import Talents from './components/Talents';
import Results from './components/Results';
import Offers from './components/Offers';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';

import JoinPage from './pages/JoinPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPage from './pages/PrivacyPage';
import LegalPage from './pages/LegalPage';

function LandingPage() {
  return (
    <div className="bg-[var(--bg-primary)] min-h-screen selection:bg-brand-mint selection:text-brand-anthracite transition-colors duration-300">
      <Navbar />
      <main>
        <Hero />
        <Philosophy />
        <Method />
        <Talents />
        <Results />
        <Offers />
        <ContactForm />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}

const ONBOARDING_PATH = '/onboarding';
const LEGACY_COMPLETE_PROFILE_PATH = '/complete-profile';

function OnboardingReminderModal({
  isOpen,
  onComplete,
  onDismiss,
}: {
  isOpen: boolean;
  onComplete: () => void;
  onDismiss: () => void;
}) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-reminder-title"
        className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[var(--bg-surface)] p-8 shadow-2xl"
      >
        <h2
          id="onboarding-reminder-title"
          className="text-2xl font-bold text-[var(--text-primary)]"
        >
          {t('onboardingModal.title')}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-brand-gray">
          {t('onboardingModal.body')}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onComplete}
            className="flex-1 rounded-xl bg-brand-mint px-6 py-4 font-bold text-[#0D1117] transition-transform hover:scale-[1.01]"
          >
            {t('onboardingModal.primary')}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl border border-[var(--border-color)] px-6 py-4 font-medium text-[var(--text-primary)] transition-colors hover:border-brand-mint/50 hover:text-brand-mint"
          >
            {t('onboardingModal.secondary')}
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardOnboardingGuard({ path }: { path: string }) {
  const { loading, session, profile, freelancer } = useAuth();
  const [hasSeenOnboardingModal, setHasSeenOnboardingModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userId = session?.user?.id ?? null;
  const shouldPrompt =
    path === '/dashboard' &&
    !loading &&
    Boolean(userId) &&
    profile?.role === 'freelancer' &&
    freelancer !== null &&
    !freelancer.onboarding_completed;

  useEffect(() => {
    setHasSeenOnboardingModal(false);
    setIsModalOpen(false);
  }, [userId]);

  useEffect(() => {
    if (!shouldPrompt) {
      setIsModalOpen(false);
      return;
    }

    if (!hasSeenOnboardingModal) {
      setIsModalOpen(true);
    }
  }, [hasSeenOnboardingModal, shouldPrompt]);

  const handleDismiss = () => {
    setHasSeenOnboardingModal(true);
    setIsModalOpen(false);
  };

  const handleComplete = () => {
    setHasSeenOnboardingModal(true);
    setIsModalOpen(false);
    navigate(ONBOARDING_PATH, { replace: true });
  };

  return (
    <OnboardingReminderModal
      isOpen={isModalOpen}
      onComplete={handleComplete}
      onDismiss={handleDismiss}
    />
  );
}

const VALID_PATHS = [
  '/',
  '/join',
  '/dashboard',
  '/admin',
  '/admin/login',
  '/login',
  LEGACY_COMPLETE_PROFILE_PATH,
  ONBOARDING_PATH,
  '/update-password',
  '/privacy',
  '/legal',
];

export function AppContent({ initialPath = window.location.pathname }: { initialPath?: string }) {
  const [path, setPath] = useState(initialPath);
  const { loading, session } = useAuth();
  const { schedule, clearAll } = useTimeoutRegistry();

  // ✅ Déconnexion automatique après 30 min d'inactivité
  useSessionTimeout(!!session);

  useEffect(() => {
    const handleLocationChange = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);

    if (window.location.hash) {
      schedule(() => {
        const el = document.querySelector(window.location.hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href.startsWith(window.location.origin)) {
        const url = new URL(anchor.href);
        if (VALID_PATHS.includes(url.pathname)) {
          if (url.pathname === window.location.pathname && url.hash) return;
          e.preventDefault();
          navigate(url.pathname + url.hash);
          setPath(url.pathname);
          if (!url.hash) window.scrollTo(0, 0);
          else {
            const el = document.querySelector(url.hash);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      clearAll();
      window.removeEventListener('popstate', handleLocationChange);
      document.removeEventListener('click', handleClick);
    };
  }, [clearAll, schedule]);

  if (loading && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-mint" />
          <p className="text-brand-gray text-sm">Chargement...</p>
        </div>
      </div>
    );
  }
  const renderContent = () => {
    switch (path) {
      case '/':
        return <LandingPage />;
      case '/join':
        return <JoinPage />;
      case '/login':
        return <LoginPage role="freelancer" />;
      case '/admin/login':
        return <LoginPage role="admin" />;
      case '/update-password':
        return <UpdatePasswordPage />;
      case '/privacy':
        return <PrivacyPage />;
      case '/legal':
        return <LegalPage />;
      case '/dashboard':
        return (
          <ProtectedRoute route="dashboard">
            <DashboardPage />
          </ProtectedRoute>
        );
      case LEGACY_COMPLETE_PROFILE_PATH:
      case ONBOARDING_PATH:
        return (
          <ProtectedRoute route="complete-profile">
            <CompleteProfilePage />
          </ProtectedRoute>
        );
      case '/admin':
        return (
          <ProtectedRoute route="admin">
            <AdminPage />
          </ProtectedRoute>
        );
      default:
        return <NotFoundPage />;
    }
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          {renderContent()}
          <DashboardOnboardingGuard path={path} />
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
