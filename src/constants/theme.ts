/**
 * Central color tokens for the app. Modeled after the example app's theme.
 */
import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    popupBackground: '#bfb8daff',
    progressBackground: '#746f85ff',
    tint: tintColorLight,
    icon: '#687076',
    border: '#e6e6e6',
    surface: '#ffffff',
    muted: '#6B7280',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    button: '#07ce00ff',
    buttonBorder: '#036300ff',
    delete: '#ce0000ff',
    deleteBorder: '#630000ff',
    highlight: '#09ff00ff',
  },
  dark: {
    text: '#eceeecff',
    background: '#0f120fff',
    popupBackground: '#374737ff',
    progressBackground: '#37473743',
    tint: tintColorDark,
    icon: '#9ba69dff',
    border: '#222425',
    surface: '#222b24ff',
    muted: '#9ba69dff',
    tabIconDefault: '#9ba69bff',
    tabIconSelected: tintColorDark,
    button: '#00550bff',
    delete: '#550000ff',
    deleteBorder: '#8f0000ff',
    buttonBorder: '#008f0cff',
    highlight: '#00c030ff',
  },
};

export const styles = {
  header: {
    ...Platform.select({
      android: { paddingTop: 40 }
    }),
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,

  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export type ThemeName = 'light' | 'dark';
