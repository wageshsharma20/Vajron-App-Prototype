import React, { createContext, useContext, useState } from 'react';

export const typography = {
  fonts: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
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
