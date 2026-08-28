import React, { createContext, useContext, useState } from 'react';

export const typography = {
  fonts: {
    // `light` is referenced in a handful of styles but no light face is loaded,
    // so it resolved to undefined. Where those styles sit under a Paper <Text>
    // that was harmless — the family was inherited — but RecordingPlayerScreen
    // uses a plain RN <Text> with nothing to inherit from, so its sheet title
    // fell through to the system font. Pointing it at the regular face keeps
    // what the app has always actually rendered and removes the dead lookup.
    light: 'NotoSans_400Regular',
    regular: 'NotoSans_400Regular',
    medium: 'NotoSans_500Medium',
    semiBold: 'NotoSans_600SemiBold',
    bold: 'NotoSans_700Bold',
  },
  tabularNums: ['tabular-nums'] as const,
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 26,
    xxl: 34,
  }
} as any;

export type ColorTheme = {
  background: string;
  surface: string;
  surfaceLight: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  overlay: string;
  accentTeal: string;
  accentAmber: string;
  accentRed: string;
  statusGreen: string;
  /** Score ramp, low to high. A weak score reads as a pale green and a strong
   * one as deep forest. Anchored at three stops rather than blended between two
   * because a straight two-stop blend drifts through a brighter, yellower green
   * in the middle. */
  scoreRamp: string[];
};



export const lightTheme: ColorTheme = {
  // The page stays white; the raised surfaces carry a pale green wash instead of
  // a neutral grey, so panels read as tinted against the page the way a civic
  // portal tints its content areas. Kept far enough down in saturation that it
  // reads as a wash rather than a colour, and light enough that both text tones
  // keep their contrast on it.
  background: '#FFFFFF',
  surface: '#ECF5EF',
  surfaceLight: '#E2EFE5',
  textPrimary: '#000000',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  overlay: 'rgba(255, 255, 255, 0.8)',
  accentTeal: '#F97316',
  accentAmber: '#D97706', // amber-600 for better contrast on white
  accentRed: '#DC2626',
  statusGreen: '#059669',
  scoreRamp: ['#A3C9AE', '#5B9C6E', '#1E5233'],
};

type ThemeContextType = {
  theme: ColorTheme;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeContext.Provider value={{ theme: lightTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
