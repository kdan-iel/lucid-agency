import { getOptionalHttpUrlEnv } from './env';

const appUrl = getOptionalHttpUrlEnv('VITE_APP_URL');

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function getPasswordUpdateRedirectUrl() {
  const origin =
    appUrl ?? (typeof window !== 'undefined' ? window.location.origin : 'https://lucidagence.com');

  return `${trimTrailingSlash(origin)}/update-password`;
}
