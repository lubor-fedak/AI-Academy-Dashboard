'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import type { Participant, UserStatus } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  participant: Participant | null;
  isLoading: boolean;
  isAdmin: boolean;
  isActualAdmin: boolean; // True admin status (not affected by viewAsUser)
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

  // isAdmin returns false if admin is viewing as user
  const isAdmin = isActualAdmin && !viewAsUser;

  const supabase = getSupabaseClient();

  const fetchParticipant = async (githubUsername: string) => {
    const { data } = await supabase
      .from('participants')
      .select('*')
      .eq('github_username', githubUsername)
      .single();

    if (data) {
      setParticipant(data as Participant);
      setUserStatus((data as Participant).status || 'pending');
      setIsActualAdmin((data as Participant).is_admin || false);
    } else {
      setParticipant(null);
      setUserStatus('no_profile');
      setIsActualAdmin(false);
    }
  };

  const checkAdminUser = async (userId: string) => {
    // Check if user exists in admin_users table
    const { data } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (data) {
      setIsActualAdmin(true);
      setUserStatus('approved');
      return true;
    }
    return false;
  };

  const refreshParticipant = async () => {
    if (user?.user_metadata?.user_name) {
      await fetchParticipant(user.user_metadata.user_name);
    } else if (user?.id) {
      // For email-authenticated users, check admin_users table
      await checkAdminUser(user.id);
    }
  };

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();

      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);

        // Check if it's a GitHub user
        const githubUsername = initialSession.user.user_metadata?.user_name;
        if (githubUsername) {
          await fetchParticipant(githubUsername);
        } else {
          // Email user - check admin_users table
          await checkAdminUser(initialSession.user.id);
        }
      }

      setIsLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const githubUsername = newSession.user.user_metadata?.user_name;
          if (githubUsername) {
            await fetchParticipant(githubUsername);
          } else {
            // Email user - check admin_users table
            await checkAdminUser(newSession.user.id);
          }
        } else {
          setParticipant(null);
          setIsActualAdmin(false);
          setUserStatus(null);
        }

        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setParticipant(null);
    setIsActualAdmin(false);
    setUserStatus(null);
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error as Error | null };
  };

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
