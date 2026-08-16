/**
 * Design Tokens for Masar RTC Native Mobile.
 * Built according to Apple Human Interface Guidelines & Google Material 3 standards.
 * Enhanced for WCAG AA accessibility contrast in Light and Dark themes.
 */

export interface ThemeColors {
  primary: string;
  primary2: string;
  primarySoft: string;
  teal: string;
  teal2: string;
  tealFix: string;
  tealSoft: string;
  gold: string;
  goldSoft: string;
  red: string;
  redSoft: string;
  amber: string;
  amberSoft: string;
  green: string;
  greenSoft: string;
  bg: string;
  card: string;
  card2: string;
  txt: string;
  txtSecondary: string;
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
  tealFix: '#006B62',
  tealSoft: 'rgba(0, 85, 78, 0.10)',
  gold: '#B8860B',
  goldSoft: 'rgba(184, 134, 11, 0.12)',
  red: '#BA1A1A',
  redSoft: 'rgba(186, 26, 26, 0.10)',
  amber: '#854D0E',
  amberSoft: 'rgba(133, 77, 14, 0.12)',
  green: '#15803D',
  greenSoft: 'rgba(21, 128, 61, 0.12)',
  bg: '#F4F7FC',
  card: '#FFFFFF',
  card2: '#EEF1F7',
  txt: '#14161C',
  txtSecondary: '#4A5568',
  mut: '#667085',
  line: '#E3E7F0',
  glass: 'rgba(255, 255, 255, 0.92)',
  border: '#E3E7F0',
  isDark: false,
};

export const DarkColors: ThemeColors = {
  primary: '#4D82FF',
  primary2: '#3C6EFF',
  primarySoft: 'rgba(77, 130, 255, 0.18)',
  teal: '#2DD4BF',
  teal2: '#14B8A6',
  tealFix: '#5EEAD4',
  tealSoft: 'rgba(45, 212, 191, 0.16)',
  gold: '#FACC15',
  goldSoft: 'rgba(250, 204, 21, 0.18)',
  red: '#F87171',
  redSoft: 'rgba(248, 113, 113, 0.18)',
  amber: '#FBBF24',
  amberSoft: 'rgba(251, 191, 36, 0.18)',
  green: '#4ADE80',
  greenSoft: 'rgba(74, 222, 128, 0.18)',
  bg: '#070B16',
  card: '#101726',
  card2: '#162035',
  txt: '#F8FAFC',
  txtSecondary: '#CBD5E1',
  mut: '#94A3B8',
  line: 'rgba(255, 255, 255, 0.12)',
  glass: 'rgba(16, 23, 38, 0.92)',
  border: 'rgba(255, 255, 255, 0.12)',
  isDark: true,
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  huge: 32,
  massive: 48,
};

export const Radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const TouchTarget = {
  minWidth: 44,
  minHeight: 44,
};

export const TypographyTokens = {
  display: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  titleMedium: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  titleSmall: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  bodyLarge: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  numeric: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700' as const,
  },
};

export const Typography = {
  fontFamily: 'System',
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
  none: {},
  soft: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  strong: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.20,
    shadowRadius: 28,
    elevation: 8,
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
