import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export function useThemeToggle() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light'); // Default to light theme
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        setThemeMode(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async (newTheme: ThemeMode) => {
    try {
      setThemeMode(newTheme);
      await AsyncStorage.setItem('themeMode', newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  return {
    themeMode,
    toggleTheme,
    isLoading,
  };
} 