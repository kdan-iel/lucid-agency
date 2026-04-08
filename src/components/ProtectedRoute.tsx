import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'admin' | 'freelancer' | 'client';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();

  // ✅ Pendant le chargement de la session Supabase, on attend
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-mint" />
      </div>
    );
  }

  // ✅ Pas de session JWT valide → redirect login
  if (!session || !profile) {
    window.location.href = '/';
    return null;
  }

  // ✅ Mauvais rôle → redirect accueil
  if (profile.role !== requiredRole) {
    window.location.href = '/';
    return null;
  }

  // ✅ Session valide + bon rôle → on affiche la page
  return <>{children}</>;
}
