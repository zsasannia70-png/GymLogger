'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { UserSettings } from '@/types';
import { getUserSettings, saveUserSettings } from '@/lib/firestore';

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
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  useEffect(() => {
    if (user) {
      getUserSettings(user.uid).then(setSettings).catch(console.error);
    } else {
      setSettings(defaultSettings);
    }
  }, [user]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const nextSettings = { ...settings, ...newSettings };
    setSettings(nextSettings);
    if (user) {
      await saveUserSettings(user.uid, newSettings);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
