import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ✅ Validation stricte de la valeur lue — évite toute injection via localStorage
function isSafeTheme(value: string | null): value is Theme {
  return value === 'dark' || value === 'light';
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    try {
      // ✅ localStorage OK pour les préférences UI non sensibles
      // ✅ Valeur strictement validée avant usage
      const saved = localStorage.getItem('lucid_theme');
      const safeTheme = isSafeTheme(saved) ? saved : 'dark';
      setThemeState(safeTheme);
      document.documentElement.classList.toggle('light', safeTheme === 'light');
    } catch {
      // Si localStorage est bloqué (mode privé strict), on reste sur dark
      setThemeState('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    try {
      localStorage.setItem('lucid_theme', newTheme);
    } catch {
      // Silencieux si storage indisponible
    }
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
