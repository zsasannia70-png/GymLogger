'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { UserSettings } from '@/types';
import { getUserSettings, saveUserSettings } from '@/lib/firestore';
import { MockFirestore } from '@/lib/mockFirestore';

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
}

const defaultSettings: UserSettings = { unit: 'kg', theme: 'system' };

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, isDemoMode } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  useEffect(() => {
    if (user) {
      const fetchSettings = async () => {
        try {
          const data = isDemoMode 
            ? await MockFirestore.getUserSettings(user.uid)
            : await getUserSettings(user.uid);
          setSettings(data);
        } catch (err) {
          console.error('Error loading settings:', err);
        }
      };
      fetchSettings();
    } else {
      // Use a microtask to avoid "synchronous setState in effect" warning
      Promise.resolve().then(() => {
        setSettings(prev => {
          if (prev.unit === defaultSettings.unit && prev.theme === defaultSettings.theme) {
            return prev;
          }
          return defaultSettings;
        });
      });
    }
  }, [user, isDemoMode]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const nextSettings = { ...settings, ...newSettings };
    setSettings(nextSettings);
    if (user) {
      try {
        if (isDemoMode) {
          await MockFirestore.saveUserSettings(user.uid, newSettings);
        } else {
          await saveUserSettings(user.uid, newSettings);
        }
      } catch (err) {
        console.error('Error saving settings:', err);
      }
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
