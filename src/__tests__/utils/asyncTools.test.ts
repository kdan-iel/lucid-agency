import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ensureSerializablePayload, runWithAsyncGuard } from '../../utils/asyncTools';

describe('asyncTools', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('nettoie les payloads non sérialisables simples', () => {
    const payload = ensureSerializablePayload(
      {
        name: 'Lucid',
        optional: undefined,
        nested: {
          active: true,
          empty: undefined,
        },
        items: ['a', undefined, 'b'],
      },
      'test-payload'
    );

    expect(payload).toEqual({
      name: 'Lucid',
      nested: {
        active: true,
      },
      items: ['a', 'b'],
    });
  });

  it('rejette les fonctions dans les payloads', () => {
    expect(() =>
      ensureSerializablePayload(
        {
          invalid: () => 'nope',
        },
        'test-payload'
      )
    ).toThrow(/non sérialisable/i);
  });

  it('interrompt les promesses trop longues via timeout', async () => {
    const guardedPromise = runWithAsyncGuard(
      'slow-operation',
      () => new Promise<string>(() => undefined),
      {
        timeoutMs: 100,
        fallbackMessage: 'Timeout atteint',
      }
    );
    const assertion = expect(guardedPromise).rejects.toThrow('Timeout atteint');

    await vi.advanceTimersByTimeAsync(100);
    await assertion;
  });
});
