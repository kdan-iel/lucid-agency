import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
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
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect, useState } from 'react';

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

function AppContent() {
  const [path, setPath] = useState(window.location.pathname);
  const { isAuthenticated, userRole } = useAuth();

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    
    // Handle initial hash on load
    if (window.location.hash) {
      setTimeout(() => {
        const element = document.querySelector(window.location.hash);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
    
    // Intercept internal links
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href.startsWith(window.location.origin)) {
        const url = new URL(anchor.href);
        const internalPaths = ['/join', '/dashboard', '/admin', '/'];
        
        if (internalPaths.includes(url.pathname)) {
          // If it's an anchor on the same page, let the browser handle it (or handle smooth scroll)
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
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
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

  const renderContent = () => {
    switch (path) {
      case '/join':
        return <JoinPage />;
      case '/dashboard':
        if (isAuthenticated && userRole === 'freelancer') {
          return <DashboardPage />;
        }
        return <LoginPage role="freelancer" />;
      case '/admin':
        if (isAuthenticated && userRole === 'admin') {
          return <AdminPage />;
        }
        return <LoginPage role="admin" />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        {renderContent()}
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
