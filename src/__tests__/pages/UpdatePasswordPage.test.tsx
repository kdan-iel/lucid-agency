import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../context/LanguageContext';
import UpdatePasswordPage from '../../pages/UpdatePasswordPage';

const updateUserMock = vi.fn();
const signOutMock = vi.fn();
const getSessionMock = vi.fn();
const onAuthStateChangeMock = vi.fn();
let authStateChangeHandler:
  | ((event: string, session: { user: { id: string } } | null) => void)
  | null = null;

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

describe('UpdatePasswordPage', () => {
  const submitButtonName = /^réinitialiser le mot de passe$/i;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    window.history.replaceState({}, '', '/update-password?code=recovery-code');

    updateUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    signOutMock.mockResolvedValue({ error: null });
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });
    onAuthStateChangeMock.mockImplementation((callback) => {
      authStateChangeHandler = callback as typeof authStateChangeHandler;
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    });
  });

  afterEach(() => {
    authStateChangeHandler = null;
    vi.useRealTimers();
  });

  const renderPage = () =>
    render(
      <LanguageProvider>
        <UpdatePasswordPage />
      </LanguageProvider>
    );

  it('autorise le formulaire quand Supabase a deja etabli une session', async () => {
    renderPage();

    expect(await screen.findByRole('button', { name: submitButtonName })).toBeInTheDocument();
    expect(getSessionMock).toHaveBeenCalled();
  });

  it('attend la session Supabase sans afficher un lien invalide trop tot', async () => {
    vi.useFakeTimers();
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });

    renderPage();

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByRole('button', { name: submitButtonName })).not.toBeInTheDocument();
    expect(screen.queryByText(/Lien invalide/i)).not.toBeInTheDocument();

    await act(async () => {
      authStateChangeHandler?.('PASSWORD_RECOVERY', { user: { id: 'user-1' } });
      await Promise.resolve();
    });

    expect(screen.getByRole('button', { name: submitButtonName })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1600);
    });

    expect(screen.queryByText(/Lien invalide/i)).not.toBeInTheDocument();
  });

  it('applique les memes regles de validation que JoinPage', async () => {
    renderPage();

    await screen.findByRole('button', { name: submitButtonName });

    fireEvent.change(screen.getByLabelText(/^Mot de passe \*/i), {
      target: { name: 'password', value: 'weak' },
    });
    fireEvent.change(screen.getByLabelText(/confirmer/i), {
      target: { name: 'confirmPassword', value: 'weak' },
    });
    fireEvent.click(screen.getByRole('button', { name: submitButtonName }));

    expect(await screen.findByText(/Minimum 8/i)).toBeInTheDocument();
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it('met a jour le mot de passe via updateUser puis redirige vers /dashboard', async () => {
    renderPage();

    await screen.findByRole('button', { name: submitButtonName });

    fireEvent.change(screen.getByLabelText(/^Mot de passe \*/i), {
      target: { name: 'password', value: 'Secure1!Pass' },
    });
    fireEvent.change(screen.getByLabelText(/confirmer/i), {
      target: { name: 'confirmPassword', value: 'Secure1!Pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: submitButtonName }));

    await waitFor(() => {
      expect(updateUserMock).toHaveBeenCalledWith({ password: 'Secure1!Pass' });
    });

    await waitFor(() => {
      expect(screen.getByText(/Mot de passe mis/i)).toBeInTheDocument();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2100));
    });

    expect(signOutMock).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe('/dashboard');
  }, 10000);

  it('affiche une erreur si aucune session authentifiee n est disponible', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });

    renderPage();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1600));
    });

    await waitFor(() => {
      expect(screen.getByText(/Lien invalide/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/invalide, incomplet ou expiré/i)).toBeInTheDocument();
  }, 10000);

  it('refuse la mise a jour si la session a expire avant la soumission', async () => {
    getSessionMock
      .mockResolvedValueOnce({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      })
      .mockResolvedValueOnce({ data: { session: null }, error: null });

    renderPage();

    await screen.findByRole('button', { name: submitButtonName });

    fireEvent.change(screen.getByLabelText(/^Mot de passe \*/i), {
      target: { name: 'password', value: 'Secure1!Pass' },
    });
    fireEvent.change(screen.getByLabelText(/confirmer/i), {
      target: { name: 'confirmPassword', value: 'Secure1!Pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: submitButtonName }));

    await waitFor(() => {
      expect(screen.getByText(/Lien invalide/i)).toBeInTheDocument();
    });
    expect(updateUserMock).not.toHaveBeenCalled();
  });
});
