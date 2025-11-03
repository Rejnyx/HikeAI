// Dark Mode - Outdoor/Hiking Aesthetic
// Inspired by forests at night, camping under stars
export const colors = {
  // Primary - Green (lighter shades for dark mode contrast)
  primary: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',  // Better for dark mode
    400: '#66BB6A',  // Main green for dark mode
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },

  // Secondary - Blue (Sky/Water - adjusted for dark)
  secondary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',  // Better for dark mode
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },

  // Neutrals - Dark palette
  gray: {
    50: '#2C3430',   // Darkest (reversed for dark mode)
    100: '#364039',
    200: '#3F4A43',
    300: '#4A5650',
    400: '#5C6861',
    500: '#747F79',
    600: '#8F9A94',
    700: '#A8B3AD',
    800: '#C5CEC9',
    900: '#E3E8E5',  // Lightest text
  },

  // Semantic colors - Adjusted for dark mode visibility
  success: '#66BB6A',  // Lighter green
  warning: '#FFB74D',  // Lighter orange
  error: '#EF5350',    // Lighter red
  info: '#64B5F6',     // Lighter blue

  // Background - Deep forest/charcoal tones
  background: {
    primary: '#1A1F1E',    // Deep charcoal with green tint (main bg)
    secondary: '#242B28',  // Slightly lighter (cards, sheets)
    tertiary: '#2C3430',   // Card highlights, elevated elements
  },

  // Text - Warm off-white for readability
  text: {
    primary: '#E8E6E3',    // Warm off-white (main text)
    secondary: '#A8A39E',  // Muted gray (secondary text)
    disabled: '#5C6861',   // Very muted (disabled)
    inverse: '#1A1F1E',    // Dark (for light buttons)
  },

  // Difficulty badges - Enhanced visibility on dark
  difficulty: {
    easy: '#66BB6A',     // Lighter green
    moderate: '#FFB74D', // Lighter orange
    hard: '#EF5350',     // Lighter red
  },

  // Map elements - Vibrant for visibility on dark map
  map: {
    marker: '#66BB6A',   // Lighter green marker
    route: '#64B5F6',    // Lighter blue route
    selected: '#FFB74D', // Lighter orange highlight
  },
};
