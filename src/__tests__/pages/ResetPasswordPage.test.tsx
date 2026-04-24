import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../context/LanguageContext';
import ResetPasswordPage from '../../pages/ResetPasswordPage';

const updateUserMock = vi.fn();
const signOutMock = vi.fn();
const getSessionMock = vi.fn();
const onAuthStateChangeMock = vi.fn();

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      updateUser: (...args: unknown[]) => updateUserMock(...args),
      signOut: (...args: unknown[]) => signOutMock(...args),
      getSession: (...args: unknown[]) => getSessionMock(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChangeMock(...args),
    },
  },
}));

vi.mock('../../components/Navbar', () => ({
  default: () => <div>Navbar</div>,
}));

vi.mock('../../components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    window.history.replaceState(
      {},
      '',
      '/reset-password#access_token=token&refresh_token=refresh&type=recovery'
    );

    updateUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    signOutMock.mockResolvedValue({ error: null });
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });
    onAuthStateChangeMock.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderPage = () =>
    render(
      <LanguageProvider>
        <ResetPasswordPage />
      </LanguageProvider>
    );

  it('autorise le formulaire quand Supabase a déjà établi une session recovery', async () => {
    renderPage();

    expect(
      await screen.findByRole('button', { name: 'Réinitialiser le mot de passe' })
    ).toBeInTheDocument();
    expect(getSessionMock).toHaveBeenCalled();
  });

  it('applique les mêmes règles de validation que JoinPage', async () => {
    renderPage();

    await screen.findByRole('button', { name: 'Réinitialiser le mot de passe' });

    fireEvent.change(screen.getByLabelText(/^Mot de passe \*/i), {
      target: { name: 'password', value: 'weak' },
    });
    fireEvent.change(screen.getByLabelText(/confirmer/i), {
      target: { name: 'confirmPassword', value: 'weak' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser le mot de passe' }));

    expect(await screen.findByText('Minimum 8 caractères')).toBeInTheDocument();
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it('met à jour le mot de passe via updateUser puis redirige vers /login', async () => {
    renderPage();

    await screen.findByRole('button', { name: 'Réinitialiser le mot de passe' });

    fireEvent.change(screen.getByLabelText(/^Mot de passe \*/i), {
      target: { name: 'password', value: 'Secure1!Pass' },
    });
    fireEvent.change(screen.getByLabelText(/confirmer/i), {
      target: { name: 'confirmPassword', value: 'Secure1!Pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser le mot de passe' }));

    await waitFor(() => {
      expect(updateUserMock).toHaveBeenCalledWith({ password: 'Secure1!Pass' });
    });

    await waitFor(() => {
      expect(screen.getByText('Mot de passe mis à jour')).toBeInTheDocument();
    });

    await new Promise((resolve) => setTimeout(resolve, 2100));

    expect(signOutMock).toHaveBeenCalled();
    expect(window.location.pathname).toBe('/login');
  }, 10000);

  it('affiche une erreur si la session recovery est absente', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });

    renderPage();

    await new Promise((resolve) => setTimeout(resolve, 1600));

    await waitFor(() => {
      expect(screen.getByText('Lien invalide ou expiré')).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        'La session de réinitialisation est absente. Veuillez redemander un nouveau lien.'
      )
    ).toBeInTheDocument();
  }, 10000);

  it('refuse l’accès si la page n’est pas ouverte via un lien recovery Supabase', async () => {
    window.history.replaceState({}, '', '/reset-password');

    renderPage();

    expect(await screen.findByText('Lien invalide ou expiré')).toBeInTheDocument();
    expect(
      screen.getByText('Ce lien de réinitialisation est invalide, incomplet ou expiré.')
    ).toBeInTheDocument();
  });
});
