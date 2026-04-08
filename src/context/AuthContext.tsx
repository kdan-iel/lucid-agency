import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, Session, User } from '@supabase/supabase-js';

// ============================================================
// CLIENT SUPABASE
// ============================================================
export const supabase = createClient(
  (import.meta as any).env?.VITE_SUPABASE_URL || '',
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ''
);

// ============================================================
// TYPES
// ============================================================
export interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'freelancer' | 'client';
  avatar_url?: string;
  created_at: string;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;

  // Méthodes
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  clearError: () => void;
}

// ============================================================
// CONTEXT
// ============================================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger le profil depuis Supabase
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        // Profil pas encore créé, pas grave
        if (profileError.code !== 'PGRST116') {
          console.error('Erreur chargement profil:', profileError.message);
        }
        return;
      }

      setProfile(data as Profile);
    } catch (err) {
      console.error('fetchProfile error:', err);
    }
  };

  // ✅ Initialisation : vérification de session CÔTÉ SERVEUR
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);

        // Récupère la session depuis Supabase (JWT vérifié côté serveur)
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // ✅ Écoute les changements de session en temps réel
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setError(null);

      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      } else {
        // Nettoyage complet à la déconnexion
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ============================================================
  // MÉTHODES AUTH
  // ============================================================

  // ✅ Login via Supabase (JWT sécurisé, vérifié côté serveur)
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError) throw loginError;
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      throw err;
    }
  };

  // ✅ Logout complet côté serveur
  const logout = async () => {
    try {
      setError(null);
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) throw logoutError;

      // Nettoyage local
      setSession(null);
      setUser(null);
      setProfile(null);
      window.location.href = '/';
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      throw err;
    }
  };

  // ✅ Reset mot de passe par email
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (resetError) throw resetError;
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      throw err;
    }
  };

  // ✅ Mise à jour du mot de passe (hashé côté Supabase, jamais en clair)
  const updatePassword = async (newPassword: string) => {
    try {
      setError(null);
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        error,
        login,
        logout,
        resetPassword,
        updatePassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
