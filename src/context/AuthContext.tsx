import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: 'admin' | 'freelancer' | null;
  login: (username: string, password: string, role: 'admin' | 'freelancer') => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'freelancer' | null>(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem('lucid_auth');
    const savedRole = localStorage.getItem('lucid_role');
    if (savedAuth === 'true' && savedRole) {
      setIsAuthenticated(true);
      setUserRole(savedRole as 'admin' | 'freelancer');
    }
  }, []);

  const login = (username: string, password: string, role: 'admin' | 'freelancer') => {
    // Simple hardcoded credentials for demo purposes
    const validAdmin = username === 'admin' && password === 'admin123';
    const validFreelancer = username === 'freelancer' && password === 'free123';

    if ((role === 'admin' && validAdmin) || (role === 'freelancer' && validFreelancer)) {
      setIsAuthenticated(true);
      setUserRole(role);
      localStorage.setItem('lucid_auth', 'true');
      localStorage.setItem('lucid_role', role);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem('lucid_auth');
    localStorage.removeItem('lucid_role');
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
