import type { Freelancer, Profile } from '../context/AuthContext';

type SessionLike = {
  user?: {
    id?: string;
  } | null;
} | null;

export type ProtectedAppRoute = 'dashboard' | 'admin' | 'complete-profile';

export interface AccessDecision {
  allowed: boolean;
  redirectTo: string | null;
}

interface ResolveAccessDecisionArgs {
  session: SessionLike;
  profile: Profile | null;
  freelancer: Freelancer | null;
  route: ProtectedAppRoute;
}

type AccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | null;

function resolveAccountStatus(
  profile: Profile | null,
  freelancer: Freelancer | null
): AccountStatus {
  const profileStatus = (profile as (Profile & { status?: AccountStatus }) | null)?.status ?? null;

  if (profileStatus) return profileStatus;

  if (freelancer?.statut === 'validated') return 'approved';
  if (freelancer?.statut === 'pending') return 'pending';
  if (freelancer?.statut === 'rejected') return 'rejected';
  if (freelancer?.statut === 'suspended') return 'suspended';

  return null;
}

export function getDefaultAuthenticatedRoute(
  profile: Profile | null,
  freelancer: Freelancer | null
) {
  if (profile?.role === 'admin') return '/admin';
  if (profile?.role === 'freelancer') {
    if (freelancer?.statut === 'rejected' || freelancer?.statut === 'suspended') {
      return '/login';
    }
    return '/dashboard';
  }
  return '/login';
}

export function resolveAccessDecision({
  session,
  profile,
  freelancer,
  route,
}: ResolveAccessDecisionArgs): AccessDecision {
  if (!session?.user?.id) {
    return { allowed: false, redirectTo: '/login' };
  }

  if (!profile) {
    return { allowed: false, redirectTo: '/login' };
  }

  const accountStatus = resolveAccountStatus(profile, freelancer);

  if (accountStatus === 'rejected' || accountStatus === 'suspended') {
    return { allowed: false, redirectTo: '/login' };
  }

  if (profile.role === 'admin') {
    return route === 'admin'
      ? { allowed: true, redirectTo: null }
      : { allowed: false, redirectTo: '/admin' };
  }

  if (profile.role !== 'freelancer') {
    return { allowed: false, redirectTo: '/login' };
  }

  if (!freelancer) {
    return { allowed: false, redirectTo: '/login' };
  }

  if (route === 'admin') {
    return { allowed: false, redirectTo: '/dashboard' };
  }

  if (route === 'complete-profile') {
    return freelancer.onboarding_completed
      ? { allowed: false, redirectTo: '/dashboard' }
      : { allowed: true, redirectTo: null };
  }

  return { allowed: true, redirectTo: null };
}
