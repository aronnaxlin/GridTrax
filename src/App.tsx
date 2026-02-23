import { Box, CircularProgress, CssBaseline, ThemeProvider } from '@mui/material';
import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { defaultTheme } from './theme/theme';

const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const TvDetailPage = React.lazy(() => import('./pages/TvDetailPage'));
const MovieDetailPage = React.lazy(() => import('./pages/MovieDetailPage'));

const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

const App: React.FC = () => {
  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/tv/:id" element={<TvDetailPage />} />
            <Route path="/movie/:id" element={<MovieDetailPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
