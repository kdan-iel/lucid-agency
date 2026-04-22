import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { fetchProfileByUserId, updateProfileRecord } from '../utils/remoteFunctions';
import { runWithAsyncGuard, toErrorMessage } from '../utils/asyncTools';

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
  tarif_jour?: number;
  onboarding_completed?: boolean;
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
  const mountedRef = useRef(true);
  const profileRequestRef = useRef(0);

  const getProfileByUserId = async (userId: string): Promise<Profile | null> => {
    try {
      const data = await runWithAsyncGuard(
        'auth.fetchProfile',
        () => fetchProfileByUserId(userId),
        {
          fallbackMessage: 'Impossible de récupérer le profil utilisateur.',
          metadata: { userId },
        }
      );
      return (data as Profile) ?? null;
    } catch (err) {
      console.error('[Auth] fetchProfile error', {
        userId,
        message: toErrorMessage(err),
      });
      return null;
    }
  };

  const syncProfile = async (userId: string | null) => {
    const requestId = ++profileRequestRef.current;

    if (!userId) {
      if (mountedRef.current) {
        setProfile(null);
      }
      return null;
    }

    const nextProfile = await getProfileByUserId(userId);
    if (!mountedRef.current || requestId !== profileRequestRef.current) {
      return null;
    }

    setProfile(nextProfile);
    return nextProfile;
  };

  useEffect(() => {
    mountedRef.current = true;

    const initAuth = async () => {
      setLoading(true);

      try {
        const {
          data: { session: nextSession },
          error: sessionError,
        } = await runWithAsyncGuard('auth.getSession', () => supabase.auth.getSession(), {
          fallbackMessage: 'Impossible de vérifier votre session.',
        });

        if (sessionError) {
          throw sessionError;
        }

        if (!mountedRef.current) return;

        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        await syncProfile(nextSession?.user?.id ?? null);
      } catch (err) {
        const message = toErrorMessage(err, 'Impossible d’initialiser la session.');
        console.error('[Auth] init error', { message });
        if (mountedRef.current) {
          setError(message);
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    void initAuth();

    let authEventCounter = 0;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      authEventCounter += 1;
      const eventId = authEventCounter;
      // console.info('[Auth] state change', {
      //   event: _event,
      //   hasSession: Boolean(nextSession),
      // });

      if (!mountedRef.current) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      void (async () => {
        if (!nextSession?.user) {
          profileRequestRef.current += 1;
          if (mountedRef.current) {
            setProfile(null);
          }
          return;
        }

        const nextProfile = await getProfileByUserId(nextSession.user.id);
        if (!mountedRef.current || eventId !== authEventCounter) {
          return;
        }

        setProfile(nextProfile);
      })();
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<Profile> => {
    try {
      setError(null);
      const nextProfile = await runWithAsyncGuard(
        'auth.login',
        async () => {
          const {
            data: { user: loggedUser, session: nextSession },
            error: signInError,
          } = await supabase.auth.signInWithPassword({ email, password });

          if (signInError) throw signInError;
          if (!loggedUser) throw new Error('Utilisateur introuvable.');

          const fetchedProfile = await getProfileByUserId(loggedUser.id);
          if (!fetchedProfile) throw new Error('Profil introuvable pour ce compte.');

          if (mountedRef.current) {
            setSession(nextSession);
            setUser(loggedUser);
            setProfile(fetchedProfile);
          }

          return fetchedProfile;
        },
        {
          fallbackMessage: 'La connexion a expiré. Veuillez réessayer.',
          metadata: { email },
        }
      );

      if (!nextProfile) throw new Error('Profil introuvable pour ce compte.');
      return nextProfile;
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await runWithAsyncGuard('auth.logout', async () => {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
      });
      setSession(null);
      setUser(null);
      setProfile(null);
      window.location.href = '/';
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await runWithAsyncGuard(
        'auth.resetPassword',
        async () => {
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });
          if (resetError) throw resetError;
        },
        {
          fallbackMessage: 'Le lien de réinitialisation n’a pas pu être envoyé.',
          metadata: { email },
        }
      );
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      setError(null);
      await runWithAsyncGuard(
        'auth.updatePassword',
        async () => {
          const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
          if (updateError) throw updateError;
        },
        {
          fallbackMessage: 'La mise à jour du mot de passe a expiré.',
        }
      );
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      setError(null);
      if (!profile) throw new Error('Aucun profil chargé');
      const nextProfile = await runWithAsyncGuard(
        'auth.updateProfile',
        () => updateProfileRecord(profile.user_id, updates),
        {
          fallbackMessage: 'La mise à jour du profil a expiré.',
          metadata: { userId: profile.user_id },
        }
      );
      setProfile(nextProfile as Profile);
    } catch (err) {
      setError(toErrorMessage(err));
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
