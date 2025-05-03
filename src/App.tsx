// src/App.tsx

import { MainLayout } from '@components/layout/MainLayout';
import { MarketOverview } from '@features/market/MarketOverview';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { StockDetailPage } from '@/features/stocks/pages/StockDetailPage';
import { StocksPage } from '@/features/stocks/pages/StocksPage';
import { useAppSelector } from '@/hooks';
import { createAppTheme } from '@/theme';

export const App = () => {
  // Get the current theme mode from Redux store
  const { mode } = useAppSelector(state => state.theme);

  // Create the theme based on the current mode
  // Memoize to prevent unnecessary recalculations
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<MarketOverview />} />
            <Route path="/stocks" element={<StocksPage />} />
            <Route path="/stocks/:symbol" element={<StockDetailPage />} />
            <Route path="/comparison" element={<div>Comparison (coming soon)</div>} />
            <Route path="/portfolio" element={<div>Portfolio (coming soon)</div>} />
            <Route path="/watchlists" element={<div>Watchlists (coming soon)</div>} />
            <Route path="/account" element={<div>Account (coming soon)</div>} />
            <Route path="*" element={<div>Page not found</div>} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
};
