/**
 * Sentinel Aesthetic — Design System
 * Based on DESIGN.md: "The Vigilant Ghost"
 *
 * Deep nocturnal blues, high-frequency teals, glassmorphism.
 * No borders for sectioning — only tonal shifts.
 */

export const colors = {
  // Surface hierarchy (Level-Up nesting)
  surface:                '#0b1326',
  surfaceContainerLowest: '#0e1529',
  surfaceContainerLow:    '#131b2e',
  surfaceContainer:       '#171f33',
  surfaceContainerHigh:   '#222a3d',
  surfaceBright:          '#2a3350',
  surfaceVariant:         'rgba(34, 42, 61, 0.60)',

  // Primary — teal spectrum
  primary:          '#4cd6ff',
  primaryContainer: '#00637b',
  onPrimary:        '#003545',

  // Secondary — amber / caution
  secondary:              '#ffb74d',
  secondaryContainer:     '#3d2e00',
  onSecondaryContainer:   '#ffe0a0',

  // Tertiary — green / safe
  tertiary:              '#4cdb8a',
  tertiaryContainer:     '#003822',
  onTertiary:            '#00391e',

  // Error / danger
  error:              '#ff5252',
  errorContainer:     '#93000a',
  onErrorContainer:   '#ffdad5',

  // On-surface text colours
  onSurface:        '#dae2fd',
  onSurfaceVariant: '#8e95a9',

  // Outline (ghost borders)
  outlineVariant: 'rgba(67, 70, 84, 0.15)',

  // Gradients
  gradientStart: '#4cd6ff',
  gradientEnd:   '#00637b',
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 56, // 3.5rem — page-top breathing room
  '5xl': 70, // 5rem
};

export const borderRadius = {
  sm:      4,
  DEFAULT: 8,
  md:      12,
  lg:      16,
  xl:      24,
};

export const typography = {
  headlineLG: {
    fontFamily: 'Manrope_700Bold',
    fontSize:   32,
    lineHeight: 40,
    color:      colors.onSurface,
  },
  headlineMD: {
    fontFamily: 'Manrope_700Bold',
    fontSize:   24,
    lineHeight: 32,
    color:      colors.onSurface,
  },
  headlineSM: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize:   20,
    lineHeight: 28,
    color:      colors.onSurface,
  },
  titleMD: {
    fontFamily: 'Inter_600SemiBold',
    fontSize:   16,
    lineHeight: 24,
    color:      colors.onSurface,
  },
  bodyLG: {
    fontFamily: 'Inter_400Regular',
    fontSize:   16,
    lineHeight: 24,
    color:      colors.onSurface,
  },
  bodyMD: {
    fontFamily: 'Inter_400Regular',
    fontSize:   14,
    lineHeight: 20,
    color:      colors.onSurface,
  },
  bodySM: {
    fontFamily: 'Inter_400Regular',
    fontSize:   12,
    lineHeight: 16,
    color:      colors.onSurfaceVariant,
  },
  labelSM: {
    fontFamily: 'Inter_500Medium',
    fontSize:   11,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },
};

export const shadows = {
  ambient: {
    shadowColor:   colors.onSurface,
    shadowOffset:  { width: 0, height: 20 },
    shadowOpacity: 0.06,
    shadowRadius:  40,
    elevation:     8,
  },
  soft: {
    shadowColor:   colors.onSurface,
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius:  20,
    elevation:     4,
  },
};

export const glassmorphism = {
  backgroundColor: colors.surfaceVariant,
  // Note: RN doesn't support backdrop-blur natively;
  // we approximate with opacity + blur via expo-blur if needed
};
