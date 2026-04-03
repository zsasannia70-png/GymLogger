'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useSettings } from './SettingsContext';

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useSettings();

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      
      const isDark = 
        settings.theme === 'dark' || 
        (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    };

    applyTheme();

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [settings.theme]);

  return <ThemeContext.Provider value={{}}>{children}</ThemeContext.Provider>;
};
