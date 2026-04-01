import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: 'admin' | 'freelancer' | null;
  login: (username: string, password: string, role: 'admin' | 'freelancer') => boolean;
  changePassword: (newPassword: string) => void;
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
    const storedAdminPass = localStorage.getItem('lucid_admin_pass') || 'admin123';
    const storedFreePass = localStorage.getItem('lucid_free_pass') || 'free123';

    const validAdmin = username === 'admin' && password === storedAdminPass;
    const validFreelancer = username === 'freelancer' && password === storedFreePass;

    if ((role === 'admin' && validAdmin) || (role === 'freelancer' && validFreelancer)) {
      setIsAuthenticated(true);
      setUserRole(role);
      localStorage.setItem('lucid_auth', 'true');
      localStorage.setItem('lucid_role', role);
      return true;
    }
    return false;
  };

  const changePassword = (newPassword: string) => {
    if (userRole === 'admin') {
      localStorage.setItem('lucid_admin_pass', newPassword);
    } else if (userRole === 'freelancer') {
      localStorage.setItem('lucid_free_pass', newPassword);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem('lucid_auth');
    localStorage.removeItem('lucid_role');
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, login, changePassword, logout }}>
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
