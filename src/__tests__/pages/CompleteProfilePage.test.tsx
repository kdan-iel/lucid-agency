import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '../../components/ProtectedRoute';
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
        first_name: 'Jean',
        last_name: 'Dupont',
        role: 'freelancer',
        phone: '',
        tarif_jour: undefined,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      loading: false,
    });
    completeFreelancerProfileMock.mockResolvedValue({ success: true });
  });

  const submitForm = () => {
    const button = screen.getByRole('button', { name: /completer mon profil/i });
    const form = button.closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
  };

  it('renders form with phone and tarif fields', () => {
    render(<CompleteProfilePage />);

    expect(screen.getByLabelText(/numero de telephone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tarif journalier/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /completer mon profil/i })).toBeInTheDocument();
  });

  it('validates phone number format', async () => {
    render(<CompleteProfilePage />);

    fireEvent.change(screen.getByLabelText(/numero de telephone/i), {
      target: { name: 'phone_number', value: '1234' },
    });
    submitForm();

    expect(await screen.findByText(/format invalide/i)).toBeInTheDocument();
    expect(completeFreelancerProfileMock).not.toHaveBeenCalled();
  });

  it('validates tarif_jour range', async () => {
    render(<CompleteProfilePage />);

    fireEvent.change(screen.getByLabelText(/numero de telephone/i), {
      target: { name: 'phone_number', value: '+221770000000' },
    });
    fireEvent.change(screen.getByLabelText(/tarif journalier/i), {
      target: { name: 'tarif_jour', value: '999' },
    });
    submitForm();

    expect(await screen.findByText(/entre 1000 et 1000000 fcfa/i)).toBeInTheDocument();
    expect(completeFreelancerProfileMock).not.toHaveBeenCalled();
  });

  it('submits to complete-profile endpoint', async () => {
    render(<CompleteProfilePage />);

    fireEvent.change(screen.getByLabelText(/numero de telephone/i), {
      target: { name: 'phone_number', value: '+221770000000' },
    });
    fireEvent.change(screen.getByLabelText(/tarif journalier/i), {
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
    render(<CompleteProfilePage />);

    fireEvent.change(screen.getByLabelText(/numero de telephone/i), {
      target: { name: 'phone_number', value: '+221770000000' },
    });
    fireEvent.change(screen.getByLabelText(/tarif journalier/i), {
      target: { name: 'tarif_jour', value: '25000' },
    });
    submitForm();

    await screen.findByText(/profil termine/i);
    await new Promise((resolve) => setTimeout(resolve, 1600));

    expect(mockLocation.href).toContain('/dashboard');
  });

  it('shows error message on failure', async () => {
    completeFreelancerProfileMock.mockRejectedValue(new Error('Failed to complete profile'));

    render(<CompleteProfilePage />);

    fireEvent.change(screen.getByLabelText(/numero de telephone/i), {
      target: { name: 'phone_number', value: '+221770000000' },
    });
    fireEvent.change(screen.getByLabelText(/tarif journalier/i), {
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

    const { container } = render(
      <ProtectedRoute requiredRole="freelancer">
        <CompleteProfilePage />
      </ProtectedRoute>
    );

    expect(container).toHaveTextContent(/redirection en cours/i);
    expect(mockLocation.href).toContain('/');
  });
});
