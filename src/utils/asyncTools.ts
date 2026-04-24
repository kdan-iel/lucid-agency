const DEFAULT_TIMEOUT_MS = 15_000;

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

interface AsyncGuardOptions {
  timeoutMs?: number;
  fallbackMessage?: string;
  metadata?: Record<string, unknown>;
}

const REDACTED_KEYS = ['authorization', 'password', 'secret', 'token', 'access_token'];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (Object.prototype.toString.call(value) !== '[object Object]') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

function isRedactedKey(key: string) {
  const normalized = key.toLowerCase();
  return REDACTED_KEYS.some((candidate) => normalized.includes(candidate));
}

function sanitizeValue(value: unknown, path = 'payload'): JsonValue | undefined {
  if (value === null) return null;

  if (typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`Valeur numérique invalide à ${path}.`);
    }
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'undefined') {
    return undefined;
  }

  if (typeof value === 'function' || typeof value === 'symbol') {
    throw new Error(`Valeur non sérialisable détectée à ${path}.`);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value
      .map((entry, index) => sanitizeValue(entry, `${path}[${index}]`))
      .filter((entry): entry is JsonValue => typeof entry !== 'undefined');
  }

  if (!isPlainObject(value)) {
    throw new Error(`Objet non supporté détecté à ${path}.`);
  }

  const sanitizedEntries = Object.entries(value).reduce<Record<string, JsonValue>>(
    (accumulator, [key, entry]) => {
      const sanitizedEntry = sanitizeValue(entry, `${path}.${key}`);
      if (typeof sanitizedEntry !== 'undefined') {
        accumulator[key] = sanitizedEntry;
      }
      return accumulator;
    },
    {}
  );

  return sanitizedEntries;
}

function sanitizeMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) return undefined;

  return Object.entries(metadata).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
    if (isRedactedKey(key)) {
      accumulator[key] = '[redacted]';
      return accumulator;
    }

    accumulator[key] = value;
    return accumulator;
  }, {});
}

export function ensureSerializablePayload<T>(payload: T, context: string): T {
  const sanitized = sanitizeValue(payload, context);

  if (typeof sanitized === 'undefined') {
    return {} as T;
  }

  try {
    JSON.stringify(sanitized);
  } catch (error) {
    throw new Error(
      `[${context}] Payload non sérialisable: ${toErrorMessage(error, 'JSON.stringify a échoué.')}`
    );
  }

  return sanitized as T;
}

export function toErrorMessage(error: unknown, fallback = 'Une erreur inattendue est survenue.') {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
}

export async function runWithAsyncGuard<T>(
  operation: string,
  task: () => Promise<T>,
  options: AsyncGuardOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const startedAt = Date.now();
  const logContext = sanitizeMetadata(options.metadata);
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  // console.info(`[Async:${operation}] start`, logContext ?? {});

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(
        new Error(
          options.fallbackMessage ??
            `L'opération "${operation}" a dépassé ${Math.round(timeoutMs / 1000)}s.`
        )
      );
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([task(), timeoutPromise]);
    // console.info(`[Async:${operation}] success`, {
    //   durationMs: Date.now() - startedAt,
    //   ...logContext,
    // });
    return result;
  } catch (error) {
    const message = toErrorMessage(error, options.fallbackMessage);
    console.error(`[Async:${operation}] failure`, {
      durationMs: Date.now() - startedAt,
      message,
      ...logContext,
    });

    if (error instanceof Error && error.message === message) {
      throw error;
    }

    throw new Error(message);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}
