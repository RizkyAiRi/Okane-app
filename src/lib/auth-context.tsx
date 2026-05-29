'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signInWithGuest: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchProfile(user.id);
      }
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) return { error: error.message };

    // Create profile
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        language: 'id',
        theme: 'system',
      });
      await seedDefaultCategories(data.user.id);
    }

    return { error: null };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signInWithGuest = async () => {
    // Generate random guest email
    const uuid = crypto.randomUUID().substring(0, 8);
    const guestEmail = `guest_${uuid}@okane.app`;
    const guestPassword = crypto.randomUUID();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: guestEmail,
      password: guestPassword,
      options: { data: { full_name: `Guest ${uuid}` } },
    });

    if (signUpError) return { error: signUpError.message };

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: `Guest ${uuid}`,
        language: 'id',
        theme: 'system',
        is_guest: true
      });
      await seedDefaultCategories(data.user.id);
    }

    return { error: null };
  };

  const seedDefaultCategories = async (userId: string) => {
    const defaultCategories = [
      // Income
      { user_id: userId, name: 'Gaji', type: 'income', icon: '💰', color: '#10b981', is_default: true },
      { user_id: userId, name: 'Freelance', type: 'income', icon: '💼', color: '#6366f1', is_default: true },
      { user_id: userId, name: 'Investasi', type: 'income', icon: '📈', color: '#f59e0b', is_default: true },
      { user_id: userId, name: 'Hadiah', type: 'income', icon: '🎁', color: '#ec4899', is_default: true },
      { user_id: userId, name: 'Lainnya', type: 'income', icon: '💵', color: '#8b5cf6', is_default: true },
      // Expense
      { user_id: userId, name: 'Makanan & Minuman', type: 'expense', icon: '🍔', color: '#ef4444', is_default: true },
      { user_id: userId, name: 'Transportasi', type: 'expense', icon: '🚗', color: '#f97316', is_default: true },
      { user_id: userId, name: 'Belanja', type: 'expense', icon: '🛒', color: '#ec4899', is_default: true },
      { user_id: userId, name: 'Tagihan & Utilitas', type: 'expense', icon: '💡', color: '#06b6d4', is_default: true },
      { user_id: userId, name: 'Hiburan', type: 'expense', icon: '🎮', color: '#8b5cf6', is_default: true },
      { user_id: userId, name: 'Kesehatan', type: 'expense', icon: '🏥', color: '#14b8a6', is_default: true },
      { user_id: userId, name: 'Pendidikan', type: 'expense', icon: '📚', color: '#6366f1', is_default: true },
      { user_id: userId, name: 'Lainnya', type: 'expense', icon: '💵', color: '#64748b', is_default: true },
    ];

    await supabase.from('categories').insert(defaultCategories);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = '/login';
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithGuest,
        signOut,
        refreshProfile,
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
