'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { getMovements, setMovements, getTemplates, saveTemplate } from '@/lib/firestore';
import { DEFAULT_MOVEMENTS, DEFAULT_TEMPLATES } from '@/lib/seedData';
import { MockFirestore } from '@/lib/mockFirestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInAsGuest: () => void;
  logout: () => Promise<void>;
  isDemoMode: boolean;
  seedInitialData: () => Promise<void>;
  seedInitialTemplates: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signInAsGuest: () => {},
  logout: async () => {},
  isDemoMode: false,
  seedInitialData: async () => {},
  seedInitialTemplates: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for redirect result in case popup was blocked/fallback used
    getRedirectResult(auth).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // If we have a real user, it overrides demo mode
      if (currentUser) {
        setUser(currentUser);
        setIsDemoMode(false);
        localStorage.removeItem('gym_logger_demo_user');
      } else {
        // Check for persisted demo user
        const savedDemo = localStorage.getItem('gym_logger_demo_user');
        if (savedDemo) {
          setUser(JSON.parse(savedDemo));
          setIsDemoMode(true);
        } else {
          setUser(null);
          setIsDemoMode(false);
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const seedInitialTemplates = async () => {
    if (!user) return;
    try {
      const templates = isDemoMode 
        ? await MockFirestore.getTemplates(user.uid)
        : await getTemplates(user.uid);
        
      if (templates.length === 0) {
        for (const t of DEFAULT_TEMPLATES) {
          if (isDemoMode) {
            await MockFirestore.saveTemplate(user.uid, t);
          } else {
            await saveTemplate(user.uid, t);
          }
        }
      }
    } catch (error) {
      console.error('Failed to seed default templates:', error);
    }
  };

  const seedInitialData = async () => {
    if (!user) return;
    try {
      const movements = isDemoMode
        ? await MockFirestore.getMovements(user.uid)
        : await getMovements(user.uid);
        
      if (movements.length === 0) {
        if (isDemoMode) {
          await MockFirestore.setMovements(user.uid, DEFAULT_MOVEMENTS);
        } else {
          await setMovements(user.uid, DEFAULT_MOVEMENTS);
        }
      }
      await seedInitialTemplates();
    } catch (error) {
      console.error('Failed to seed default data:', error);
    }
  };

  useEffect(() => {
    if (user && !loading) {
      seedInitialData();
    }
  }, [user, loading]);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
      } else if (error instanceof Error && error.message.includes('popup')) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        throw error;
      }
    }
  };

  const signInAsGuest = () => {
    const demoUser = {
      uid: 'demo-user-123',
      displayName: 'Demo Athlete',
      email: 'demo@example.com',
      photoURL: null,
    } as unknown as User;
    
    setUser(demoUser);
    setIsDemoMode(true);
    localStorage.setItem('gym_logger_demo_user', JSON.stringify(demoUser));
  };

  const logout = async () => {
    if (isDemoMode) {
      setUser(null);
      setIsDemoMode(false);
      localStorage.removeItem('gym_logger_demo_user');
    } else {
      await signOut(auth);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInAsGuest, logout, isDemoMode, seedInitialData, seedInitialTemplates }}>
      {children}
    </AuthContext.Provider>
  );
}
