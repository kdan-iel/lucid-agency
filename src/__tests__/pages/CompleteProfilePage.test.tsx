import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { LanguageProvider } from '../../context/LanguageContext';
import CompleteProfilePage from '../../pages/CompleteProfilePage';

const mockUseAuth = vi.fn();
const completeFreelancerProfileMock = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../utils/remoteFunctions', () => ({
  completeFreelancerProfile: (...args: unknown[]) => completeFreelancerProfileMock(...args),
}));

vi.mock('../../components/Navbar', () => ({
  default: () => <div>Navbar</div>,
}));

vi.mock('../../components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

const mockLocation = {
  href: 'http://localhost:5173/complete-profile',
};

Object.defineProperty(window, 'location', {
  configurable: true,
  value: mockLocation,
});

describe('CompleteProfilePage', () => {
  const phoneLabel = 'Numéro de téléphone *';
  const rateLabel = 'Tarif journalier (FCFA) *';
  const submitLabel = 'Compléter mon profil';

  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = 'http://localhost:5173/complete-profile';
    mockUseAuth.mockReturnValue({
      session: { access_token: 'token-123' },
      profile: {
        id: '1',
        user_id: 'user-1',
        email: 'freelancer@example.com',
        full_name: 'Jean Dupont',
        role: 'freelancer',
        avatar_url: null,
      },
      freelancer: {
        id: 'freelancer-1',
        user_id: 'user-1',
        statut: 'validated',
        phone_number: null,
        tarif_jour: null,
        bio: null,
        specialite: null,
        onboarding_completed: false,
        archived_at: null,
      },
      refreshAuthState: vi.fn().mockResolvedValue(undefined),
      loading: false,
    });
    completeFreelancerProfileMock.mockResolvedValue({ success: true });
  });

  const submitForm = () => {
    const button = screen.getByRole('button', { name: submitLabel });
    const form = button.closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
  };

  const renderWithLanguage = (ui: ReactNode) => render(<LanguageProvider>{ui}</LanguageProvider>);

  it('renders form with phone and tarif fields', () => {
    renderWithLanguage(<CompleteProfilePage />);

    expect(screen.getByLabelText(phoneLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(rateLabel)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: submitLabel })).toBeInTheDocument();
  });

  it('validates phone number format', async () => {
    renderWithLanguage(<CompleteProfilePage />);

    fireEvent.change(screen.getByLabelText(phoneLabel), {
      target: { name: 'phone_number', value: '1234' },
    });
    submitForm();

    expect(await screen.findByText(/format invalide/i)).toBeInTheDocument();
    expect(completeFreelancerProfileMock).not.toHaveBeenCalled();
  });

  it('validates tarif_jour range', async () => {
    renderWithLanguage(<CompleteProfilePage />);

    fireEvent.change(screen.getByLabelText(phoneLabel), {
      target: { name: 'phone_number', value: '+221770000000' },
    });
    fireEvent.change(screen.getByLabelText(rateLabel), {
      target: { name: 'tarif_jour', value: '999' },
    });
    submitForm();

    expect(await screen.findByText(/1000 et 1000000 fcfa/i)).toBeInTheDocument();
    expect(completeFreelancerProfileMock).not.toHaveBeenCalled();
  });

  it('submits to complete-profile endpoint', async () => {
    renderWithLanguage(<CompleteProfilePage />);

    fireEvent.change(screen.getByLabelText(phoneLabel), {
      target: { name: 'phone_number', value: '+221770000000' },
    });
    fireEvent.change(screen.getByLabelText(rateLabel), {
      target: { name: 'tarif_jour', value: '25000' },
    });
    submitForm();

    await waitFor(() => {
      expect(completeFreelancerProfileMock).toHaveBeenCalledWith('token-123', {
        phoneNumber: '+221770000000',
        tarifJour: 25000,
        bio: null,
        specialite: null,
      });
    });
  });

  it('redirects to dashboard on success', async () => {
    renderWithLanguage(<CompleteProfilePage />);

    fireEvent.change(screen.getByLabelText(phoneLabel), {
      target: { name: 'phone_number', value: '+221770000000' },
    });
    fireEvent.change(screen.getByLabelText(rateLabel), {
      target: { name: 'tarif_jour', value: '25000' },
    });
    submitForm();

    await screen.findByText(/profil termin/i);
    await new Promise((resolve) => setTimeout(resolve, 1600));

    expect(mockLocation.href).toContain('/dashboard');
  });

  it('shows error message on failure', async () => {
    completeFreelancerProfileMock.mockRejectedValue(new Error('Failed to complete profile'));

    renderWithLanguage(<CompleteProfilePage />);

    fireEvent.change(screen.getByLabelText(phoneLabel), {
      target: { name: 'phone_number', value: '+221770000000' },
    });
    fireEvent.change(screen.getByLabelText(rateLabel), {
      target: { name: 'tarif_jour', value: '25000' },
    });
    submitForm();

    expect(await screen.findByText(/failed to complete profile/i)).toBeInTheDocument();
  });

  it('is only accessible to logged-in freelancers through ProtectedRoute', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      profile: null,
      loading: false,
    });

    const { container } = renderWithLanguage(
      <ProtectedRoute requiredRole="freelancer">
        <CompleteProfilePage />
      </ProtectedRoute>
    );

    expect(container).toHaveTextContent(/redirection en cours/i);
    expect(mockLocation.href).toContain('/complete-profile');
  });
});
