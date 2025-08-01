import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { WatchlistCard } from '../components/WatchListCard';
import {
  Watchlist,
  WATCHLIST_CONSTRAINTS,
  WatchlistItem,
  WatchlistWithMarketData,
} from '../models';
import { deleteWatchlist, getUserWatchlists } from '../services/watchlistService';

import { useAuth } from '@/features/auth/context/AuthContext';
import { useGetBatchStockQuotesQuery } from '@/services/api/financialApi';

export const WatchlistPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const allSymbols = useMemo(() => {
    const symbols = watchlists.flatMap(watchlist => watchlist.symbols);
    return [...new Set(symbols)];
  }, [watchlists]);

  const {
    data: stockQuotes,
    isLoading: isPriceLoading,
    error: priceError,
    refetch: refetchPrices,
  } = useGetBatchStockQuotesQuery(allSymbols, {
    skip: allSymbols.length === 0,
    pollingInterval: 30000,
  });

  const watchlistsWithMarketData = useMemo((): WatchlistWithMarketData[] => {
    if (!stockQuotes || stockQuotes.length === 0) {
      return watchlists.map(watchlist => ({
        ...watchlist,
        watchlistItems: [],
      }));
    }

    const quotesLookup: Record<string, any> = {};
    stockQuotes.forEach(quote => {
      quotesLookup[quote.symbol] = quote;
    });

    return watchlists.map(watchlist => {
      const watchlistItems: WatchlistItem[] = watchlist.symbols
        .map(symbol => {
          const quote = quotesLookup[symbol];
          if (!quote) {
            return null;
          }

          const item: WatchlistItem = {
            symbol: quote.symbol as string,
            name: (quote.name as string) || quote.symbol,
            price: Number(quote.price) || 0,
            change: Number(quote.change) || 0,
            changePercent: Number(quote.changePercent) || 0,
            volume: Number(quote.volume) || 0,
            ...(quote.marketCap !== undefined &&
              quote.marketCap !== null && { marketCap: Number(quote.marketCap) }),
            ...(quote.dayHigh !== undefined &&
              quote.dayHigh !== null && { dayHigh: Number(quote.dayHigh) }),
            ...(quote.dayLow !== undefined &&
              quote.dayLow !== null && { dayLow: Number(quote.dayLow) }),
          };

          return item;
        })
        .filter((item): item is WatchlistItem => item !== null);

      return {
        ...watchlist,
        watchlistItems,
      };
    });
  }, [watchlists, stockQuotes]);

  const loadWatchlists = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      setIsLoading(true);
      setError(null);

      const userWatchlists = await getUserWatchlists(currentUser.uid);
      setWatchlists(userWatchlists);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load watchlists';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    loadWatchlists();
  }, [loadWatchlists]);

  const handleCreateWatchlist = useCallback(() => {
    navigate('/watchlists/create');
  }, [navigate]);

  const handleEditWatchlist = useCallback(
    (watchlist: Watchlist) => {
      navigate(`/watchlists/${watchlist.id}/edit`);
    },
    [navigate]
  );

  const handleDeleteWatchlist = useCallback(
    async (watchlistId: string) => {
      const watchlist = watchlists.find(w => w.id === watchlistId);
      const watchlistName = watchlist?.name || 'this watchlist';

      if (
        !window.confirm(
          `Are you sure you want to delete "${watchlistName}"? This action cannot be undone.`
        )
      ) {
        return;
      }

      setDeleteLoading(watchlistId);
      try {
        await deleteWatchlist(watchlistId);

        setWatchlists(prev => prev.filter(w => w.id !== watchlistId));
      } catch (err) {
        console.error('Failed to delete watchlist:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete watchlist';
        setError(errorMessage);
      } finally {
        setDeleteLoading(null);
      }
    },
    [watchlists]
  );

  const handleRefresh = useCallback(() => {
    loadWatchlists();
    if (allSymbols.length > 0) {
      refetchPrices();
    }
  }, [loadWatchlists, allSymbols.length, refetchPrices]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  if (isLoading && watchlists.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
            My Watchlists
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track stocks you're interested in and monitor their performance
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={isLoading}
            sx={{ minWidth: 'fit-content' }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateWatchlist}
            sx={{ minWidth: 'fit-content' }}
          >
            Create Watchlist
          </Button>
        </Stack>
      </Stack>

      {/* Error message */}
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Price loading indicator */}
      {isPriceLoading && watchlists.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            Fetching real-time stock prices...
          </Box>
        </Alert>
      )}

      {/* Price error */}
      {priceError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Unable to fetch real-time stock prices. Showing watchlists without market data.
        </Alert>
      )}

      {/* Watchlists grid */}
      {watchlistsWithMarketData.length > 0 ? (
        <Grid container spacing={3}>
          {watchlistsWithMarketData.map(watchlist => (
            <Grid item xs={12} sm={6} md={4} key={watchlist.id}>
              <Box sx={{ position: 'relative' }}>
                <WatchlistCard
                  watchlist={watchlist}
                  onEdit={handleEditWatchlist}
                  onDelete={handleDeleteWatchlist}
                  showMarketData={Boolean(stockQuotes && stockQuotes.length > 0)}
                />
                {deleteLoading === watchlist.id && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: 1,
                    }}
                  >
                    <CircularProgress size={24} />
                  </Box>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundColor: theme => (theme.palette.mode === 'light' ? 'grey.50' : 'grey.900'),
          }}
        >
          <VisibilityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            No Watchlists Yet
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
          >
            Create your first watchlist to start tracking stocks you're interested in. Monitor price
            movements and stay informed about your potential investments.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateWatchlist}
            size="large"
          >
            Create Your First Watchlist
          </Button>

          {/* Limits info */}
          <Box sx={{ mt: 3, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              You can create up to {WATCHLIST_CONSTRAINTS.MAX_WATCHLISTS_PER_USER} watchlists with
              up to {WATCHLIST_CONSTRAINTS.MAX_SYMBOLS_PER_WATCHLIST} stocks each
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Stats summary when watchlists exist */}
      {watchlistsWithMarketData.length > 0 && (
        <Box sx={{ mt: 4, p: 3, backgroundColor: 'background.default', borderRadius: 1 }}>
          <Stack direction="row" spacing={4} justifyContent="center">
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                {watchlistsWithMarketData.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Watchlists
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                {allSymbols.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unique Stocks
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                {WATCHLIST_CONSTRAINTS.MAX_WATCHLISTS_PER_USER - watchlistsWithMarketData.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Slots Remaining
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}
    </Box>
  );
};
