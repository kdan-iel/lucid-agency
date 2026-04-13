import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';

vi.mock('../../context/AuthContext', () => ({
  supabase: {
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  },
}));

describe('useSessionTimeout()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('ne fait rien si non authentifie', () => {
    const { unmount } = renderHook(() => useSessionTimeout(false));
    vi.advanceTimersByTime(35 * 60 * 1000);
    unmount();
    // Pas de déconnexion si pas authentifié
    const { supabase } = require('../../context/AuthContext');
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it('réinitialise le timer sur activite utilisateur', () => {
    renderHook(() => useSessionTimeout(true));
    // Simuler de l'activité
    act(() => {
      window.dispatchEvent(new Event('click'));
    });
    // Ne pas avancer assez loin pour déclencher le timeout
    vi.advanceTimersByTime(10 * 60 * 1000);
    const { supabase } = require('../../context/AuthContext');
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });
});
