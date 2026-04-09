import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string;
}

/**
 * ErrorBoundary global — capture les erreurs React runtime.
 * Évite que l'app crash complètement et n'expose pas les stack traces en prod.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorId: '' };
  }

  static getDerivedStateFromError(): State {
    // ✅ Générer un ID d'erreur unique pour le support (sans exposer les détails)
    const errorId = Math.random().toString(36).substring(2, 9).toUpperCase();
    return { hasError: true, errorId };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // ✅ En production : logger vers un service (Sentry, etc.) sans exposer à l'utilisateur
    // En développement : afficher dans la console
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info);
    }
    // TODO: envoyer à Sentry en production
    // Sentry.captureException(error, { extra: info });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold mb-3">Une erreur inattendue s'est produite</h2>
            <p className="text-brand-gray mb-2">
              L'application a rencontré un problème. Veuillez recharger la page.
            </p>
            {/* ✅ ID d'erreur affiché pour le support — sans stack trace sensible */}
            <p className="text-xs text-brand-gray/50 mb-8">
              Code d'erreur : {this.state.errorId}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-brand-mint text-[#0D1117] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
