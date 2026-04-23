import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import BackToTop from './components/BackToTop';
import { useEffect, useState } from 'react';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { useTimeoutRegistry } from './hooks/useTimeoutRegistry';

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
import ResetPasswordPage from './pages/ResetPasswordPage';
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

const VALID_PATHS = [
  '/',
  '/join',
  '/dashboard',
  '/admin',
  '/admin/login',
  '/login',
  '/complete-profile',
  '/reset-password',
  '/privacy',
  '/legal',
];

function AppContent() {
  const [path, setPath] = useState(window.location.pathname);
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
          window.history.pushState({}, '', url.pathname + url.hash);
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
      case '/reset-password':
        return <ResetPasswordPage />;
      case '/privacy':
        return <PrivacyPage />;
      case '/legal':
        return <LegalPage />;
      case '/dashboard':
        return (
          <ProtectedRoute requiredRole="freelancer">
            <DashboardPage />
          </ProtectedRoute>
        );
      case '/complete-profile':
        return (
          <ProtectedRoute requiredRole="freelancer" allowIncompleteFreelancer>
            <CompleteProfilePage />
          </ProtectedRoute>
        );
      case '/admin':
        return (
          <ProtectedRoute requiredRole="admin">
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
        <ToastProvider>{renderContent()}</ToastProvider>
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
