import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'admin' | 'freelancer' | 'client';
  allowIncompleteFreelancer?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRole,
  allowIncompleteFreelancer = false,
}: ProtectedRouteProps) {
  const { session, profile, freelancer, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!session || !profile || profile.role !== requiredRole) {
      window.location.href = '/';
      return;
    }

    if (requiredRole !== 'freelancer') {
      return;
    }

    if (!freelancer) {
      window.location.href = '/login';
      return;
    }

    if (freelancer.statut !== 'validated') {
      window.location.href = '/login';
      return;
    }

    if (allowIncompleteFreelancer) {
      if (freelancer.onboarding_completed) {
        window.location.href = '/dashboard';
      }
      return;
    }

    if (!freelancer.onboarding_completed) {
      window.location.href = '/complete-profile';
    }
  }, [allowIncompleteFreelancer, freelancer, loading, profile, requiredRole, session]);

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

  if (requiredRole === 'freelancer') {
    if (!freelancer || freelancer.statut !== 'validated') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <p className="text-brand-gray text-sm">Redirection en cours...</p>
        </div>
      );
    }

    if (allowIncompleteFreelancer) {
      if (freelancer.onboarding_completed) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
            <p className="text-brand-gray text-sm">Redirection en cours...</p>
          </div>
        );
      }
    } else if (!freelancer.onboarding_completed) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <p className="text-brand-gray text-sm">Redirection en cours...</p>
        </div>
      );
    }
  }

  return <>{children}</>;
}
