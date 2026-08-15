/**
 * Masar RTC Premium Gradient Presets
 * Harmonious gradients calibrated for Egyptian daylight and OLED dark mode.
 */

export const Gradients = {
  hero: {
    colors: ['#00288E', '#1E40AF', '#00554E'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  heroDark: {
    colors: ['#0C1635', '#16285A', '#00423C'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  cardPrimary: {
    colors: ['rgba(30, 64, 175, 0.12)', 'rgba(0, 85, 78, 0.06)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  gold: {
    colors: ['#F59E0B', '#D4AF37', '#B45309'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0.8 },
  },
  teal: {
    colors: ['#00554E', '#007A70', '#89F5E7'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  danger: {
    colors: ['#BA1A1A', '#DC2626', '#991B1B'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  glassLight: {
    colors: ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.82)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  glassDark: {
    colors: ['rgba(16, 23, 38, 0.96)', 'rgba(10, 15, 26, 0.88)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  accentShimmer: {
    colors: ['transparent', 'rgba(255, 255, 255, 0.15)', 'transparent'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
};
