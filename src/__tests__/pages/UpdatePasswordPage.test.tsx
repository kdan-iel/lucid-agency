import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../context/LanguageContext';
import UpdatePasswordPage from '../../pages/UpdatePasswordPage';

const mockUseAuth = vi.fn();
const updatePasswordMock = vi.fn();
const clearErrorMock = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../components/Navbar', () => ({
  default: () => <div>Navbar</div>,
}));

vi.mock('../../components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

describe('UpdatePasswordPage', () => {
  const getSubmitButton = () =>
    screen.getByText(/r.initialiser le mot de passe/i, { selector: 'button[type="submit"]' });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      session: { user: { id: 'user-1' } },
      loading: false,
      updatePassword: updatePasswordMock,
      clearError: clearErrorMock,
    });
    updatePasswordMock.mockResolvedValue(undefined);
  });

  const renderPage = () =>
    render(
      <LanguageProvider>
        <UpdatePasswordPage />
      </LanguageProvider>
    );

  it('affiche un loader pendant l initialisation auth', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      loading: true,
      updatePassword: updatePasswordMock,
      clearError: clearErrorMock,
    });

    renderPage();

    expect(screen.getByText(/lien/i)).toBeInTheDocument();
  });

  it('affiche un message d erreur si la session est absente apres chargement', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      loading: false,
      updatePassword: updatePasswordMock,
      clearError: clearErrorMock,
    });

    renderPage();

    expect(screen.getByText(/Lien invalide/i)).toBeInTheDocument();
  });

  it('autorise le formulaire quand la session existe', async () => {
    renderPage();

    await waitFor(() => {
      expect(getSubmitButton()).toBeInTheDocument();
    });
  });

  it('applique les memes regles de validation que JoinPage', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/^Mot de passe \*/i), {
      target: { name: 'password', value: 'weak' },
    });
    fireEvent.change(screen.getByLabelText(/confirmer/i), {
      target: { name: 'confirmPassword', value: 'weak' },
    });
    fireEvent.click(getSubmitButton());

    expect(await screen.findByText(/Minimum 8/i)).toBeInTheDocument();
    expect(updatePasswordMock).not.toHaveBeenCalled();
  });

  it('met a jour le mot de passe via AuthContext et affiche le succes', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/^Mot de passe \*/i), {
      target: { name: 'password', value: 'Secure1!Pass' },
    });
    fireEvent.change(screen.getByLabelText(/confirmer/i), {
      target: { name: 'confirmPassword', value: 'Secure1!Pass' },
    });
    fireEvent.click(getSubmitButton());

    await waitFor(() => {
      expect(clearErrorMock).toHaveBeenCalled();
      expect(updatePasswordMock).toHaveBeenCalledWith('Secure1!Pass');
    });

    expect(await screen.findByText(/Mot de passe mis/i)).toBeInTheDocument();
  });

  it('affiche une erreur claire si la mise a jour echoue', async () => {
    updatePasswordMock.mockRejectedValue(new Error('Auth session missing'));

    renderPage();

    fireEvent.change(screen.getByLabelText(/^Mot de passe \*/i), {
      target: { name: 'password', value: 'Secure1!Pass' },
    });
    fireEvent.change(screen.getByLabelText(/confirmer/i), {
      target: { name: 'confirmPassword', value: 'Secure1!Pass' },
    });
    fireEvent.click(getSubmitButton());

    expect(await screen.findByText(/session de r/i)).toBeInTheDocument();
  });
});
