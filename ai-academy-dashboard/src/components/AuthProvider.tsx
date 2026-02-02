'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActualAdmin, setIsActualAdmin] = useState(false);
  const [viewAsUser, setViewAsUser] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus | 'no_profile' | null>(null);

  const authInitialized = useRef(false);
  const isAdmin = isActualAdmin && !viewAsUser;

  // Get supabase client safely
  const getClient = useCallback(() => {
    try {
      return getSupabaseClient();
    } catch (e) {
      console.error('Failed to get Supabase client:', e);
      return null;
    }
  }, []);

  // Fetch participant - simple version without abort
  const fetchParticipant = useCallback(async (authUser: User): Promise<Participant | null> => {
    const supabase = getClient();
    if (!supabase) return null;

    try {
      // Try email first
      if (authUser.email) {
        const { data } = await supabase
          .from('participants')
          .select('*')
          .eq('email', authUser.email)
          .single();
        if (data) return data as Participant;
      }

      // Try github_username
      if (authUser.user_metadata?.user_name) {
        const { data } = await supabase
          .from('participants')
          .select('*')
          .eq('github_username', authUser.user_metadata.user_name)
          .single();
        if (data) return data as Participant;
      }

      // Try auth_user_id
      const { data } = await supabase
        .from('participants')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();
      if (data) return data as Participant;

      return null;
    } catch (error) {
      console.error('fetchParticipant error:', error);
      return null;
    }
  }, [getClient]);

  // Check admin status
  const checkAdminUser = useCallback(async (userId: string): Promise<boolean> => {
    const supabase = getClient();
    if (!supabase) return false;

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
  }, [getClient]);

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

  useEffect(() => {
    if (authInitialized.current) return;
    authInitialized.current = true;

    const supabase = getClient();

    if (!supabase) {
      console.error('No Supabase client available');
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        // Get session - no timeout, just wait for it
        console.log('Getting session...');
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log('Session result:', initialSession ? 'found' : 'not found');

        // No session = not logged in
        if (!initialSession) {
          console.log('No session found');
          setIsLoading(false);
          return;
        }

        console.log('Session found, user:', initialSession.user.email);

        // Set user immediately to unblock UI
        setSession(initialSession);
        setUser(initialSession.user);
        setIsLoading(false); // UNBLOCK UI NOW

        // Load participant data in background (non-blocking)
        try {
          const participantData = await fetchParticipant(initialSession.user);

          if (participantData) {
            setParticipant(participantData);
            setUserStatus('approved');
            setIsActualAdmin(participantData.is_admin || false);

            // Link auth_user_id if needed
            if (!participantData.auth_user_id) {
              supabase
                .from('participants')
                .update({ auth_user_id: initialSession.user.id })
                .eq('id', participantData.id)
                .then(() => {});
            }
          } else {
            setUserStatus('no_profile');
          }

          // Check admin status
          const isAdminUser = await checkAdminUser(initialSession.user.id);
          if (isAdminUser) {
            setIsActualAdmin(true);
            setUserStatus('approved');
          }
        } catch (e) {
          console.error('Background data load error:', e);
          // Still keep user logged in even if participant fetch fails
          setUserStatus('approved');
        }

      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state change:', event);

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setParticipant(null);
          setIsActualAdmin(false);
          setUserStatus(null);
          return;
        }

        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);

          try {
            const participantData = await fetchParticipant(newSession.user);
            if (participantData) {
              setParticipant(participantData);
              setUserStatus('approved');
              setIsActualAdmin(participantData.is_admin || false);
            } else {
              setUserStatus('no_profile');
            }

            const isAdminUser = await checkAdminUser(newSession.user.id);
            if (isAdminUser) {
              setIsActualAdmin(true);
              setUserStatus('approved');
            }
          } catch (e) {
            console.error('Auth state change data load error:', e);
            setUserStatus('approved');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [getClient, fetchParticipant, checkAdminUser]);

  const signOut = useCallback(async () => {
    const supabase = getClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setParticipant(null);
    setIsActualAdmin(false);
    setUserStatus(null);
  }, [getClient]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const supabase = getClient();
    if (!supabase) return { error: new Error('Supabase not available') };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }, [getClient]);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const supabase = getClient();
    if (!supabase) return { error: new Error('Supabase not available') };

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error as Error | null };
  }, [getClient]);

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
