import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';
import { supabase } from '../../lib/supabaseClient';

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

describe('useSessionTimeout()', () => {
  const warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    vi.useFakeTimers();
    warnMock.mockClear();
    vi.mocked(supabase.auth.signOut).mockClear();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        href: 'http://localhost:5173/dashboard',
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('ne fait rien si non authentifie', () => {
    const { unmount } = renderHook(() => useSessionTimeout(false));

    act(() => {
      vi.advanceTimersByTime(35 * 60 * 1000);
    });

    unmount();

    expect(supabase.auth.signOut).not.toHaveBeenCalled();
    expect(warnMock).not.toHaveBeenCalled();
  });

  it('declenche un avertissement apres 25 minutes', () => {
    renderHook(() => useSessionTimeout(true));

    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000);
    });

    expect(warnMock).toHaveBeenCalledWith('[Session] Expiration dans 5 minutes.');
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it('deconnecte et redirige apres 30 minutes', async () => {
    renderHook(() => useSessionTimeout(true));

    await act(async () => {
      vi.advanceTimersByTime(30 * 60 * 1000);
      await Promise.resolve();
    });

    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('/');
  });

  it('reinitialise le timer sur activite utilisateur', () => {
    renderHook(() => useSessionTimeout(true));

    act(() => {
      vi.advanceTimersByTime(24 * 60 * 1000);
      window.dispatchEvent(new Event('click'));
      vi.advanceTimersByTime(2 * 60 * 1000);
    });

    expect(warnMock).not.toHaveBeenCalled();
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });
});
