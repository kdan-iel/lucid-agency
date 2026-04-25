export interface NavigateOptions {
  replace?: boolean;
}

export function navigate(path: string, options: NavigateOptions = {}) {
  if (typeof window === 'undefined') return;

  const targetPath = path.startsWith('/') ? path : `/${path}`;
  const currentPath = `${window.location.pathname}${window.location.hash}`;

  if (currentPath === targetPath) return;

  const method = options.replace ? 'replaceState' : 'pushState';
  window.history[method]({}, '', targetPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function replacePath(path: string) {
  navigate(path, { replace: true });
}
