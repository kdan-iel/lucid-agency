import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { cleanup } from '@testing-library/react';

// Composant qui throw une erreur
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Test error');
  return <div>Contenu normal</div>;
};

vi.spyOn(console, 'error').mockImplementation(() => {});

const reloadMock = vi.fn();

beforeEach(() => {
  reloadMock.mockReset();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...window.location,
      reload: reloadMock,
    },
  });
});

afterEach(() => {
  cleanup();
});

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
    expect(screen.getAllByText(/Code d'erreur/i).length).toBeGreaterThan(0);
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
    expect(screen.getAllByRole('button', { name: /recharger/i }).length).toBeGreaterThan(0);
  });

  it('recharge la page au clic sur le bouton', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /recharger/i }));

    expect(reloadMock).toHaveBeenCalledTimes(1);
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
