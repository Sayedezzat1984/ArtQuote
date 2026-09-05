// Powered by OnSpace.AI
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, ADMIN_EMAIL } from '@/services/firebase';

// ─── Types ──────────────────────────────────────────────────────────────────
export type AppMode = 'loading' | 'admin' | 'client' | 'unauthenticated';

interface AuthContextType {
  user: User | null;
  appMode: AppMode;
  isAdmin: boolean;
  isClient: boolean;
  authError: string;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterClientMode: () => void;
  exitClientMode: () => void;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appMode, setAppMode] = useState<AppMode>('loading');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Logged in user — check if admin
        if (firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          setAppMode('admin');
        } else {
          // Non-admin firebase user → client mode
          setAppMode('client');
        }
      } else {
        // No firebase session — keep current mode if client, else unauthenticated
        setAppMode(prev => (prev === 'client' ? 'client' : 'unauthenticated'));
      }
    });
    return () => unsub();
  }, []);

  async function signIn(email: string, password: string) {
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // onAuthStateChanged handles setAppMode
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setAuthError('كلمة المرور غير صحيحة');
      } else if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        setAuthError('البريد الإلكتروني غير مسجل');
      } else if (code === 'auth/too-many-requests') {
        setAuthError('محاولات كثيرة — حاول لاحقاً');
      } else if (code === 'auth/network-request-failed') {
        setAuthError('لا يوجد اتصال بالإنترنت');
      } else {
        setAuthError('خطأ في تسجيل الدخول، حاول مجدداً');
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function signOut() {
    try {
      await firebaseSignOut(auth);
      // Route back to guest/visitor start screen
      setAppMode('client');
    } catch {}
  }

  function enterClientMode() {
    setAppMode('client');
  }

  function exitClientMode() {
    setAppMode(user ? (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'client') : 'unauthenticated');
  }

  async function resetPassword(email: string) {
    setAuthLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } finally {
      setAuthLoading(false);
    }
  }

  function clearError() { setAuthError(''); }

  const isAdmin = appMode === 'admin';
  const isClient = appMode === 'client';

  return (
    <AuthContext.Provider value={{
      user, appMode, isAdmin, isClient,
      authError, authLoading,
      signIn, signOut, enterClientMode, exitClientMode,
      resetPassword, clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
