// Spacing scale - consistent spacing throughout the app
export const spacing = {
  0: 0,
  1: 4,   // Tiny gap
  2: 8,   // Small gap
  3: 12,  // Medium gap
  4: 16,  // Base spacing (default container padding)
  5: 20,
  6: 24,  // Large gap
  8: 32,  // Section spacing
  10: 40,
  12: 48,
  16: 64, // Hero spacing
};

// Border radius scale
export const borderRadius = {
  none: 0,
  sm: 8,    // Small elements (badges)
  base: 12, // Default (buttons, inputs, cards)
  lg: 16,   // Large cards
  xl: 20,   // Modals
  full: 9999, // Pills, avatars
};

// Shadow presets
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 1000, // For modals and overlays
  },
};
