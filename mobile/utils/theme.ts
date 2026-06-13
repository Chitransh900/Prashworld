export const APP_NAME = 'Prashworld';
export const APP_TAGLINE = 'Where Nature Finds Its Voice';

export const colors = {
  primary: {
    50: '#f0f7f0',
    100: '#d4ead4',
    200: '#a8d5a8',
    300: '#7cc07c',
    400: '#56a856',
    500: '#2d8a3e',
    600: '#246f32',
    700: '#1b5426',
    800: '#123a1a',
    900: '#091f0e',
  },
  accent: {
    50: '#fef9f0',
    100: '#fcefd4',
    200: '#f9dfa8',
    300: '#f5cc72',
    400: '#f0b847',
    500: '#d4940d',
    600: '#a8750a',
    700: '#7c5708',
  },
  warm: {
    50: '#fdf6f3',
    100: '#f8e8e0',
    200: '#f0d0c1',
    300: '#e4ab92',
    400: '#d88a6a',
    500: '#c26a3d',
  },
  neutral: {
    0: '#ffffff',
    50: '#faf9f7',
    100: '#f3f1ee',
    150: '#eae7e2',
    200: '#ddd9d2',
    300: '#c4bfb6',
    400: '#9e9788',
    500: '#78716a',
    600: '#57524b',
    700: '#3d3833',
    800: '#29251f',
    900: '#1a1714',
    950: '#0d0b09',
  },
  semantic: {
    success: '#2d8a3e',
    warning: '#d4940d',
    error: '#c23d3d',
    info: '#3d6fc2',
    like: '#e04848',
  },
  dark: {
    bg: '#0f0e0c',
    surface: '#1a1816',
    elevated: '#242220',
    border: '#2e2c28',
    borderStrong: '#3d3a34',
    textMuted: '#7a756c',
    textSecondary: '#a39d93',
    textPrimary: '#ebe7e0',
    textStrong: '#f5f3f0',
  },
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
};

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
};

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const lightTheme = {
  bg: colors.neutral[50],
  surface: colors.neutral[0],
  surfaceElevated: colors.neutral[100],
  textPrimary: colors.neutral[900],
  textSecondary: colors.neutral[600],
  textMuted: colors.neutral[400],
  border: colors.neutral[200],
  borderStrong: colors.neutral[300],
  primary: colors.primary[500],
  primaryLight: colors.primary[50],
};

export const darkTheme = {
  bg: colors.dark.bg,
  surface: colors.dark.surface,
  surfaceElevated: colors.dark.elevated,
  textPrimary: colors.dark.textPrimary,
  textSecondary: colors.dark.textSecondary,
  textMuted: colors.dark.textMuted,
  border: colors.dark.border,
  borderStrong: colors.dark.borderStrong,
  primary: colors.primary[400],
  primaryLight: 'rgba(45, 138, 62, 0.12)',
};

export const MAX_CAPTION_LENGTH = 2200;
export const MAX_BIO_LENGTH = 160;
export const MAX_IMAGES_PER_POST = 5;
export const MAX_COMMENT_LENGTH = 500;
export const POSTS_PER_PAGE = 10;
