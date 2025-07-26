// src/App.tsx

import { MainLayout } from '@components/layout/MainLayout';
import { UserProvider } from '@features/auth/context/UserContext';
import { AccountPage } from '@features/auth/pages/AccountPage';
import { ComparisonProvider } from '@features/comparison/context/ComparisonContext';
import { ComparisonPage } from '@features/comparison/pages/ComparisonPage';
import { MarketOverview } from '@features/market/MarketOverview';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useMemo } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { PortfolioDetailPage } from '@/features/portfolio/components/PortfolioDetailPage';
import { PortfolioForm } from '@/features/portfolio/components/PortfolioForm';
import { PortfolioList } from '@/features/portfolio/components/PortfolioList';
import { PortfolioProvider } from '@/features/portfolio/context/PortfolioContext';
import { AddPositionPage } from '@/features/portfolio/pages/AddPositionPage';
import { StockDetailPage } from '@/features/stocks/pages/StockDetailPage';
import { StocksPage } from '@/features/stocks/pages/StocksPage';
import { useAppSelector } from '@/hooks';
import { createAppTheme } from '@/theme';

// Portfolio imports

export const App = () => {
  // Get the current theme mode from Redux store
  const { mode } = useAppSelector(state => state.theme);

  // Create the theme based on the current mode
  // Memoize to prevent unnecessary recalculations
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <UserProvider>
          <PortfolioProvider>
            <BrowserRouter>
              <ComparisonProvider>
                <MainLayout>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<MarketOverview />} />
                    <Route path="/stocks" element={<StocksPage />} />
                    <Route path="/stocks/:symbol" element={<StockDetailPage />} />
                    <Route path="/comparison" element={<ComparisonPage />} />

                    {/* Authentication routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                    {/* Protected portfolio routes */}
                    <Route
                      path="/portfolio"
                      element={
                        <ProtectedRoute>
                          <PortfolioList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/portfolio/create"
                      element={
                        <ProtectedRoute>
                          <PortfolioForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/portfolio/:id"
                      element={
                        <ProtectedRoute>
                          <PortfolioDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/portfolio/:id/add-position"
                      element={
                        <ProtectedRoute>
                          <AddPositionPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/portfolio/:id/edit"
                      element={
                        <ProtectedRoute>
                          <div>Edit Portfolio (coming soon)</div>
                        </ProtectedRoute>
                      }
                    />

                    {/* Other protected routes */}
                    <Route
                      path="/watchlists"
                      element={
                        <ProtectedRoute>
                          <div>Watchlists (coming soon)</div>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/account"
                      element={
                        <ProtectedRoute>
                          <AccountPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Fallback route */}
                    <Route path="*" element={<div>Page not found</div>} />
                  </Routes>
                </MainLayout>
              </ComparisonProvider>
            </BrowserRouter>
          </PortfolioProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
