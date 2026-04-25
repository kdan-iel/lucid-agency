import React from 'react';
import { useAuth } from '../context/AuthContext';
import { resolveAccessDecision, type ProtectedAppRoute } from '../utils/accessControl';
import { Navigate } from './Navigate';

interface ProtectedRouteProps {
  children: React.ReactNode;
  route: ProtectedAppRoute;
}

export function ProtectedRoute({ children, route }: ProtectedRouteProps) {
  const { session, profile, freelancer, loading } = useAuth();
  const decision = resolveAccessDecision({
    session,
    profile,
    freelancer,
    route,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-mint" />
          <p className="text-brand-gray text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!decision.allowed) {
    return <Navigate to={decision.redirectTo ?? '/login'} replace />;
  }

  return <>{children}</>;
}
