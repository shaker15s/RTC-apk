/**
 * Design Tokens for Masar RTC v100.0
 * 1:1 Port from styles/app.css
 */

export interface ThemeColors {
  primary: string;
  primary2: string;
  primarySoft: string;
  teal: string;
  teal2: string;
  tealFix: string;
  gold: string;
  red: string;
  amber: string;
  bg: string;
  card: string;
  card2: string;
  txt: string;
  mut: string;
  line: string;
  glass: string;
  border: string;
  isDark: boolean;
}

export const LightColors: ThemeColors = {
  primary: '#00288E',
  primary2: '#1E40AF',
  primarySoft: 'rgba(0, 40, 142, 0.09)',
  teal: '#00554E',
  teal2: '#003C36',
  tealFix: '#89F5E7',
  gold: '#D4AF37',
  red: '#BA1A1A',
  amber: '#854D0E',
  bg: '#F4F7FC',
  card: '#FFFFFF',
  card2: '#EEF1F7',
  txt: '#14161C',
  mut: '#667085',
  line: '#E3E7F0',
  glass: 'rgba(255, 255, 255, 0.88)',
  border: '#E3E7F0',
  isDark: false,
};

export const DarkColors: ThemeColors = {
  primary: '#3C6EFF',
  primary2: '#1E40AF',
  primarySoft: 'rgba(60, 110, 255, 0.18)',
  teal: '#00554E',
  teal2: '#003C36',
  tealFix: '#89F5E7',
  gold: '#D4AF37',
  red: '#E04848',
  amber: '#F59E0B',
  bg: '#070B16',
  card: '#101726',
  card2: '#151E32',
  txt: '#F0F4FD',
  mut: '#9AA8C3',
  line: 'rgba(255, 255, 255, 0.11)',
  glass: 'rgba(12, 18, 32, 0.88)',
  border: 'rgba(255, 255, 255, 0.11)',
  isDark: true,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  huge: 32,
};

export const Radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Typography = {
  fontFamily: 'System', // Will use IBM Plex Sans Arabic when loaded or standard system font
  sizes: {
    tiny: 10.5,
    xs: 12,
    sm: 13.5,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    hero: 30,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeightScale: 1.55,
};

export const Shadows = {
  soft: {
    shadowColor: '#141E46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 22,
    elevation: 6,
  },
  strong: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 36,
    elevation: 12,
  },
};

export const HitSlop = {
  sm: { top: 8, bottom: 8, left: 8, right: 8 },
  md: { top: 12, bottom: 12, left: 12, right: 12 },
  lg: { top: 16, bottom: 16, left: 16, right: 16 },
};

export const IconSizes = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
  hero: 44,
};

export const Transitions = {
  fast: 150,
  normal: 280,
  slow: 450,
};

