import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { LanguageProvider } from '../../context/LanguageContext';

// ✅ Un seul vi.mock — le mockUseAuth est redéfini dans chaque test
const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

describe('ProtectedRoute', () => {
  const renderWithLanguage = (ui: ReactNode) => render(<LanguageProvider>{ui}</LanguageProvider>);
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
  });

  it('affiche un spinner pendant le chargement', () => {
    mockUseAuth.mockReturnValue({ session: null, profile: null, loading: true });
    renderWithLanguage(
      <ProtectedRoute requiredRole="freelancer">
        <div>Contenu protégé</div>
      </ProtectedRoute>
    );
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });

  it('redirige si pas de session', () => {
    mockUseAuth.mockReturnValue({ session: null, profile: null, loading: false });
    renderWithLanguage(
      <ProtectedRoute requiredRole="freelancer">
        <div>Contenu protégé</div>
      </ProtectedRoute>
    );
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });

  it('affiche l’état de redirection si le role est invalide', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '123' } },
      profile: { role: 'freelancer', user_id: '123' },
      loading: false,
    });

    renderWithLanguage(
      <ProtectedRoute requiredRole="admin">
        <div>Contenu admin</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Redirection en cours...')).toBeInTheDocument();
  });

  it('redirige si mauvais role', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '123' } },
      profile: { role: 'freelancer', user_id: '123' },
      loading: false,
    });
    renderWithLanguage(
      <ProtectedRoute requiredRole="admin">
        <div>Contenu admin</div>
      </ProtectedRoute>
    );
    expect(screen.queryByText('Contenu admin')).not.toBeInTheDocument();
  });

  it('affiche le contenu si session et bon role', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '123' } },
      profile: { role: 'admin', user_id: '123' },
      loading: false,
    });
    renderWithLanguage(
      <ProtectedRoute requiredRole="admin">
        <div>Contenu admin autorisé</div>
      </ProtectedRoute>
    );
    // ✅ Rendu synchrone — pas besoin de waitFor
    expect(screen.getByText('Contenu admin autorisé')).toBeInTheDocument();
  });

  it('affiche l’état de redirection si le freelancer est introuvable', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '123' } },
      profile: { role: 'freelancer', user_id: '123' },
      freelancer: null,
      loading: false,
    });

    renderWithLanguage(
      <ProtectedRoute requiredRole="freelancer">
        <div>Dashboard freelancer</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Redirection en cours...')).toBeInTheDocument();
  });

  it('affiche l’état de redirection si le freelancer n’est pas validé', () => {
    mockUseAuth.mockReturnValue({
      ...validFreelancerState,
      freelancer: {
        statut: 'pending',
        onboarding_completed: false,
      },
    });

    renderWithLanguage(
      <ProtectedRoute requiredRole="freelancer">
        <div>Dashboard freelancer</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Redirection en cours...')).toBeInTheDocument();
  });

  it('affiche l’état de redirection si le freelancer validé n’a pas fini son onboarding', () => {
    mockUseAuth.mockReturnValue({
      ...validFreelancerState,
      freelancer: {
        statut: 'validated',
        onboarding_completed: false,
      },
    });

    renderWithLanguage(
      <ProtectedRoute requiredRole="freelancer">
        <div>Dashboard freelancer</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Redirection en cours...')).toBeInTheDocument();
  });

  it('autorise le freelancer en onboarding si allowIncompleteFreelancer est actif', () => {
    mockUseAuth.mockReturnValue({
      ...validFreelancerState,
      freelancer: {
        statut: 'validated',
        onboarding_completed: false,
      },
    });

    renderWithLanguage(
      <ProtectedRoute requiredRole="freelancer" allowIncompleteFreelancer>
        <div>Compléter mon profil</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Compléter mon profil')).toBeInTheDocument();
    expect(screen.queryByText('Redirection en cours...')).not.toBeInTheDocument();
  });

  it('affiche l’état de redirection si allowIncompleteFreelancer est actif mais que l’onboarding est déjà terminé', () => {
    mockUseAuth.mockReturnValue(validFreelancerState);

    renderWithLanguage(
      <ProtectedRoute requiredRole="freelancer" allowIncompleteFreelancer>
        <div>Compléter mon profil</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Redirection en cours...')).toBeInTheDocument();
  });

  it('affiche le contenu pour un freelancer validé avec onboarding terminé', () => {
    mockUseAuth.mockReturnValue(validFreelancerState);

    renderWithLanguage(
      <ProtectedRoute requiredRole="freelancer">
        <div>Dashboard freelancer</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Dashboard freelancer')).toBeInTheDocument();
  });
});
