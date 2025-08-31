import { useColorScheme as _useColorScheme } from 'react-native';
import { useThemeToggle } from './useThemeToggle';

export function useColorScheme() {
  const systemColorScheme = _useColorScheme();
  const { themeMode, isLoading } = useThemeToggle();

  if (isLoading) {
    return systemColorScheme;
  }

  if (themeMode === 'system') {
    return systemColorScheme;
  }

  return themeMode;
}
