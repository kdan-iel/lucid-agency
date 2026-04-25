import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '../../components/ProtectedRoute';

const mockUseAuth = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute', () => {
  const renderRoute = (ui: ReactNode) => render(ui);
  let replaceStateSpy: ReturnType<typeof vi.spyOn>;

  const validFreelancerState = {
    session: { user: { id: '123' } },
    profile: { role: 'freelancer', user_id: '123' },
    freelancer: {
      statut: 'validated',
      onboarding_completed: true,
    },
    loading: false,
  };

  beforeEach(() => {
    mockUseAuth.mockReset();
    replaceStateSpy = vi.spyOn(window.history, 'replaceState');
  });

  it('renders a spinner while loading', () => {
    mockUseAuth.mockReturnValue({ session: null, profile: null, freelancer: null, loading: true });
    renderRoute(
      <ProtectedRoute route="dashboard">
        <div>Contenu protégé</div>
      </ProtectedRoute>
    );
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('redirects to login when there is no session', async () => {
    mockUseAuth.mockReturnValue({ session: null, profile: null, freelancer: null, loading: false });

    renderRoute(
      <ProtectedRoute route="dashboard">
        <div>Contenu protégé</div>
      </ProtectedRoute>
    );

    await waitFor(() => expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/login'));
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });

  it('redirects a freelancer away from the admin route', async () => {
    mockUseAuth.mockReturnValue(validFreelancerState);

    renderRoute(
      <ProtectedRoute route="admin">
        <div>Contenu admin</div>
      </ProtectedRoute>
    );

    await waitFor(() => expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/dashboard'));
    expect(screen.queryByText('Contenu admin')).not.toBeInTheDocument();
  });

  it('renders admin content for admin users', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '123' } },
      profile: { role: 'admin', user_id: '123' },
      freelancer: null,
      loading: false,
    });

    renderRoute(
      <ProtectedRoute route="admin">
        <div>Contenu admin autorisé</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Contenu admin autorisé')).toBeInTheDocument();
  });

  it('allows pending freelancers on the dashboard', () => {
    mockUseAuth.mockReturnValue({
      ...validFreelancerState,
      freelancer: {
        statut: 'pending',
        onboarding_completed: false,
      },
    });

    renderRoute(
      <ProtectedRoute route="dashboard">
        <div>Dashboard freelancer</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Dashboard freelancer')).toBeInTheDocument();
  });

  it('blocks rejected freelancers from protected routes', async () => {
    mockUseAuth.mockReturnValue({
      ...validFreelancerState,
      freelancer: {
        statut: 'rejected',
        onboarding_completed: false,
      },
    });

    renderRoute(
      <ProtectedRoute route="dashboard">
        <div>Dashboard freelancer</div>
      </ProtectedRoute>
    );

    await waitFor(() => expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/login'));
    expect(screen.queryByText('Dashboard freelancer')).not.toBeInTheDocument();
  });

  it('allows incomplete freelancers on the complete-profile route', () => {
    mockUseAuth.mockReturnValue({
      ...validFreelancerState,
      freelancer: {
        statut: 'pending',
        onboarding_completed: false,
      },
    });

    renderRoute(
      <ProtectedRoute route="complete-profile">
        <div>Compléter mon profil</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Compléter mon profil')).toBeInTheDocument();
  });

  it('redirects completed freelancers away from the complete-profile route', async () => {
    mockUseAuth.mockReturnValue(validFreelancerState);

    renderRoute(
      <ProtectedRoute route="complete-profile">
        <div>Compléter mon profil</div>
      </ProtectedRoute>
    );

    await waitFor(() => expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/dashboard'));
    expect(screen.queryByText('Compléter mon profil')).not.toBeInTheDocument();
  });
});
