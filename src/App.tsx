import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useEffect, useState } from 'react';

// Pages & composants
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

// ============================================================
// LANDING PAGE
// ============================================================
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
    </div>
  );
}

// ============================================================
// CONTENU PRINCIPAL — ROUTING
// ============================================================
function AppContent() {
  const [path, setPath] = useState(window.location.pathname);

  // On n'utilise plus isAuthenticated/userRole du localStorage
  // La vérification se fait dans ProtectedRoute via session Supabase
  const { loading } = useAuth();

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);

    // Scroll vers l'ancre au chargement
    if (window.location.hash) {
      setTimeout(() => {
        const element = document.querySelector(window.location.hash);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }

    // Interception des liens internes
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href.startsWith(window.location.origin)) {
        const url = new URL(anchor.href);
        const internalPaths = ['/join', '/dashboard', '/admin', '/'];

        if (internalPaths.includes(url.pathname)) {
          if (url.pathname === window.location.pathname && url.hash) {
            return;
          }
          e.preventDefault();
          window.history.pushState({}, '', url.pathname + url.hash);
          setPath(url.pathname);

          if (!url.hash) {
            window.scrollTo(0, 0);
          } else {
            const element = document.querySelector(url.hash);
            if (element) element.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      document.removeEventListener('click', handleClick);
    };
  }, [path]);

  // ✅ Spinner global pendant l'initialisation de la session Supabase
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-mint" />
      </div>
    );
  }

  const renderContent = () => {
    switch (path) {
      case '/join':
        // Page publique, pas de protection
        return <JoinPage />;

      case '/dashboard':
        // ✅ Vérification JWT Supabase via ProtectedRoute
        // Plus de localStorage, plus de bypass possible
        return (
          <ProtectedRoute requiredRole="freelancer">
            <DashboardPage />
          </ProtectedRoute>
        );

      case '/admin':
        // ✅ Vérification JWT Supabase via ProtectedRoute
        return (
          <ProtectedRoute requiredRole="admin">
            <AdminPage />
          </ProtectedRoute>
        );

      default:
        return <LandingPage />;
    }
  };

  return (
    <ThemeProvider>
      <LanguageProvider>{renderContent()}</LanguageProvider>
    </ThemeProvider>
  );
}

// ============================================================
// APP ROOT
// ============================================================
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
