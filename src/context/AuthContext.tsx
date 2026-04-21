import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { fetchProfileByUserId, updateProfileRecord } from '../utils/remoteFunctions';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'freelancer' | 'client';
  avatar_url?: string;
  bio?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<Profile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getProfileByUserId = async (userId: string): Promise<Profile | null> => {
    try {
      const data = await fetchProfileByUserId(userId);
      return (data as Profile) ?? null;
    } catch (err) {
      console.error('fetchProfile error:', err);
      return null;
    }
  };

  const fetchProfile = async (userId: string) => {
    const nextProfile = await getProfileByUserId(userId);
    setProfile(nextProfile);
    return nextProfile;
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const {
          data: { session: s },
          error: e,
        } = await supabase.auth.getSession();
        if (e) throw e;
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) await fetchProfile(s.user.id);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setError(null);
      if (s?.user) await fetchProfile(s.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<Profile> => {
    try {
      setError(null);
      const {
        data: { user: loggedUser },
        error: e,
      } = await supabase.auth.signInWithPassword({ email, password });
      if (e) throw e;
      if (!loggedUser) throw new Error('Utilisateur introuvable.');

      const nextProfile = await getProfileByUserId(loggedUser.id);
      if (!nextProfile) throw new Error('Profil introuvable pour ce compte.');

      setProfile(nextProfile);
      return nextProfile;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      window.location.href = '/';
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (e) throw e;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      setError(null);
      const { error: e } = await supabase.auth.updateUser({ password: newPassword });
      if (e) throw e;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      setError(null);
      if (!profile) throw new Error('Aucun profil chargé');
      const nextProfile = await updateProfileRecord(profile.user_id, updates);
      setProfile(nextProfile as Profile);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const clearError = () => setError(null);

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
        updateProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
