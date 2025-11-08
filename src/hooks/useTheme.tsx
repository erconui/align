import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { Colors, ThemeName } from '../constants/theme';

interface ThemeContextValue {
  theme: ThemeName;
  colors: typeof Colors.light;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const system = Appearance.getColorScheme();
  const [theme, setThemeState] = useState<ThemeName>(system === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    const sub = Appearance.addChangeListener(({colorScheme}) => {
      // By default, keep following system; if user toggles manually we'll keep their choice.
      // Here we only change if current theme matches previous system (naive approach).
      // For now, don't override manual choice.
    });
    return () => sub.remove();
  }, []);

  const setTheme = (t: ThemeName) => setThemeState(t);

  const toggleTheme = () => setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));

  const colors = useMemo(() => (theme === 'dark' ? Colors.dark : Colors.dark), [theme]);

  return (
    <ThemeContext.Provider value={{theme, colors, setTheme, toggleTheme}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};
