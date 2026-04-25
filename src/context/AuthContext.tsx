import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { getPasswordUpdateRedirectUrl } from '../utils/authRedirect';
import { runWithAsyncGuard, toErrorMessage } from '../utils/asyncTools';
import {
  createPublicError,
  isInvalidSessionError,
  subscribeToInvalidSession,
  toUserSafeMessage,
} from '../utils/authSession';

const PROFILE_COLUMNS = 'id, user_id, email, full_name, role, avatar_url';
const FREELANCER_COLUMNS =
  'id, user_id, statut, phone_number, tarif_jour, bio, specialite, portfolio_url, onboarding_completed, archived_at';
const PASSWORD_UPDATE_PATH = '/update-password';
const AUTH_HYDRATION_GRACE_MS = 1500;

function shouldDelayInitialHydration() {
  if (typeof window === 'undefined') return false;

  return (
    window.location.pathname === PASSWORD_UPDATE_PATH &&
    Boolean(window.location.search || window.location.hash)
  );
}

function scrubPasswordUpdateUrl() {
  if (typeof window === 'undefined') return;
  if (window.location.pathname !== PASSWORD_UPDATE_PATH) return;
  if (!window.location.search && !window.location.hash) return;

  window.history.replaceState({}, document.title, PASSWORD_UPDATE_PATH);
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'freelancer' | 'client';
  avatar_url?: string | null;
}

export interface Freelancer {
  id: string;
  user_id: string;
  statut: 'pending' | 'validated' | 'rejected' | 'suspended';
  phone_number: string | null;
  tarif_jour: number | null;
  bio: string | null;
  specialite: string | null;
  portfolio_url?: string | null;
  onboarding_completed: boolean;
  archived_at: string | null;
}

export interface LoginResult {
  profile: Profile;
  freelancer: Freelancer | null;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  freelancer: Freelancer | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  forceLogout: (reason?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updateFreelancer: (updates: Partial<Freelancer>) => Promise<void>;
  refreshAuthState: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [freelancer, setFreelancer] = useState<Freelancer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const authRequestRef = useRef(0);
  const logoutInFlightRef = useRef(false);

  const clearAuthState = () => {
    authRequestRef.current += 1;
    if (!mountedRef.current) return;

    setSession(null);
    setUser(null);
    setProfile(null);
    setFreelancer(null);
  };

  const clearPersistedSessionArtifacts = () => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('supabase.auth.token');

      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key) continue;
        if (!key.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
        localStorage.removeItem(key);
        index -= 1;
      }

