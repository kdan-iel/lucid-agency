import { useCallback, useEffect, useRef } from 'react';

export function useTimeoutRegistry() {
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const clearAll = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const schedule = useCallback((callback: () => void, delayMs: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delayMs);

    timersRef.current.add(timer);
    return timer;
  }, []);

  useEffect(() => clearAll, [clearAll]);

  return {
    clearAll,
    schedule,
  };
}
