// Powered by OnSpace.AI
export const Colors = {
  // Primary
  primary: '#C9A84C',
  primaryLight: '#E8C96A',
  primaryDark: '#A07830',
  primarySurface: 'rgba(201, 168, 76, 0.12)',

  // Backgrounds
  background: '#0D0D0F',
  surface: '#16161A',
  surfaceElevated: '#1E1E24',
  surfaceHighlight: '#252530',
  card: '#1A1A22',

  // Text
  textPrimary: '#F0EDE6',
  textSecondary: '#9B9AA5',
  textMuted: '#5A5A6A',
  textOnPrimary: '#0D0D0F',

  // Status
  success: '#4CAF82',
  successSurface: 'rgba(76, 175, 130, 0.12)',
  warning: '#E8A44A',
  warningSurface: 'rgba(232, 164, 74, 0.12)',
  error: '#E86A6A',
  errorSurface: 'rgba(232, 106, 106, 0.12)',
  info: '#6A9FE8',
  infoSurface: 'rgba(106, 159, 232, 0.12)',

  // Borders
  border: '#2A2A35',
  borderLight: '#222228',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  hero: 34,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  gold: {
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};
