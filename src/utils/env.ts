const rawEnv = import.meta.env as Record<string, string | undefined>;

function readEnv(key: string) {
  const value = rawEnv[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getRequiredEnv(key: string, validator?: (value: string) => boolean) {
  const value = readEnv(key);

  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${key}`);
  }

  if (validator && !validator(value)) {
    throw new Error(`Variable d'environnement invalide: ${key}`);
  }

  return value;
}

export function getOptionalEnv(
  key: string,
  fallback: string,
  validator?: (value: string) => boolean
) {
  const value = readEnv(key);
  if (!value) return fallback;

  if (validator && !validator(value)) {
    throw new Error(`Variable d'environnement invalide: ${key}`);
  }

  return value;
}

export function getRequiredHttpUrlEnv(key: string) {
  return getRequiredEnv(key, isHttpUrl);
}

export function getOptionalHttpUrlEnv(key: string) {
  const value = readEnv(key);
  if (!value) return undefined;

  if (!isHttpUrl(value)) {
    throw new Error(`Variable d'environnement invalide: ${key}`);
  }

  return value;
}
