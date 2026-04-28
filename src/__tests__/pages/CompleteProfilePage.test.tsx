import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { LanguageProvider } from '../../context/LanguageContext';
import CompleteProfilePage from '../../pages/CompleteProfilePage';

const mockUseAuth = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../components/Navbar', () => ({
  default: () => <div>Navbar</div>,
}));

vi.mock('../../components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

describe('CompleteProfilePage', () => {
  const firstNameLabel = 'Prénom *';
  const lastNameLabel = 'Nom *';
  const phoneLabel = 'Numéro de téléphone *';
  const rateLabel = 'Tarif journalier (FCFA) *';
  const bioLabel = 'Bio *';
  const specialtyLabel = 'Spécialité *';
  const portfolioLabel = 'Lien portfolio *';
  const submitLabel = 'Compléter mon profil';
  const updateProfileMock = vi.fn();
  const updateFreelancerMock = vi.fn();
  let replaceStateSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    replaceStateSpy = vi.spyOn(window.history, 'replaceState');
    updateProfileMock.mockResolvedValue(undefined);
    updateFreelancerMock.mockResolvedValue(undefined);
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
        portfolio_url: null,
        onboarding_completed: false,
        archived_at: null,
        message_candidature: 'Freelance React avec 5 ans d’expérience.',
      },
      updateProfile: updateProfileMock,
      updateFreelancer: updateFreelancerMock,
      loading: false,
    });
  });

  const submitForm = () => {
    const button = screen.getByRole('button', { name: submitLabel });
    const form = button.closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
  };

  const renderWithLanguage = (ui: ReactNode) => render(<LanguageProvider>{ui}</LanguageProvider>);

  it('pre-fills the form with profile and freelancer data', () => {
    renderWithLanguage(<CompleteProfilePage />);

    expect(screen.getByLabelText(firstNameLabel)).toHaveValue('Jean');
    expect(screen.getByLabelText(lastNameLabel)).toHaveValue('Dupont');
    expect(screen.getByLabelText(bioLabel)).toHaveValue(
      'Freelance React avec 5 ans d’expérience.'
    );
    expect(screen.getByRole('button', { name: submitLabel })).toBeInTheDocument();
  });

  it('uses the persisted bio over message_candidature when bio already exists', () => {
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
        bio: 'Bio déjà enregistrée',
        specialite: null,
        portfolio_url: null,
        onboarding_completed: false,
        archived_at: null,
        message_candidature: 'Freelance React avec 5 ans d’expérience.',
      },
      updateProfile: updateProfileMock,
      updateFreelancer: updateFreelancerMock,
      loading: false,
    });

    renderWithLanguage(<CompleteProfilePage />);

    expect(screen.getByLabelText(bioLabel)).toHaveValue('Bio déjà enregistrée');
  });

  it('blocks submission when required fields are missing or invalid', async () => {
    renderWithLanguage(<CompleteProfilePage />);

    fireEvent.change(screen.getByLabelText(phoneLabel), {
      target: { name: 'phone_number', value: '' },
    });
    fireEvent.change(screen.getByLabelText(rateLabel), {
      target: { name: 'tarif_jour', value: '' },
    });
    fireEvent.change(screen.getByLabelText(bioLabel), {
      target: { name: 'bio', value: '' },
    });
    fireEvent.change(screen.getByLabelText(specialtyLabel), {
      target: { name: 'specialite', value: '' },
    });
    fireEvent.change(screen.getByLabelText(portfolioLabel), {
      target: { name: 'portfolio_url', value: 'not-a-url' },
    });
    submitForm();

    expect(await screen.findByText('Numéro de téléphone requis')).toBeInTheDocument();
    expect(screen.getByText('Le tarif journalier est requis')).toBeInTheDocument();
    expect(screen.getByText('La bio est requise')).toBeInTheDocument();
    expect(screen.getByText('La spécialité est requise')).toBeInTheDocument();
    expect(screen.getByText('URL invalide (ex: https://monportfolio.com)')).toBeInTheDocument();
    expect(updateProfileMock).not.toHaveBeenCalled();
    expect(updateFreelancerMock).not.toHaveBeenCalled();
  });

  it('updates only modified freelancer fields and preserves bio fallback when unchanged', async () => {
    renderWithLanguage(<CompleteProfilePage />);

    fireEvent.change(screen.getByLabelText(phoneLabel), {
      target: { name: 'phone_number', value: '+221770000000' },
    });
    fireEvent.change(screen.getByLabelText(rateLabel), {
      target: { name: 'tarif_jour', value: '25000' },
    });
    fireEvent.change(screen.getByLabelText(specialtyLabel), {
      target: { name: 'specialite', value: 'Développeur React' },
    });
    fireEvent.change(screen.getByLabelText(portfolioLabel), {
      target: { name: 'portfolio_url', value: 'https://monportfolio.com' },
    });
    submitForm();

    await waitFor(() => {
      expect(updateProfileMock).not.toHaveBeenCalled();
      expect(updateFreelancerMock).toHaveBeenCalledWith({
        phone_number: '+221770000000',
        tarif_jour: 25000,
        specialite: 'Développeur React',
        portfolio_url: 'https://monportfolio.com/',
        onboarding_completed: true,
      });
    });
  });

  it('updates the profile name and bio only when the user actually changes them', async () => {
    renderWithLanguage(<CompleteProfilePage />);

    fireEvent.change(screen.getByLabelText(firstNameLabel), {
      target: { name: 'first_name', value: 'Jeanne' },
    });
    fireEvent.change(screen.getByLabelText(lastNameLabel), {
      target: { name: 'last_name', value: 'Durand' },
    });
    fireEvent.change(screen.getByLabelText(phoneLabel), {
      target: { name: 'phone_number', value: '+221770000000' },
    });
    fireEvent.change(screen.getByLabelText(rateLabel), {
      target: { name: 'tarif_jour', value: '25000' },
    });
    fireEvent.change(screen.getByLabelText(bioLabel), {
      target: { name: 'bio', value: 'Bio personnalisée' },
    });
    fireEvent.change(screen.getByLabelText(specialtyLabel), {
      target: { name: 'specialite', value: 'Développeuse frontend' },
    });
    fireEvent.change(screen.getByLabelText(portfolioLabel), {
      target: { name: 'portfolio_url', value: 'https://monportfolio.com' },
    });
    submitForm();

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith({
        full_name: 'Jeanne Durand',
      });
      expect(updateFreelancerMock).toHaveBeenCalledWith({
        phone_number: '+221770000000',
        tarif_jour: 25000,
        bio: 'Bio personnalisée',
        specialite: 'Développeuse frontend',
        portfolio_url: 'https://monportfolio.com/',
        onboarding_completed: true,
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
    fireEvent.change(screen.getByLabelText(specialtyLabel), {
      target: { name: 'specialite', value: 'Développeur React' },
    });
    fireEvent.change(screen.getByLabelText(portfolioLabel), {
      target: { name: 'portfolio_url', value: 'https://monportfolio.com' },
    });
    submitForm();

    await screen.findByText(/profil termin/i);
    await new Promise((resolve) => setTimeout(resolve, 1600));

    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/dashboard');
  });

  it('shows an error message on update failure', async () => {
    updateFreelancerMock.mockRejectedValue(new Error('Failed to complete profile'));

    renderWithLanguage(<CompleteProfilePage />);

    fireEvent.change(screen.getByLabelText(phoneLabel), {
      target: { name: 'phone_number', value: '+221770000000' },
    });
    fireEvent.change(screen.getByLabelText(rateLabel), {
      target: { name: 'tarif_jour', value: '25000' },
    });
    fireEvent.change(screen.getByLabelText(specialtyLabel), {
      target: { name: 'specialite', value: 'Développeur React' },
    });
    fireEvent.change(screen.getByLabelText(portfolioLabel), {
      target: { name: 'portfolio_url', value: 'https://monportfolio.com' },
    });
    submitForm();

    expect(await screen.findByText(/une erreur est survenue/i)).toBeInTheDocument();
  });

  it('shows the raw backend message for user-related errors', async () => {
    updateFreelancerMock.mockRejectedValue(new Error('Phone already exists'));

    renderWithLanguage(<CompleteProfilePage />);

    fireEvent.change(screen.getByLabelText(phoneLabel), {
      target: { name: 'phone_number', value: '+221770000000' },
    });
    fireEvent.change(screen.getByLabelText(rateLabel), {
      target: { name: 'tarif_jour', value: '25000' },
    });
    fireEvent.change(screen.getByLabelText(specialtyLabel), {
      target: { name: 'specialite', value: 'Développeur React' },
    });
    fireEvent.change(screen.getByLabelText(portfolioLabel), {
      target: { name: 'portfolio_url', value: 'https://monportfolio.com' },
    });
    submitForm();

    expect(await screen.findByText('Phone already exists')).toBeInTheDocument();
  });

  it('is only accessible to logged-in freelancers through ProtectedRoute', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      profile: null,
      loading: false,
    });

    const { container } = renderWithLanguage(
      <ProtectedRoute route="dashboard">
        <CompleteProfilePage />
      </ProtectedRoute>
    );

    expect(container).toBeEmptyDOMElement();
  });
});