      sessionStorage.clear();
    } catch {
      // Storage access can fail in hardened browser contexts.
    }
  };

  const clearAuthStateWithoutRedirect = () => {
    clearAuthState();
    if (mountedRef.current) {
      setError(null);
    }
  };

  const forceLogout = async (reason = 'invalid_session') => {
    clearAuthState();
    if (mountedRef.current) {
      setLoading(false);
      setError(null);
    }

    if (logoutInFlightRef.current) {
      window.location.replace('/login');
      return;
    }

    logoutInFlightRef.current = true;

    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
    } catch (error) {
      console.error('[Auth] force logout signOut failure', {
        reason,
        message: toErrorMessage(error),
      });

      try {
        const { error: localSignOutError } = await supabase.auth.signOut({ scope: 'local' });
        if (localSignOutError) throw localSignOutError;
      } catch (localError) {
        console.error('[Auth] force logout local signOut failure', {
          reason,
          message: toErrorMessage(localError),
        });
      }
    } finally {
      logoutInFlightRef.current = false;
      clearPersistedSessionArtifacts();
      window.location.replace('/login');
    }
  };

  const handleInvalidSession = async (operation: string, candidate: unknown) => {
    if (!isInvalidSessionError(candidate)) {
      return false;
    }

    console.error(`[Auth] invalid session detected during ${operation}`, {
      message: toErrorMessage(candidate),
    });
    await forceLogout('invalid_session');
    return true;
  };

  const getProfileByUserId = async (userId: string): Promise<Profile | null> => {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    return (data as Profile | null) ?? null;
  };

  const getFreelancerByUserId = async (userId: string): Promise<Freelancer | null> => {
    const { data, error: freelancerError } = await supabase
      .from('freelancers')
      .select(FREELANCER_COLUMNS)
      .eq('user_id', userId)
      .maybeSingle();

    if (freelancerError) {
      throw freelancerError;
    }

    return (data as Freelancer | null) ?? null;
  };

  const syncAuthState = async (userId: string | null) => {
    const requestId = ++authRequestRef.current;

    if (!userId) {
      if (mountedRef.current) {
        setProfile(null);
        setFreelancer(null);
      }
      return { profile: null, freelancer: null };
    }

    try {
      const nextProfile = await runWithAsyncGuard(
        'auth.fetchProfile',
        () => getProfileByUserId(userId),
        {
          fallbackMessage: 'Impossible de récupérer le profil utilisateur.',
          metadata: { userId },
        }
      );

      let nextFreelancer: Freelancer | null = null;
      if (nextProfile?.role === 'freelancer') {
        nextFreelancer = await runWithAsyncGuard(
          'auth.fetchFreelancer',
          () => getFreelancerByUserId(userId),
          {
            fallbackMessage: 'Impossible de récupérer les informations freelancer.',
            metadata: { userId },
          }
        );
      }

      if (!mountedRef.current || requestId !== authRequestRef.current) {
        return { profile: null, freelancer: null };
      }

      setProfile(nextProfile);
      setFreelancer(nextFreelancer);

      return { profile: nextProfile, freelancer: nextFreelancer };
    } catch (err) {
      if (await handleInvalidSession('syncAuthState', err)) {
        return { profile: null, freelancer: null };
      }
      if (mountedRef.current && requestId === authRequestRef.current) {
        setProfile(null);
        setFreelancer(null);
      }
      throw err;
    }
  };

  const refreshAuthState = async () => {
    await syncAuthState(user?.id ?? session?.user?.id ?? null);
  };

  useEffect(() => {
    mountedRef.current = true;
    let initialHydrationSettled = false;
    let hydrationTimer: ReturnType<typeof setTimeout> | null = null;

    const clearHydrationTimer = () => {
      if (!hydrationTimer) return;
      clearTimeout(hydrationTimer);
      hydrationTimer = null;
    };

    const settleInitialHydration = () => {
      if (!mountedRef.current || initialHydrationSettled) return;

      initialHydrationSettled = true;
      clearHydrationTimer();
      scrubPasswordUpdateUrl();
      setLoading(false);
    };

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

        let verifiedSession = nextSession;

        if (nextSession) {
          try {
            const {
              data: { user: verifiedUser },
              error: getUserError,
            } = await runWithAsyncGuard('auth.getUser', () => supabase.auth.getUser(), {
              fallbackMessage: 'Impossible de valider votre session.',
            });

            if (getUserError) {
              throw getUserError;
            }

            if (!verifiedUser) {
              throw new Error('Utilisateur de session introuvable.');
            }
          } catch (validationError) {
            console.error('[Auth] init session validation failure', {
              message: toErrorMessage(validationError),
            });

            try {
              const { error: localSignOutError } = await supabase.auth.signOut({ scope: 'local' });
              if (localSignOutError) throw localSignOutError;
            } catch (localError) {
              console.error('[Auth] init local signOut failure', {
                message: toErrorMessage(localError),
              });
            }

            clearPersistedSessionArtifacts();
            clearAuthStateWithoutRedirect();
            verifiedSession = null;
          }
        }

        if (!mountedRef.current) return;

        setSession(verifiedSession);
        setUser(verifiedSession?.user ?? null);
        await syncAuthState(verifiedSession?.user?.id ?? null);

        if (verifiedSession || !shouldDelayInitialHydration()) {
          settleInitialHydration();
          return;
        }

        hydrationTimer = setTimeout(() => {
          if (!mountedRef.current) return;

          clearAuthState();
          settleInitialHydration();
        }, AUTH_HYDRATION_GRACE_MS);
      } catch (err) {
        if (await handleInvalidSession('initAuth', err)) {
          settleInitialHydration();
          return;
        }

        const message = toErrorMessage(err, 'Impossible d’initialiser la session.');
        console.error('[Auth] init error', { message });
        if (mountedRef.current) {
          setError(toUserSafeMessage(err, 'Une erreur est survenue. Veuillez réessayer.'));
          clearAuthState();
        }
        settleInitialHydration();
      } finally {
        if (!shouldDelayInitialHydration()) {
          settleInitialHydration();
        }
      }
    };

    void initAuth();
    const unsubscribeInvalidSession = subscribeToInvalidSession((reason) => {
      void forceLogout(reason ?? 'invalid_session');
    });

    let authEventCounter = 0;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      authEventCounter += 1;
      const eventId = authEventCounter;

      if (!mountedRef.current) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession) {
        clearAuthStateWithoutRedirect();
        if (event === 'SIGNED_OUT' || !shouldDelayInitialHydration()) {
          settleInitialHydration();
        }
        return;
      }

      void (async () => {
        try {
          setError(null);
          const hydrated = await syncAuthState(nextSession?.user?.id ?? null);
          if (!mountedRef.current || eventId !== authEventCounter) return;

          if (!nextSession?.user) {
            setProfile(null);
            setFreelancer(null);
            if (event === 'SIGNED_OUT' || !shouldDelayInitialHydration()) {
              settleInitialHydration();
            }
            return;
          }

          setProfile(hydrated.profile);
          setFreelancer(hydrated.freelancer);
          settleInitialHydration();
        } catch (err) {
          if (await handleInvalidSession('onAuthStateChange', err)) {
            settleInitialHydration();
            return;
          }

          const message = toErrorMessage(err, 'Impossible de synchroniser la session.');
          console.error('[Auth] state sync failure', { message });
          if (mountedRef.current && eventId === authEventCounter) {
            setError(toUserSafeMessage(err, 'Une erreur est survenue. Veuillez réessayer.'));
            setProfile(null);
            setFreelancer(null);
          }
          settleInitialHydration();
        }
      })();
    });

    const sessionCheckInterval = window.setInterval(() => {
      if (!mountedRef.current || logoutInFlightRef.current) return;

      void (async () => {
        try {
          const {
            data: { session: currentSession },
            error: currentSessionError,
          } = await supabase.auth.getSession();

          if (!mountedRef.current || logoutInFlightRef.current) return;

          if (currentSessionError) {
            throw currentSessionError;
          }

          if (!currentSession) {
            clearAuthStateWithoutRedirect();
            return;
          }

          const {
            data: { user: currentUser },
            error: currentUserError,
          } = await supabase.auth.getUser();

          if (!mountedRef.current || logoutInFlightRef.current) return;

          if (currentUserError) {
            throw currentUserError;
          }

          if (!currentUser) {
            throw new Error('Utilisateur de session introuvable.');
          }
        } catch (sessionCheckError) {
          console.error('[Auth] periodic session check failure', {
            message: toErrorMessage(sessionCheckError),
          });

          try {
            const { error: localSignOutError } = await supabase.auth.signOut({ scope: 'local' });
            if (localSignOutError) throw localSignOutError;
          } catch (localError) {
            console.error('[Auth] periodic local signOut failure', {
              message: toErrorMessage(localError),
            });
          }

          clearPersistedSessionArtifacts();
          clearAuthStateWithoutRedirect();
        }
      })();
    }, 60_000);

    return () => {
      mountedRef.current = false;
      clearHydrationTimer();
      clearInterval(sessionCheckInterval);
      unsubscribeInvalidSession();
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      setError(null);

      const result = await runWithAsyncGuard(
        'auth.login',
        async () => {
          const {
            data: { user: loggedUser, session: nextSession },
            error: signInError,
          } = await supabase.auth.signInWithPassword({ email, password });

          if (signInError) throw signInError;
          if (!loggedUser || !nextSession) throw new Error('Utilisateur introuvable.');

          const nextProfile = await getProfileByUserId(loggedUser.id);
          if (!nextProfile) {
            throw createPublicError('Impossible de charger votre compte.', {
              debugMessage: 'Profil introuvable pour ce compte.',
            });
          }

          let nextFreelancer: Freelancer | null = null;
          if (nextProfile.role === 'freelancer') {
            nextFreelancer = await getFreelancerByUserId(loggedUser.id);
            if (!nextFreelancer) {
              throw createPublicError('Impossible de charger votre compte.', {
                debugMessage: 'Aucune candidature freelancer associée à ce compte.',
              });
            }
          }

          if (mountedRef.current) {
            setSession(nextSession);
            setUser(loggedUser);
            setProfile(nextProfile);
            setFreelancer(nextFreelancer);
          }

          return {
            profile: nextProfile,
            freelancer: nextFreelancer,
          };
        },
        {
          fallbackMessage: 'La connexion a expiré. Veuillez réessayer.',
          metadata: { email },
        }
      );

      return result;
    } catch (err) {
      if (await handleInvalidSession('login', err)) {
        throw createPublicError('Votre session est invalide. Veuillez vous reconnecter.', {
          debugMessage: toErrorMessage(err),
          status: 401,
        });
      }

      if (
        err &&
        typeof err === 'object' &&
        'publicMessage' in err &&
        typeof (err as Error & { publicMessage?: string }).publicMessage === 'string'
      ) {
        await forceLogout('invalid_account');
      }

      setError(toUserSafeMessage(err, 'Une erreur est survenue. Veuillez réessayer.'));
      throw err;
    }
  };

  const logout = async () => {
    await forceLogout('manual_logout');
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await runWithAsyncGuard(
        'auth.resetPassword',
        async () => {
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: getPasswordUpdateRedirectUrl(),
          });
          if (resetError) throw resetError;
        },
        {
          fallbackMessage: 'Le lien de réinitialisation n’a pas pu être envoyé.',
          metadata: { email },
        }
      );
    } catch (err) {
      if (await handleInvalidSession('resetPassword', err)) {
        throw createPublicError('Votre session est invalide. Veuillez vous reconnecter.', {
          debugMessage: toErrorMessage(err),
          status: 401,
        });
      }
      setError(toUserSafeMessage(err, 'Une erreur est survenue. Veuillez réessayer.'));
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
      if (await handleInvalidSession('updatePassword', err)) {
        throw createPublicError('Votre session est invalide. Veuillez vous reconnecter.', {
          debugMessage: toErrorMessage(err),
          status: 401,
        });
      }
      setError(toUserSafeMessage(err, 'Une erreur est survenue. Veuillez réessayer.'));
      throw err;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      setError(null);
      if (!profile) throw new Error('Aucun profil chargé');

      const allowedUpdates: Partial<Profile> = {};

      if ('full_name' in updates) {
        allowedUpdates.full_name = updates.full_name ?? null;
      }

      if ('avatar_url' in updates) {
        allowedUpdates.avatar_url = updates.avatar_url ?? null;
      }

      const { data, error: updateError } = await runWithAsyncGuard(
        'auth.updateProfile',
        async () =>
          supabase
            .from('profiles')
            .update(allowedUpdates)
            .eq('user_id', profile.user_id)
            .select(PROFILE_COLUMNS)
            .single(),
        {
          fallbackMessage: 'La mise à jour du profil a expiré.',
          metadata: { userId: profile.user_id },
        }
      );

      if (updateError) throw updateError;
      setProfile(data as Profile);
    } catch (err) {
      if (await handleInvalidSession('updateProfile', err)) {
        throw createPublicError('Votre session est invalide. Veuillez vous reconnecter.', {
          debugMessage: toErrorMessage(err),
          status: 401,
        });
      }
      setError(toUserSafeMessage(err, 'Une erreur est survenue. Veuillez réessayer.'));
      throw err;
    }
  };

  const updateFreelancer = async (updates: Partial<Freelancer>) => {
    try {
      setError(null);
      if (!profile || profile.role !== 'freelancer' || !freelancer) {
        throw new Error('Aucun profil freelancer chargé');
      }

      const allowedUpdates: Partial<Freelancer> = {};

      if ('phone_number' in updates) {
        allowedUpdates.phone_number = updates.phone_number ?? null;
      }
      if ('tarif_jour' in updates) {
        allowedUpdates.tarif_jour = updates.tarif_jour ?? null;
      }
      if ('bio' in updates) {
        allowedUpdates.bio = updates.bio ?? null;
      }
      if ('specialite' in updates) {
        allowedUpdates.specialite = updates.specialite ?? null;
      }
      if ('portfolio_url' in updates) {
        allowedUpdates.portfolio_url = updates.portfolio_url ?? null;
      }
      if ('onboarding_completed' in updates) {
        allowedUpdates.onboarding_completed = Boolean(updates.onboarding_completed);
      }
      if ('statut' in updates && updates.statut) {
        allowedUpdates.statut = updates.statut;
      }
      if ('archived_at' in updates) {
        allowedUpdates.archived_at = updates.archived_at ?? null;
      }

      const { data, error: updateError } = await runWithAsyncGuard(
        'auth.updateFreelancer',
        async () =>
          supabase
            .from('freelancers')
            .update(allowedUpdates)
            .eq('user_id', profile.user_id)
            .select(FREELANCER_COLUMNS)
            .single(),
        {
          fallbackMessage: 'La mise à jour du profil freelancer a expiré.',
          metadata: { userId: profile.user_id },
        }
      );

      if (updateError) throw updateError;
      setFreelancer(data as Freelancer);
    } catch (err) {
      if (await handleInvalidSession('updateFreelancer', err)) {
        throw createPublicError('Votre session est invalide. Veuillez vous reconnecter.', {
          debugMessage: toErrorMessage(err),
          status: 401,
        });
      }
      setError(toUserSafeMessage(err, 'Une erreur est survenue. Veuillez réessayer.'));
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
        freelancer,
        loading,
        error,
        login,
        logout,
        forceLogout,
        resetPassword,
        updatePassword,
        updateProfile,
        updateFreelancer,
        refreshAuthState,
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
