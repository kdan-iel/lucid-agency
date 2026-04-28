import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AppContent } from '../App';

const mockUseAuth = vi.fn();
const mockNavigate = vi.fn();
const scheduleMock = vi.fn();
const clearAllMock = vi.fn();
const useSessionTimeoutMock = vi.fn();

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
  useSessionTimeout: (...args: unknown[]) => useSessionTimeoutMock(...args),
}));

vi.mock('../hooks/useTimeoutRegistry', () => ({
  useTimeoutRegistry: () => ({
    schedule: scheduleMock,
    clearAll: clearAllMock,
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
  default: ({ role }: { role: 'admin' | 'freelancer' }) => (
    <div>{role === 'admin' ? 'Admin Login Page' : 'Freelancer Login Page'}</div>
  ),
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
    scheduleMock.mockReset();
    clearAllMock.mockReset();
    useSessionTimeoutMock.mockReset();
    window.history.replaceState({}, '', '/');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the landing page on the root route', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      session: null,
      profile: null,
      freelancer: null,
    });

    render(<AppContent initialPath="/" />);

    expect(screen.getByText('Navbar')).toBeInTheDocument();
    expect(screen.getByText('Hero')).toBeInTheDocument();
    expect(screen.getByText('BackToTop')).toBeInTheDocument();
    expect(useSessionTimeoutMock).toHaveBeenCalledWith(false);
  });

  it('renders the auth loading screen when loading without a session', () => {
    mockUseAuth.mockReturnValue({
      loading: true,
      session: null,
      profile: null,
      freelancer: null,
    });

    render(<AppContent initialPath="/dashboard" />);

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('renders secondary routes', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      session: { user: { id: 'user-1' } },
      profile: { role: 'freelancer', user_id: 'user-1' },
      freelancer: { statut: 'validated', onboarding_completed: true },
    });

    const routeExpectations = [
      ['/join', 'Join Page'],
      ['/login', 'Freelancer Login Page'],
      ['/admin/login', 'Admin Login Page'],
      ['/update-password', 'Update Password Page'],
      ['/privacy', 'Privacy Page'],
      ['/legal', 'Legal Page'],
      ['/admin', 'Admin Page'],
      ['/complete-profile', 'Onboarding page'],
      ['/onboarding', 'Onboarding page'],
      ['/unknown', 'Not Found Page'],
    ] as const;

    routeExpectations.forEach(([route, expected]) => {
      const { unmount } = render(<AppContent initialPath={route} />);
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
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

  it('updates the rendered route when a popstate event occurs', async () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      session: null,
      profile: null,
      freelancer: null,
    });

    render(<AppContent initialPath="/" />);
    expect(screen.getByText('Hero')).toBeInTheDocument();

    await act(async () => {
      window.history.pushState({}, '', '/join');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(await screen.findByText('Join Page')).toBeInTheDocument();
  });

  it('intercepts valid internal links and navigates without full reload', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      session: null,
      profile: null,
      freelancer: null,
    });

    render(<AppContent initialPath="/" />);

    const link = document.createElement('a');
    link.href = `${window.location.origin}/join`;
    link.textContent = 'Join';
    document.body.appendChild(link);

    fireEvent.click(link);

    expect(mockNavigate).toHaveBeenCalledWith('/join');
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);

    link.remove();
  });

  it('does not intercept same-path hash navigation', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      session: null,
      profile: null,
      freelancer: null,
    });
    window.history.replaceState({}, '', '/');

    render(<AppContent initialPath="/" />);

    const link = document.createElement('a');
    link.href = `${window.location.origin}/#contact`;
    link.textContent = 'Contact';
    document.body.appendChild(link);

    fireEvent.click(link);

    expect(mockNavigate).not.toHaveBeenCalled();

    link.remove();
  });

  it('schedules a scroll to the current hash target on mount', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      session: null,
      profile: null,
      freelancer: null,
    });

    window.history.replaceState({}, '', '/#contact');
    const scrollIntoView = vi.fn();
    const querySelectorSpy = vi.spyOn(document, 'querySelector').mockReturnValue({
      scrollIntoView,
    } as unknown as Element);

    render(<AppContent initialPath="/" />);

    expect(scheduleMock).toHaveBeenCalled();
    const callback = scheduleMock.mock.calls[0][0] as () => void;
    callback();
    expect(querySelectorSpy).toHaveBeenCalledWith('#contact');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });
});
