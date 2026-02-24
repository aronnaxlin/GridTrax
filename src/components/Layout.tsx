import MovieIcon from '@mui/icons-material/Movie';
import { AppBar, Box, Container, Toolbar, Typography, useScrollTrigger } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React from 'react';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import ThemePicker from './ThemePicker';

interface Props {
    children: React.ReactElement<{ elevation?: number; sx?: any }>;
}

function ElevationScroll(props: Props) {
    const { children } = props;
    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0,
    });

    const theme = useTheme();

    return React.cloneElement(children, {
        elevation: trigger ? 4 : 0,
        sx: {
            backgroundColor: trigger
                ? alpha(theme.palette.background.default, 0.85)
                : 'transparent',
            backdropFilter: trigger ? 'blur(12px)' : 'none',
            borderBottom: trigger ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
            transition: 'background-color 0.3s, backdrop-filter 0.3s, border-bottom 0.3s',
        }
    });
}

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'background.default' }}>
            <ElevationScroll>
                <AppBar position="fixed" color="transparent" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                    <Container maxWidth="xl">
                        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                            <Box
                                component={Link}
                                to="/"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    gap: 1.5
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 40,
                                        height: 40,
                                        borderRadius: '8px',
                                        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                        color: 'primary.main',
                                    }}
                                >
                                    <MovieIcon />
                                </Box>
                                <Typography
                                    variant="h6"
                                    noWrap
                                    sx={{
                                        fontWeight: 800,
                                        letterSpacing: '-0.5px',
                                        background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    GridTrax
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SearchBar />
                                <ThemePicker />
                            </Box>
                        </Toolbar>
                    </Container>
                </AppBar>
            </ElevationScroll>
            <Box component="main" sx={{ flexGrow: 1, pt: { xs: 8, sm: 9 }, pb: 4 }}>
                {children}
            </Box>
        </Box>
    );
};

export default Layout;
