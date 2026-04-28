const USER_ERROR_KEYWORDS = [
  'email',
  'mail',
  'phone',
  'numero',
  'password',
  'invalid',
  'already',
  'exists',
] as const;

function normalizeMessage(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function extractMessage(error: unknown) {
  if (typeof error === 'string') return error;

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return '';
}

export function handleError(error: unknown) {
  const message = extractMessage(error);
  const normalizedMessage = normalizeMessage(message);

  const isUserError =
    normalizedMessage.length > 0 &&
    USER_ERROR_KEYWORDS.some((keyword) => normalizedMessage.includes(keyword));

  if (isUserError) {
    return {
      type: 'user' as const,
      message,
    };
  }

  return {
    type: 'system' as const,
    error,
  };
}
