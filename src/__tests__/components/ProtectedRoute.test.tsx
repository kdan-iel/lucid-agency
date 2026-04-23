import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
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
});
