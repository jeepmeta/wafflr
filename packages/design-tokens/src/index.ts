/**
 * Initial Wafflr design tokens.
 * Treat these values as provisional until the brand system is finalized.
 */
export const colors = {
  butter: "#FFD84D",
  syrup: "#8B4B2B",
  ink: "#2D2633",
  cream: "#FFF9E8",
  white: "#FFFFFF",
  success: "#248A5A",
  accent: "#E94F9B",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  body: 16,
  caption: 12,
  heading: 24,
  display: 32,
} as const;
