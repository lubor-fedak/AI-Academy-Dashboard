'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import type { Participant, UserStatus } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  participant: Participant | null;
  isLoading: boolean;
  isAdmin: boolean;
  isActualAdmin: boolean;
  viewAsUser: boolean;
  setViewAsUser: (value: boolean) => void;
  userStatus: UserStatus | 'no_profile' | null;
  signOut: () => Promise<void>;
  refreshParticipant: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  participant: null,
  isLoading: true,
  isAdmin: false,
  isActualAdmin: false,
  viewAsUser: false,
  setViewAsUser: () => {},
  userStatus: null,
  signOut: async () => {},
  refreshParticipant: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signInWithMagicLink: async () => ({ error: null }),
});

// Create Supabase client directly in component to avoid singleton issues
function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Session storage helpers
const AUTH_STORAGE_KEY = 'ai-academy-auth';

function saveAuthToStorage(user: User | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ userId: user.id, email: user.email }));
  } else {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function getAuthFromStorage(): { userId: string; email: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActualAdmin, setIsActualAdmin] = useState(false);
  const [viewAsUser, setViewAsUser] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus | 'no_profile' | null>(null);
  const [supabase] = useState(() => createClient());

  const isAdmin = isActualAdmin && !viewAsUser;

  // Fetch participant
  const fetchParticipant = useCallback(async (authUser: User): Promise<Participant | null> => {
    try {
      if (authUser.email) {
        const { data } = await supabase
          .from('participants')
          .select('*')
          .eq('email', authUser.email)
          .single();
        if (data) return data as Participant;
      }

      if (authUser.user_metadata?.user_name) {
        const { data } = await supabase
          .from('participants')
          .select('*')
          .eq('github_username', authUser.user_metadata.user_name)
          .single();
        if (data) return data as Participant;
      }

      const { data } = await supabase
        .from('participants')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();
      return data as Participant | null;
    } catch (error) {
      console.error('fetchParticipant error:', error);
      return null;
    }
  }, [supabase]);

  // Check admin status
  const checkAdminUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      return !!data;
    } catch {
      return false;
    }
  }, [supabase]);

  const refreshParticipant = useCallback(async () => {
    if (user) {
      const participantData = await fetchParticipant(user);
      if (participantData) {
        setParticipant(participantData);
        setUserStatus('approved');
        setIsActualAdmin(participantData.is_admin || false);
      }
    }
  }, [user, fetchParticipant]);

  // Load user data after we have a user
  const loadUserData = useCallback(async (authUser: User) => {
    try {
      const participantData = await fetchParticipant(authUser);
      if (participantData) {
        setParticipant(participantData);
        setUserStatus('approved');
        setIsActualAdmin(participantData.is_admin || false);
      } else {
        setUserStatus('no_profile');
      }

      const isAdminUser = await checkAdminUser(authUser.id);
      if (isAdminUser) {
        setIsActualAdmin(true);
        setUserStatus('approved');
      }
    } catch (e) {
      console.error('loadUserData error:', e);
      setUserStatus('approved'); // Assume approved if we can't check
    }
  }, [fetchParticipant, checkAdminUser]);

  useEffect(() => {
    console.log('[Auth] Initializing...');

    // Check if we might be logged in (from sessionStorage)
    const storedAuth = getAuthFromStorage();
    if (storedAuth) {
      console.log('[Auth] Found stored auth for:', storedAuth.email);
    }

    const initAuth = async () => {
      try {
        console.log('[Auth] Getting session...');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[Auth] getSession error:', error);
          setIsLoading(false);
          return;
        }

        if (initialSession?.user) {
          console.log('[Auth] Session found for:', initialSession.user.email);
          setSession(initialSession);
          setUser(initialSession.user);
          saveAuthToStorage(initialSession.user);
          setIsLoading(false);

          // Load additional data in background
          await loadUserData(initialSession.user);
        } else {
          console.log('[Auth] No session found');
          saveAuthToStorage(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[Auth] Init error:', error);
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] State change:', event, newSession?.user?.email);

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setParticipant(null);
          setIsActualAdmin(false);
          setUserStatus(null);
          saveAuthToStorage(null);
          return;
        }

        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          saveAuthToStorage(newSession.user);

          if (event === 'SIGNED_IN') {
            await loadUserData(newSession.user);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, loadUserData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setParticipant(null);
    setIsActualAdmin(false);
    setUserStatus(null);
    saveAuthToStorage(null);
  }, [supabase]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }, [supabase]);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error as Error | null };
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        participant,
        isLoading,
        isAdmin,
        isActualAdmin,
        viewAsUser,
        setViewAsUser,
        userStatus,
        signOut,
        refreshParticipant,
        signInWithEmail,
        signInWithMagicLink,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
