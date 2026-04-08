import React from 'react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'admin' | 'freelancer' | 'client';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-mint" />
          <p className="text-brand-gray text-sm">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  // ✅ Pas de session JWT valide → accueil
  if (!session || !profile) {
    window.location.href = '/';
    return null;
  }

  // ✅ Mauvais rôle → accueil
  if (profile.role !== requiredRole) {
    window.location.href = '/';
    return null;
  }

  return <>{children}</>;
}
