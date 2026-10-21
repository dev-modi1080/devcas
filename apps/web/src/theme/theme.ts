import { createTheme, ThemeOptions } from '@mui/material/styles';

export type FontScale = 'small' | 'medium' | 'large';

export const getDesignTokens = (mode: 'light' | 'dark', fontScale: FontScale = 'medium'): ThemeOptions => {
  const fontSizes = {
    small: {
      htmlFontSize: 14,
      body1: '0.875rem',
      body2: '0.75rem',
      h1: '1.75rem',
      h2: '1.5rem',
      h3: '1.25rem',
      h4: '1.125rem',
      h5: '1rem',
      h6: '0.875rem',
    },
    medium: {
      htmlFontSize: 16,
      body1: '1rem',
      body2: '0.875rem',
      h1: '2.125rem',
      h2: '1.75rem',
      h3: '1.5rem',
      h4: '1.25rem',
      h5: '1.125rem',
      h6: '1rem',
    },
    large: {
      htmlFontSize: 18,
      body1: '1.125rem',
      body2: '1rem',
      h1: '2.375rem',
      h2: '2rem',
      h3: '1.75rem',
      h4: '1.375rem',
      h5: '1.25rem',
      h6: '1.125rem',
    },
  }[fontScale];

  const isLight = mode === 'light';

  return {
    palette: {
      mode,
      primary: {
        main: '#2670DC', // Adani Blue
        dark: '#443FFC', // Adani Indigo
        light: '#158CC9',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#A510A1', // Adani Purple/Pink accent
        dark: '#7A0A77',
        light: '#C72BC3',
        contrastText: '#FFFFFF',
      },
      background: {
        default: isLight ? '#F6F7FB' : '#0F172A',
        paper: isLight ? '#FFFFFF' : '#1E293B',
      },
      text: {
        primary: isLight ? '#14171F' : '#F8FAFC',
        secondary: isLight ? '#5B6475' : '#94A3B8',
      },
      divider: isLight ? '#E6E8EF' : '#334155',
      success: { main: '#10B981', light: '#ECFDF5', dark: '#047857' },
      warning: { main: '#F59E0B', light: '#FFFBEB', dark: '#B45309' },
      error: { main: '#EF4444', light: '#FEF2F2', dark: '#B91C1C' },
      info: { main: '#0284C7', light: '#F0F9FF', dark: '#0369A1' },
    },
    typography: {
      // Replace with the official Adani brand font when available.
      fontFamily: '"Inter", "Poppins", "Segoe UI", Roboto, Arial, sans-serif',
      fontSize: 14,
      h1: { fontSize: fontSizes.h1, fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontSize: fontSizes.h2, fontWeight: 700, letterSpacing: '-0.01em' },
      h3: { fontSize: fontSizes.h3, fontWeight: 600 },
      h4: { fontSize: fontSizes.h4, fontWeight: 600 },
      h5: { fontSize: fontSizes.h5, fontWeight: 600 },
      h6: { fontSize: fontSizes.h6, fontWeight: 600 },
      body1: { fontSize: fontSizes.body1, lineHeight: 1.6, fontWeight: 400 },
      body2: { fontSize: fontSizes.body2, lineHeight: 1.5, fontWeight: 400 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: isLight ? '1px solid #E6E8EF' : '1px solid #334155',
            boxShadow: isLight
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            minHeight: 44, // 44px minimum touch target for mobile-first
            padding: '8px 18px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 4px rgba(38, 112, 220, 0.2)',
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: 'medium',
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '& fieldset': {
              borderColor: isLight ? '#CBD5E1' : '#475569',
            },
            '&:hover fieldset': {
              borderColor: '#2670DC',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            borderBottom: isLight ? '1px solid #E6E8EF' : '1px solid #334155',
          },
        },
      },
    },
  };
};

export const createAdaniTheme = (mode: 'light' | 'dark', fontScale: FontScale = 'medium') => {
  return createTheme(getDesignTokens(mode, fontScale));
};
