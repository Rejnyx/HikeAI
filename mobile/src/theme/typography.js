import { colors } from './colors';

// Font families - National Park everywhere for authentic outdoor aesthetic
export const fontFamily = {
  // National Park font - inspired by carved wooden signs from Rocky Mountain National Park
  // Used throughout the entire app for consistent branding
  regular: 'NationalPark_400Regular',
  semibold: 'NationalPark_600SemiBold',
  bold: 'NationalPark_700Bold',

  // Aliases for convenience
  display: 'NationalPark_400Regular',
  displayBold: 'NationalPark_700Bold',
  displaySemibold: 'NationalPark_600SemiBold',
  body: 'NationalPark_400Regular', // Now using National Park for all text
};

// Font sizes (comprehensive scale)
export const fontSize = {
  '2xs': 10,  // Tiny labels, markers
  xs: 12,     // Small labels, captions, badges
  sm: 13,     // Small text, hints
  base: 14,   // Body text, secondary info
  md: 15,     // Medium text, suggestions
  lg: 16,     // Primary text, inputs, buttons
  xl: 18,     // Card titles, sheet titles
  '2xl': 20,  // Modal titles, section headers
  '3xl': 24,  // Page titles, place names
  '4xl': 30,  // Hero text
};

// Font weights
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Line heights
export const lineHeight = {
  tight: 1.2,    // Headings
  normal: 1.5,   // Body text
  relaxed: 1.75, // Long-form content
};

// Pre-configured text styles
export const textStyles = {
  // HEADINGS - Page/Section Titles (National Park Display Font)
  h1: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    lineHeight: fontSize['3xl'] * lineHeight.tight,
  },
  h2: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    lineHeight: fontSize['2xl'] * lineHeight.tight,
  },
  h3: {
    fontFamily: fontFamily.displaySemibold,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    lineHeight: fontSize.xl * lineHeight.tight,
  },

  // TITLES - Cards, Sheets, Modals (National Park Display Font)
  cardTitle: {
    fontFamily: fontFamily.displaySemibold,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    lineHeight: fontSize.xl * lineHeight.tight,
  },
  sheetTitle: {
    fontFamily: fontFamily.displaySemibold,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    lineHeight: fontSize.xl * lineHeight.tight,
  },
  modalTitle: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    lineHeight: fontSize['2xl'] * lineHeight.tight,
  },

  // BODY TEXT - Main Content (National Park for all text)
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    color: colors.text.primary,
    lineHeight: fontSize.lg * lineHeight.normal,
  },
  bodyMedium: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    lineHeight: fontSize.lg * lineHeight.normal,
  },
  bodySemibold: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    lineHeight: fontSize.lg * lineHeight.normal,
  },

  // SECONDARY TEXT - Supporting Info
  secondary: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  secondaryRegular: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    color: colors.text.secondary,
    lineHeight: fontSize.base * lineHeight.normal,
  },

  // SMALL TEXT - Hints, Labels, Captions
  small: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    color: colors.text.secondary,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  smallMedium: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  smallBold: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
    lineHeight: fontSize.sm * lineHeight.normal,
  },

  // CAPTION - Tiny Text, Badges
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    color: colors.text.secondary,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  captionSemibold: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    lineHeight: fontSize.xs * lineHeight.normal,
  },

  // SPECIAL - Buttons, Links, Inputs
  button: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.lg * lineHeight.tight,
  },
  buttonSmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.base * lineHeight.tight,
  },
  input: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    color: colors.text.primary,
    lineHeight: fontSize.lg * lineHeight.normal,
  },
  link: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.primary[600],
  },

  // UI ELEMENTS - Specific Components
  badge: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    lineHeight: fontSize.xs * lineHeight.tight,
  },
  suggestionName: {
    fontFamily: fontFamily.displaySemibold,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    lineHeight: fontSize.lg * lineHeight.tight,
  },
  suggestionLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    color: colors.text.secondary,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  elevation: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
    lineHeight: fontSize.sm * lineHeight.tight,
  },
  markerLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xs'],
    fontWeight: fontWeight.bold,
    color: colors.error,
    lineHeight: fontSize['2xs'] * lineHeight.tight,
  },
};

// Icon sizes (matching with text)
export const iconSize = {
  xs: 14,  // Inline with small text
  sm: 16,  // Inline with body text
  base: 20, // Buttons, tabs
  lg: 24,  // Headers
  xl: 32,  // Hero icons
};
