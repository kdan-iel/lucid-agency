const INVALID_SESSION_EVENT = 'auth:invalid-session';

type InvalidSessionDetail = {
  reason?: string;
};

type ErrorWithStatus = Error & {
  status?: number;
  code?: string;
  publicMessage?: string;
};

export function isInvalidSessionError(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as ErrorWithStatus;
  const status = typeof candidate.status === 'number' ? candidate.status : undefined;
  const code = candidate.code?.toLowerCase() ?? '';
  const message = candidate.message?.toLowerCase() ?? '';

  return (
    status === 401 ||
    status === 403 ||
    code.includes('jwt') ||
    message.includes('jwt') ||
    message.includes('expired') ||
    message.includes('invalid') ||
    message.includes('session') ||
    message.includes('token') ||
    message.includes('auth session missing')
  );
}

export function createPublicError(
  publicMessage: string,
  options: {
    debugMessage?: string;
    status?: number;
    code?: string;
  } = {}
) {
  const error = new Error(options.debugMessage ?? publicMessage) as ErrorWithStatus;
  error.publicMessage = publicMessage;
  if (typeof options.status === 'number') {
    error.status = options.status;
  }
  if (typeof options.code === 'string') {
    error.code = options.code;
  }
  return error;
}

export function toUserSafeMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === 'object' &&
    'publicMessage' in error &&
    typeof (error as ErrorWithStatus).publicMessage === 'string'
  ) {
    return (error as ErrorWithStatus).publicMessage ?? fallback;
  }

  return fallback;
}

export function emitInvalidSession(reason = 'invalid_session') {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<InvalidSessionDetail>(INVALID_SESSION_EVENT, {
      detail: { reason },
    })
  );
}

export function subscribeToInvalidSession(handler: (reason?: string) => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<InvalidSessionDetail>;
    handler(customEvent.detail?.reason);
  };

  window.addEventListener(INVALID_SESSION_EVENT, listener);
  return () => window.removeEventListener(INVALID_SESSION_EVENT, listener);
}
