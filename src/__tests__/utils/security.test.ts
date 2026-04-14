import { describe, it, expect, vi } from 'vitest';
import {
  sanitizeText, isHtmlFree, sanitizeUrl,
  checkRateLimit, getRateLimitWait,
  isValidEmail, validatePassword, truncate,
  generateCsrfToken, storeCsrfToken, getCsrfToken,
} from '../../utils/security';

describe('sanitizeText()', () => {
  it('échappe les balises HTML dangereuses', () => {
    expect(sanitizeText('<script>alert("xss")</script>')).not.toContain('<script>');
    expect(sanitizeText('<img src=x onerror=alert(1)>')).not.toContain('<img');
  });
  it('échappe les guillemets et apostrophes', () => {
    const r = sanitizeText('"hello" & \'world\'');
    expect(r).toContain('&quot;');
    expect(r).toContain('&#x27;');
    expect(r).toContain('&amp;');
  });
  it('échappe < et >', () => {
    const r = sanitizeText('<div>test</div>');
    expect(r).toContain('&lt;');
    expect(r).toContain('&gt;');
  });
  it('retourne une chaine vide inchangee', () => {
    expect(sanitizeText('')).toBe('');
  });
  it('laisse le texte normal intact', () => {
    expect(sanitizeText('Bonjour monde')).toBe('Bonjour monde');
  });
});

describe('isHtmlFree()', () => {
  it('retourne false pour du HTML', () => {
    expect(isHtmlFree('<p>paragraphe</p>')).toBe(false);
    expect(isHtmlFree('<script>alert(1)</script>')).toBe(false);
  });
  it('retourne true pour du texte propre', () => {
    expect(isHtmlFree('Bonjour tout le monde')).toBe(true);
    expect(isHtmlFree('')).toBe(true);
  });
});

describe('sanitizeUrl()', () => {
  it('accepte les URLs https valides', () => {
    expect(sanitizeUrl('https://google.com')).toBeTruthy();
  });
  it('accepte aussi les URLs http valides', () => {
    expect(sanitizeUrl('http://example.com/path')).toBe('http://example.com/path');
  });
  it('bloque javascript:', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
  });
  it('bloque data:', () => {
    expect(sanitizeUrl('data:text/html,xss')).toBeNull();
  });
  it('retourne null pour les URLs malformees', () => {
    expect(sanitizeUrl('pas-une-url')).toBeNull();
    expect(sanitizeUrl('')).toBeNull();
  });
});

describe('checkRateLimit()', () => {
  it('autorise les premieres tentatives', () => {
    const key = `rl-${Date.now()}-1`;
    expect(checkRateLimit(key, 3, 60000)).toBe(true);
    expect(checkRateLimit(key, 3, 60000)).toBe(true);
    expect(checkRateLimit(key, 3, 60000)).toBe(true);
  });
  it('bloque apres le nombre max', () => {
    const key = `rl-${Date.now()}-2`;
    checkRateLimit(key, 2, 60000);
    checkRateLimit(key, 2, 60000);
    expect(checkRateLimit(key, 2, 60000)).toBe(false);
  });
  it('utilise des cles independantes', () => {
    const k1 = `rl-${Date.now()}-3a`;
    const k2 = `rl-${Date.now()}-3b`;
    checkRateLimit(k1, 1, 60000);
    checkRateLimit(k1, 1, 60000);
    expect(checkRateLimit(k2, 1, 60000)).toBe(true);
  });
  it('reinitialise la fenetre apres expiration', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const key = 'rl-window-reset';
    expect(checkRateLimit(key, 1, 1000)).toBe(true);
    expect(checkRateLimit(key, 1, 1000)).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(checkRateLimit(key, 1, 1000)).toBe(true);

    vi.useRealTimers();
  });
});

describe('getRateLimitWait()', () => {
  it('retourne 0 pour une cle inexistante', () => {
    expect(getRateLimitWait('missing-rate-limit-key')).toBe(0);
  });

  it('retourne le temps restant arrondi quand la fenetre est active', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const key = 'rl-active-wait';
    checkRateLimit(key, 2, 5000);
    vi.advanceTimersByTime(1200);

    expect(getRateLimitWait(key, 5000)).toBe(4);

    vi.useRealTimers();
  });

  it('retourne 0 quand la fenetre est deja expiree', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const key = 'rl-expired-wait';
    checkRateLimit(key, 2, 1000);
    vi.advanceTimersByTime(1500);

    expect(getRateLimitWait(key, 1000)).toBe(0);

    vi.useRealTimers();
  });
});

describe('isValidEmail()', () => {
  it('accepte les emails valides', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('test@lucid-agency.com')).toBe(true);
  });
  it('rejette les emails invalides', () => {
    expect(isValidEmail('pas-un-email')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
  it('rejette les emails > 255 chars', () => {
    expect(isValidEmail('a'.repeat(250) + '@b.com')).toBe(false);
  });
});

describe('validatePassword()', () => {
  it('accepte un mot de passe fort', () => {
    const r = validatePassword('Secure1!Pass');
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });
  it('rejette si trop court', () => {
    const r = validatePassword('Ab1!');
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('Minimum 8 caractères');
  });
  it('exige une majuscule', () => {
    expect(validatePassword('password1!').errors).toContain('Au moins une majuscule');
  });
  it('exige un chiffre', () => {
    expect(validatePassword('Password!').errors).toContain('Au moins un chiffre');
  });
  it('exige un caractere special', () => {
    expect(validatePassword('Password1').errors).toContain('Au moins un caractère spécial');
  });
});

describe('truncate()', () => {
  it('tronque correctement', () => {
    expect(truncate('hello world', 5)).toBe('hello');
  });
  it('ne tronque pas si plus court', () => {
    expect(truncate('hi', 10)).toBe('hi');
  });
});

describe('CSRF Token', () => {
  it('genere un token de 64 chars hex', () => {
    const token = generateCsrfToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });
  it('genere des tokens uniques', () => {
    expect(generateCsrfToken()).not.toBe(generateCsrfToken());
  });
  it('stocke et recupere depuis sessionStorage', () => {
    const token = generateCsrfToken();
    storeCsrfToken(token);
    expect(getCsrfToken()).toBe(token);
  });
  it('ignore silencieusement les erreurs de sessionStorage a l ecriture', () => {
    const originalSessionStorage = window.sessionStorage;
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: {
        ...originalSessionStorage,
        setItem: vi.fn(() => {
          throw new Error('storage unavailable');
        }),
      },
    });

    expect(() => storeCsrfToken('token')).not.toThrow();

    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: originalSessionStorage,
    });
  });
  it('retourne null si sessionStorage echoue a la lecture', () => {
    const originalSessionStorage = window.sessionStorage;
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: {
        ...originalSessionStorage,
        getItem: vi.fn(() => {
          throw new Error('storage unavailable');
        }),
      },
    });

    expect(getCsrfToken()).toBeNull();

    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: originalSessionStorage,
    });
  });
});
