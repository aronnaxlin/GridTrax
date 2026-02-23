import { createTheme, type Theme } from '@mui/material/styles';

// Base Material You theme configuration
export const createAppTheme = (primaryColor?: string): Theme => {
    return createTheme({
        palette: {
            mode: 'dark',
            primary: {
                main: primaryColor || '#D0BCFF',
            },
            secondary: {
                main: '#CCC2DC',
            },
            background: {
                default: '#141218',
                paper: '#211F26',
            },
            surface: {
                main: '#141218',
            },
        },
        typography: {
            fontFamily: '"Inter", "Noto Sans SC", "Roboto", sans-serif',
            h4: { fontWeight: 700 },
            h5: { fontWeight: 600 },
            h6: { fontWeight: 600 },
        },
        shape: {
            borderRadius: 16,
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 50,
                        textTransform: 'none',
                        fontWeight: 600,
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 20,
                        backgroundImage: 'none',
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 28,
                        },
                    },
                },
            },
            MuiLinearProgress: {
                styleOverrides: {
                    root: {
                        borderRadius: 4,
                    },
                },
            },
        },
    });
};

// Declare augmentation for MUI theme to include 'surface'
declare module '@mui/material/styles' {
    interface Palette {
        surface: Palette['primary'];
    }
    interface PaletteOptions {
        surface?: PaletteOptions['primary'];
    }
}

export const defaultTheme = createAppTheme();
