/**
 * Hook de navigation sécurisée.
 * Valide les URLs avant toute redirection pour éviter les open redirects.
 */

const ALLOWED_INTERNAL_PATHS = ['/', '/join', '/dashboard', '/admin', '/login', '/reset-password'];

/**
 * Navigue vers un chemin interne validé.
 * Refuse les redirections vers des URLs externes non autorisées.
 */
export function useSecureNavigation() {
  const navigate = (path: string) => {
    // ✅ Accepte uniquement les chemins internes connus
    if (!ALLOWED_INTERNAL_PATHS.includes(path)) {
      console.warn(`[Security] Redirection vers chemin non autorisé bloquée : ${path}`);
      window.location.href = '/';
      return;
    }
    window.location.href = path;
  };

  /**
   * Valide une URL externe avant de l'ouvrir.
   * Refuse les protocoles dangereux (javascript:, data:, etc.)
   */
  const openExternal = (url: string) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        console.warn(`[Security] URL externe avec protocole dangereux bloquée : ${url}`);
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      console.warn(`[Security] URL externe invalide bloquée : ${url}`);
    }
  };

  return { navigate, openExternal };
}
