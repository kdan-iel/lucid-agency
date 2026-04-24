import type { ReactNode } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../../context/LanguageContext';

function Consumer() {
  const { lang, setLang, t } = useLanguage();

  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="translation">{t('nav.contact')}</span>
      <span data-testid="missing">{t('missing.key')}</span>
      <button type="button" onClick={() => setLang('EN')}>
        Set EN
      </button>
      <button type="button" onClick={() => setLang('FR')}>
        Set FR
      </button>
      <button type="button" onClick={() => setLang('DE' as never)}>
        Set Invalid
      </button>
    </div>
  );
}

function renderWithProvider(ui: ReactNode) {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}

describe('LanguageContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'fr';
  });

  it('charge la langue sauvegardée dans le localStorage', () => {
    localStorage.setItem('lucid_lang', 'EN');

    renderWithProvider(<Consumer />);

    expect(screen.getByTestId('lang')).toHaveTextContent('EN');
    expect(screen.getByTestId('translation')).toHaveTextContent('Contact');
    expect(document.documentElement.lang).toBe('en');
  });

  it('met à jour la langue et persiste la préférence', () => {
    renderWithProvider(<Consumer />);

    fireEvent.click(screen.getByRole('button', { name: 'Set EN' }));

    expect(screen.getByTestId('lang')).toHaveTextContent('EN');
    expect(localStorage.getItem('lucid_lang')).toBe('EN');
    expect(document.documentElement.lang).toBe('en');
  });

  it('ignore les valeurs invalides passées à setLang', () => {
    renderWithProvider(<Consumer />);

    fireEvent.click(screen.getByRole('button', { name: 'Set Invalid' }));

    expect(screen.getByTestId('lang')).toHaveTextContent('FR');
    expect(localStorage.getItem('lucid_lang')).toBeNull();
    expect(document.documentElement.lang).toBe('fr');
  });

  it('retourne la clé brute quand une traduction est absente', () => {
    renderWithProvider(<Consumer />);

    expect(screen.getByTestId('missing')).toHaveTextContent('missing.key');
  });

  it('tolère un localStorage inaccessible lors de la sauvegarde', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    renderWithProvider(<Consumer />);
    fireEvent.click(screen.getByRole('button', { name: 'Set EN' }));

    expect(screen.getByTestId('lang')).toHaveTextContent('EN');
    expect(document.documentElement.lang).toBe('en');
    setItemSpy.mockRestore();
  });

  it('lève une erreur si useLanguage est utilisé hors provider', () => {
    expect(() => render(<Consumer />)).toThrow('useLanguage must be used within LanguageProvider');
  });
});
