/**
 * Centralized design tokens for Viro Horizon AI.
 *
 * The palette leans into a deep "spatial" navy with electric accents so the
 * 2D surfaces feel cohesive with the immersive XR layer.
 */

export const Colors = {
  background: '#0B0F1A',
  surface: '#141A2A',
  surfaceElevated: '#1C2438',
  border: '#26304A',
  text: '#F2F5FF',
  textMuted: '#9AA6C2',
  accent: '#6C8BFF',
  accentAlt: '#36E0C8',
  danger: '#FF6B6B',
  success: '#3FCF8E',
  warning: '#F5B14C',
} as const;

/** Gradient color stops, ordered start -> end. Consumed by Skia + RN alike. */
export const Gradients = {
  brand: ['#6C8BFF', '#36E0C8'] as const,
  dusk: ['#3A2D7A', '#6C8BFF'] as const,
  ember: ['#FF6B6B', '#F5B14C'] as const,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export type GradientName = keyof typeof Gradients;
