import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'admin' | 'freelancer' | 'client';
  allowIncompleteFreelancer?: boolean;
}

function BlockedState({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <p className="text-brand-gray text-sm">{message}</p>
    </div>
  );
}

export function ProtectedRoute({
  children,
  requiredRole,
  allowIncompleteFreelancer = false,
}: ProtectedRouteProps) {
  const { session, profile, freelancer, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-mint" />
          <p className="text-brand-gray text-sm">{t('common.sessionCheck')}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <BlockedState message={t('common.redirecting')} />;
  }

  if (!profile || profile.role !== requiredRole) {
    return <BlockedState message={t('common.redirecting')} />;
  }

  if (requiredRole !== 'freelancer') {
    return <>{children}</>;
  }

  if (!freelancer || freelancer.statut !== 'validated') {
    return <BlockedState message={t('common.redirecting')} />;
  }

  if (allowIncompleteFreelancer) {
    if (freelancer.onboarding_completed) {
      return <BlockedState message={t('common.redirecting')} />;
    }

    return <>{children}</>;
  }

  if (!freelancer.onboarding_completed) {
    return <BlockedState message={t('common.redirecting')} />;
  }

  return <>{children}</>;
}
