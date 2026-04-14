/**
 * ============================================================
 * LUCID AGENCY — Utilitaires de sécurité frontend
 * ============================================================
 */

// ============================================================
// 1. SANITIZATION
// ============================================================

/** Échappe les caractères HTML dangereux */
export function sanitizeText(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/** Vérifie qu'une chaîne ne contient pas de HTML */
export function isHtmlFree(input: string): boolean {
  return !/<[^>]*>/g.test(input);
}

/**
 * Nettoie une URL externe.
 * Retourne null si l'URL utilise un protocole dangereux (javascript:, data:, etc.)
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed.href;
  } catch {
    return null;
  }
}

// ============================================================
// 2. RATE LIMITING CÔTÉ CLIENT
// ============================================================

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Limite les soumissions répétées côté client.
 * @param key - Clé unique de l'action (ex: 'login', 'contact')
 * @param maxAttempts - Nombre max de tentatives (défaut: 5)
 * @param windowMs - Fenêtre en ms (défaut: 60s)
 */
export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    rateLimitStore.set(key, { count: 1, firstAttempt: now });
    return true;
  }

  if (now - entry.firstAttempt > windowMs) {
    rateLimitStore.set(key, { count: 1, firstAttempt: now });
    return true;
  }

  if (entry.count >= maxAttempts) return false;

  entry.count++;
  return true;
}

/** Secondes restantes avant reset du rate limit */
export function getRateLimitWait(key: string, windowMs = 60_000): number {
  const entry = rateLimitStore.get(key);
  if (!entry) return 0;
  const remaining = windowMs - (Date.now() - entry.firstAttempt);
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

// ============================================================
// 3. VALIDATION
// ============================================================

/** Valide un email avec regex stricte */
export function isValidEmail(email: string): boolean {
  return /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(email) && email.length <= 255;
}

/** Valide la force d'un mot de passe */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Minimum 8 caractères');
  if (!/[A-Z]/.test(password)) errors.push('Au moins une majuscule');
  if (!/[0-9]/.test(password)) errors.push('Au moins un chiffre');
  if (!/[^a-zA-Z0-9]/.test(password)) errors.push('Au moins un caractère spécial');
  return { valid: errors.length === 0, errors };
}

/** Tronque une chaîne à une longueur max */
export function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

// ============================================================
// 4. TOKEN CSRF SIMPLE (sessionStorage — effacé à la fermeture)
// ============================================================

/** Génère un token CSRF cryptographiquement aléatoire */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function storeCsrfToken(token: string): void {
  try {
    sessionStorage.setItem('lucid_csrf', token);
  } catch {
    /* silencieux */
  }
}

export function getCsrfToken(): string | null {
  try {
    return sessionStorage.getItem('lucid_csrf');
  } catch {
    return null;
  }
}
