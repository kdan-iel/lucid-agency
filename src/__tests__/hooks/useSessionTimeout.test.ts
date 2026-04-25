import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';

const forceLogoutMock = vi.fn().mockResolvedValue(undefined);

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    forceLogout: forceLogoutMock,
  }),
}));

describe('useSessionTimeout()', () => {
  const warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    vi.useFakeTimers();
    warnMock.mockClear();
    forceLogoutMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('does nothing when unauthenticated', () => {
    const { unmount } = renderHook(() => useSessionTimeout(false));

    act(() => {
      vi.advanceTimersByTime(35 * 60 * 1000);
    });

    unmount();

    expect(forceLogoutMock).not.toHaveBeenCalled();
    expect(warnMock).not.toHaveBeenCalled();
  });

  it('warns after 25 minutes', () => {
    renderHook(() => useSessionTimeout(true));

    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000);
    });

    expect(warnMock).toHaveBeenCalledWith('[Session] Expiration dans 5 minutes.');
    expect(forceLogoutMock).not.toHaveBeenCalled();
  });

  it('forces logout after 30 minutes', async () => {
    renderHook(() => useSessionTimeout(true));

    await act(async () => {
      vi.advanceTimersByTime(30 * 60 * 1000);
      await Promise.resolve();
    });

    expect(forceLogoutMock).toHaveBeenCalledWith('idle_timeout');
  });

  it('resets the timer on user activity', () => {
    renderHook(() => useSessionTimeout(true));

    act(() => {
      vi.advanceTimersByTime(24 * 60 * 1000);
      window.dispatchEvent(new Event('click'));
      vi.advanceTimersByTime(2 * 60 * 1000);
    });

    expect(warnMock).not.toHaveBeenCalled();
    expect(forceLogoutMock).not.toHaveBeenCalled();
  });
});
