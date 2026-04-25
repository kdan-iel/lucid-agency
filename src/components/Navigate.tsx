import { useLayoutEffect } from 'react';
import { navigate } from '../utils/navigation';

interface NavigateProps {
  to: string;
  replace?: boolean;
}

export function Navigate({ to, replace = false }: NavigateProps) {
  useLayoutEffect(() => {
    navigate(to, { replace });
  }, [replace, to]);

  return null;
}
