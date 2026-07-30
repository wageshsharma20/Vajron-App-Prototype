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

export const darkTheme: ColorTheme = {
  background: '#121212', // Deep charcoal / near-black
  surface: '#2C2C2E',    // Slightly lighter charcoal cards
  surfaceLight: '#3A3A3C',
  textPrimary: '#FFFFFF', // High-contrast off-white
  textSecondary: '#A0A0A5', // Soft gray
  border: '#38383A',
  overlay: 'rgba(0, 0, 0, 0.6)',
  
  // Category colors
  accentTeal: '#0A84FF', // Neutral / Informational
  accentAmber: '#FF9F0A', // Attention-worthy
  accentRed: '#FF453A',   // Lethal / Critical
  
  // Other status
  statusGreen: '#30D158',
};

export const lightTheme: ColorTheme = {
  background: '#F8FAFC', // Crisp Slate-50 background
  surface: '#FFFFFF', // White for cards
  surfaceLight: '#E4E6EB', // More visible grey for tab pills and card headers
  textPrimary: '#181110', // Dark Espresso Black from palette
  textSecondary: '#6F777B', // Slate Grey from palette
  border: '#E2E8F0', // Slate-200 (using standard light border so it's not too heavy)
  overlay: 'rgba(248, 250, 252, 0.9)',

  // Category colors
  accentTeal: '#16A34A', // Cleaner, more vibrant UI Green (Green-600) instead of the muddy olive
  accentAmber: '#6F777B', // Slate Grey from palette
  accentRed: '#FE281A', // Vibrant Red from palette
  
  // Other status
  statusGreen: '#16A34A', // Matching UI Green
};
