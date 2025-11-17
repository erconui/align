import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform, StyleSheet } from 'react-native';
import { Colors, ThemeName } from '../constants/theme';

interface ThemeContextValue {
  theme: ThemeName;
  colors: typeof Colors.light;
  styles: ReturnType<typeof createStyles>;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const createStyles = (colors: typeof Colors.light) => {
  const button = {
    backgroundColor: colors.button,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    color: colors.text

  };
  return StyleSheet.create({
    header: {
      ...Platform.select({
        android: { paddingTop: 40 },
        ios: { paddingTop: 20 } // optional iOS specific padding
      }),
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface
    },
    headerText: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 16,
      color: colors.text
    },
    settingsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      paddingBottom: 12,
    },
    container: { marginBottom: 6 },
    row: { flexDirection: "row", alignItems: "center", minHeight:40 },
    expand: {
      width: 24,
      alignItems: "center"
    },
    input: {
      flex: 1,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      color: colors.text,
      borderRadius: 6,
      marginHorizontal: 8
    },
    iconButton: {
      marginLeft: 6,
      marginRight: 10,
      backgroundColor: colors.background,
      color: colors.icon,
      borderRadius: 6
    },
    icon: {
      fontSize: 18,
      fontWeight: "600",
      padding: 4,
      color: colors.icon
    },
    children: { marginTop: 6 },
    checkboxContainer: {
      width: 26,
      paddingLeft: 26,
      alignItems: 'center',
      justifyContent: 'center'
    },
    buttons: { color: colors.text, fontSize: 20 },
    buttonText: {
      color: colors.background,
      textAlign: "center",
      fontWeight: '500'
    },
    pressableButton: button,
    pressableButtonPressed: {
      ...button,
      backgroundColor: colors.tint + '20', // 20% opacity
      // backgroundColor: colors.tint + '20' : 'transparent',
      borderRadius: 6,
      borderColor: colors.tint,
    },
    settingButton: {
      ...button,
      margin: 2
    }
  })
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const system = Appearance.getColorScheme();
  const [theme, setThemeState] = useState<ThemeName>(system === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      // By default, keep following system; if user toggles manually we'll keep their choice.
      // Here we only change if current theme matches previous system (naive approach).
      // For now, don't override manual choice.
    });
    return () => sub.remove();
  }, []);

  const setTheme = (t: ThemeName) => setThemeState(t);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const colors = useMemo(() => (theme === 'dark' ? Colors.dark : Colors.light), [theme]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ThemeContext.Provider value={{ theme, colors, styles, setTheme, toggleTheme }}>
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
