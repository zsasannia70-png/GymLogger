'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { getMovements, setMovements, getTemplates, saveTemplate } from '@/lib/firestore';
import { DEFAULT_MOVEMENTS, DEFAULT_TEMPLATES } from '@/lib/seedData';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for redirect result in case popup was blocked/fallback used
    getRedirectResult(auth).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Check if seeded
          const movements = await getMovements(currentUser.uid);
          if (movements.length === 0) {
            await setMovements(currentUser.uid, DEFAULT_MOVEMENTS);
          }
          const templates = await getTemplates(currentUser.uid);
          if (templates.length === 0) {
            for (const t of DEFAULT_TEMPLATES) {
              await saveTemplate(currentUser.uid, t);
            }
          }
        } catch (error) {
          console.error('Failed to seed default data:', error);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked' || error.message.includes('popup')) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        throw error;
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
