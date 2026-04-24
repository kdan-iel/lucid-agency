import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  ensureSerializablePayload,
  runWithAsyncGuard,
  toErrorMessage,
} from '../../utils/asyncTools';

describe('asyncTools', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
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

  it('sérialise les dates, bigint et payloads undefined', () => {
    expect(ensureSerializablePayload(undefined, 'empty-payload')).toEqual({});

    const payload = ensureSerializablePayload(
      {
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        amount: 12n,
      },
      'date-payload'
    );

    expect(payload).toEqual({
      createdAt: '2026-01-01T00:00:00.000Z',
      amount: '12',
    });
  });

  it('rejette les nombres non finis et les objets non supportés', () => {
    expect(() =>
      ensureSerializablePayload({ count: Number.POSITIVE_INFINITY }, 'bad-number')
    ).toThrow(/valeur numérique invalide/i);

    expect(() => ensureSerializablePayload({ invalid: new Map() }, 'bad-object')).toThrow(
      /objet non supporté/i
    );
  });

  it('retourne un message exploitable selon le type d’erreur', () => {
    expect(toErrorMessage(new Error('boom'))).toBe('boom');
    expect(toErrorMessage('plain text')).toBe('plain text');
    expect(toErrorMessage('   ', 'fallback')).toBe('fallback');
    expect(toErrorMessage(null, 'fallback')).toBe('fallback');
  });

  it('retourne le résultat quand la tâche réussit', async () => {
    const result = await runWithAsyncGuard('fast-operation', async () => 'ok', {
      metadata: {
        access_token: 'secret-token',
        resource: 'contacts',
      },
    });

    expect(result).toBe('ok');
    expect(console.error).not.toHaveBeenCalled();
  });

  it('journalise des métadonnées redacted et propage une vraie erreur', async () => {
    const guardedPromise = runWithAsyncGuard(
      'failing-operation',
      async () => {
        throw new Error('échec contrôlé');
      },
      {
        metadata: {
          access_token: 'secret-token',
          password: 'super-secret',
          resource: 'contacts',
        },
      }
    );

    await expect(guardedPromise).rejects.toThrow('échec contrôlé');
    expect(console.error).toHaveBeenCalledWith('[Async:failing-operation] failure', {
      durationMs: expect.any(Number),
      message: 'échec contrôlé',
      access_token: '[redacted]',
      password: '[redacted]',
      resource: 'contacts',
    });
  });

  it('wrap une erreur textuelle avec le fallback fourni', async () => {
    const guardedPromise = runWithAsyncGuard(
      'string-failure',
      async () => {
        throw 'erreur brute';
      },
      {
        fallbackMessage: 'message de secours',
      }
    );

    await expect(guardedPromise).rejects.toThrow('erreur brute');
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
