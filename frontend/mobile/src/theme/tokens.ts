export const colors = {
  // Background
  background: '#0A0B0D',
  surface: '#141619',
  surfaceElevated: '#1C1E22',

  // Text
  textPrimary: '#F5F5F7',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',

  // Accent
  accent: '#6366F1',
  accentHover: '#7C7FF5',
  accentMuted: 'rgba(99, 102, 241, 0.1)',

  // Status
  success: '#10B981',
  successMuted: 'rgba(16, 185, 129, 0.1)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.1)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239, 68, 68, 0.1)',

  // UI
  border: '#2D3038',
  borderLight: '#3F4349',
  divider: '#1F2229',
  overlay: 'rgba(0, 0, 0, 0.8)',

  // Interaction
  ripple: 'rgba(255, 255, 255, 0.1)',
  pressed: 'rgba(255, 255, 255, 0.05)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};
