import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AppContent } from '../App';

const mockUseAuth = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../context/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('../context/LanguageContext', () => ({
  LanguageProvider: ({ children }: { children: ReactNode }) => children,
  useLanguage: () => ({
    t: (key: string) =>
      (
        ({
          'onboardingModal.title': 'Complétez vos informations',
          'onboardingModal.body':
            'Certaines informations manquent encore pour finaliser votre profil freelancer. Vous pouvez continuer à utiliser le dashboard, puis revenir terminer votre profil quand vous êtes prêt.',
          'onboardingModal.primary': 'Compléter mes informations',
          'onboardingModal.secondary': 'Plus tard',
        }) as Record<string, string>
      )[key] ?? key,
  }),
}));

vi.mock('../components/Toast', () => ({
  ToastProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('../components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('../hooks/useSessionTimeout', () => ({
  useSessionTimeout: vi.fn(),
}));

vi.mock('../hooks/useTimeoutRegistry', () => ({
  useTimeoutRegistry: () => ({
    schedule: vi.fn(),
    clearAll: vi.fn(),
  }),
}));

vi.mock('../utils/navigation', () => ({
  navigate: (...args: unknown[]) => mockNavigate(...args),
}));

vi.mock('../components/Navbar', () => ({
  default: () => <div>Navbar</div>,
}));
vi.mock('../components/Hero', () => ({
  default: () => <div>Hero</div>,
}));
vi.mock('../components/Philosophy', () => ({
  default: () => <div>Philosophy</div>,
}));
vi.mock('../components/Method', () => ({
  default: () => <div>Method</div>,
}));
vi.mock('../components/Talents', () => ({
  default: () => <div>Talents</div>,
}));
vi.mock('../components/Results', () => ({
  default: () => <div>Results</div>,
}));
vi.mock('../components/Offers', () => ({
  default: () => <div>Offers</div>,
}));
vi.mock('../components/ContactForm', () => ({
  default: () => <div>ContactForm</div>,
}));
vi.mock('../components/Footer', () => ({
  default: () => <div>Footer</div>,
}));
vi.mock('../components/BackToTop', () => ({
  default: () => <div>BackToTop</div>,
}));

vi.mock('../pages/JoinPage', () => ({
  default: () => <div>Join Page</div>,
}));
vi.mock('../pages/DashboardPage', () => ({
  default: () => <div>Dashboard content</div>,
}));
vi.mock('../pages/AdminPage', () => ({
  default: () => <div>Admin Page</div>,
}));
vi.mock('../pages/LoginPage', () => ({
  default: () => <div>Login Page</div>,
}));
vi.mock('../pages/CompleteProfilePage', () => ({
  default: () => <div>Onboarding page</div>,
}));
vi.mock('../pages/UpdatePasswordPage', () => ({
  default: () => <div>Update Password Page</div>,
}));
vi.mock('../pages/NotFoundPage', () => ({
  default: () => <div>Not Found Page</div>,
}));
vi.mock('../pages/PrivacyPage', () => ({
  default: () => <div>Privacy Page</div>,
}));
vi.mock('../pages/LegalPage', () => ({
  default: () => <div>Legal Page</div>,
}));

describe('AppContent onboarding modal', () => {
  const incompleteFreelancerState = {
    loading: false,
    session: { user: { id: 'user-1' } },
    profile: { role: 'freelancer', user_id: 'user-1' },
    freelancer: {
      statut: 'pending',
      onboarding_completed: false,
    },
  };

  beforeEach(() => {
    mockUseAuth.mockReset();
    mockNavigate.mockReset();
  });

  it('shows the onboarding modal on the dashboard for incomplete freelancers', async () => {
    mockUseAuth.mockReturnValue(incompleteFreelancerState);

    render(<AppContent initialPath="/dashboard" />);

    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
    expect(await screen.findByText('Complétez vos informations')).toBeInTheDocument();
    expect(screen.getByText('Compléter mes informations')).toBeInTheDocument();
  });

  it('closes the modal for the current app session after clicking Plus tard', async () => {
    mockUseAuth.mockReturnValue(incompleteFreelancerState);

    render(<AppContent initialPath="/dashboard" />);

    fireEvent.click(await screen.findByText('Plus tard'));

    expect(screen.queryByText('Complétez vos informations')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  it('navigates to /onboarding with replace when the primary action is clicked', async () => {
    mockUseAuth.mockReturnValue(incompleteFreelancerState);

    render(<AppContent initialPath="/dashboard" />);

    fireEvent.click(await screen.findByText('Compléter mes informations'));

    expect(mockNavigate).toHaveBeenCalledWith('/onboarding', { replace: true });
  });

  it('does not show the modal on the onboarding route', () => {
    mockUseAuth.mockReturnValue(incompleteFreelancerState);

    render(<AppContent initialPath="/onboarding" />);

    expect(screen.getByText('Onboarding page')).toBeInTheDocument();
    expect(screen.queryByText('Complétez vos informations')).not.toBeInTheDocument();
  });
});
