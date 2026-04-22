import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'admin' | 'freelancer' | 'client';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!session || !profile || profile.role !== requiredRole) {
      window.location.href = '/';
    }
  }, [loading, profile, requiredRole, session]);

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

  if (!session || !profile || profile.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-brand-gray text-sm">Redirection en cours...</p>
      </div>
    );
  }

  return <>{children}</>;
}
