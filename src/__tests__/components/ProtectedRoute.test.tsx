import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '../../components/ProtectedRoute';

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
  it('affiche un spinner pendant le chargement', () => {
    mockUseAuth.mockReturnValue({ session: null, profile: null, loading: true });
    render(
      <ProtectedRoute requiredRole="freelancer">
        <div>Contenu protégé</div>
      </ProtectedRoute>
    );
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });

  it('redirige si pas de session', () => {
    mockUseAuth.mockReturnValue({ session: null, profile: null, loading: false });
    render(
      <ProtectedRoute requiredRole="freelancer">
        <div>Contenu protégé</div>
      </ProtectedRoute>
    );
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });

  it('redirige si mauvais role', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '123' } },
      profile: { role: 'freelancer', user_id: '123' },
      loading: false,
    });
    render(
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
    render(
      <ProtectedRoute requiredRole="admin">
        <div>Contenu admin autorisé</div>
      </ProtectedRoute>
    );
    // ✅ Rendu synchrone — pas besoin de waitFor
    expect(screen.getByText('Contenu admin autorisé')).toBeInTheDocument();
  });
});