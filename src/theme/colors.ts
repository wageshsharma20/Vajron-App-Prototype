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
  background: '#000000',    // Pure black
  surface: '#1C1C1E',       // Apple dark mode card
  surfaceLight: '#2C2C2E',  // Lighter gray
  textPrimary: '#FAFAFA',   // Off white
  textSecondary: '#8E8E93', // Apple dark mode secondary text
  border: '#38383A',        // Apple dark mode border
  overlay: 'rgba(0, 0, 0, 0.8)',

  accentTeal: '#22C55E',    // Neon tactical green
  accentAmber: '#FACC15',   // Crisp tactical yellow
  accentRed: '#EF4444',     // Tactical red
  
  statusGreen: '#22C55E',   // Neon green
};

export const lightTheme: ColorTheme = {
  background: '#F8FAFC',    // Slate 50
  surface: '#FFFFFF',       // Pure White
  surfaceLight: '#F1F5F9',  // Slate 100
  textPrimary: '#0F172A',   // Slate 900
  textSecondary: '#64748B', // Slate 500
  border: '#E2E8F0',        // Slate 200
  overlay: 'rgba(248, 250, 252, 0.8)',

  accentTeal: '#16A34A',    // Green 600
  accentAmber: '#EAB308',   // Solid yellow
  accentRed: '#DC2626',     // Red 600
  
  statusGreen: '#16A34A',   // Green 600
};
