import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { storageService } from '../services/storageService';
import { colors as lightColors } from './colors';

export const darkColors = {
  primary: '#0F2C59', // Marka laciverti (her iki modda sabit)
  primaryLight: '#3B82F6', // Karanlıkta daha parlak canlı mavi
  primarySoft: '#1E2A45', // Koyu yumuşak yüzeyler
  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F97316',
  background: '#0B0F19', // Derin gece mavisi / kömür
  card: '#151C2E', // Koyu cam kart
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  textLight: '#64748B',
  border: '#26314D',
  borderLight: '#1B2340',
  shadow: '#000000',
  statusBar: 'light',
  chatBg: '#0B0F19',
  brightBlue: '#60A5FA', // Karanlıkta okunur neonumsu mavi
  glassCard: 'rgba(21,28,46,0.97)', // Koyu cam modal
  glassBorder: 'rgba(255,255,255,0.12)',
};

export const lightTheme = {
  ...lightColors,
  statusBar: 'dark',
  chatBg: '#E9EFF7',
  brightBlue: '#1E4DB7',
  glassCard: 'rgba(255,255,255,0.97)',
  glassBorder: 'rgba(255,255,255,0.6)',
};

export const darkTheme = {
  ...darkColors,
};

const ThemeContext = createContext({
  mode: 'light',
  theme: lightTheme,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState(systemScheme === 'dark' ? 'dark' : 'light');

  // Açılışta kayıtlı tercihi yükle (yoksa sistem temasını kullan ve takip et)
  useEffect(() => {
    storageService.getThemeMode().then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setMode(saved);
      } else if (systemScheme === 'dark' || systemScheme === 'light') {
        setMode(systemScheme);
      }
    });
  }, [systemScheme]);

  const toggleTheme = useCallback(async () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    await storageService.setThemeMode(next);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      theme: mode === 'dark' ? darkTheme : lightTheme,
      toggleTheme,
    }),
    [mode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}