import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// Composant qui throw une erreur
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Test error');
  return <div>Contenu normal</div>;
};

describe('ErrorBoundary', () => {
  it('affiche les enfants normalement quand pas derreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Contenu normal')).toBeInTheDocument();
  });

  it('affiche le fallback quand une erreur est capturée', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/erreur inattendue/i)).toBeInTheDocument();
  });

  it('affiche un code derreur unique', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Code d'erreur/i)).toBeInTheDocument();
  });

  it('affiche un bouton pour recharger', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /recharger/i })).toBeInTheDocument();
  });

  it('affiche le fallback custom si fourni', () => {
    render(
      <ErrorBoundary fallback={<div>Erreur custom</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Erreur custom')).toBeInTheDocument();
  });
});
