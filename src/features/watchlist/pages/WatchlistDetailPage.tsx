// src/features/watchlist/pages/WatchlistDetailPage.tsx

import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { isValidSymbol, Watchlist, WatchlistItem } from '../models';
import {
  addSymbolToWatchlist,
  deleteWatchlist,
  getWatchlistById,
  removeSymbolFromWatchlist,
} from '../services/watchlistService';

import { useAuth } from '@/features/auth/context/AuthContext';
import { useGetBatchStockQuotesQuery, useGetStockQuoteQuery } from '@/services/api/financialApi';
import { financialColors } from '@/theme';

// Format currency for display
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const WatchlistDetailPage: React.FC = () => {
  const { id: watchlistId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSymbol, setNewSymbol] = useState('');
  const [isAddingSymbol, setIsAddingSymbol] = useState(false);
  const [removingSymbol, setRemovingSymbol] = useState<string | null>(null);

  // State for RTK Query-based symbol price fetching
  const [quoteTriggerSymbol, setQuoteTriggerSymbol] = useState<string>('');
  const [symbolPrice, setSymbolPrice] = useState<any>(null);
  const [symbolError, setSymbolError] = useState<string | null>(null);

  // Use RTK Query to fetch real-time stock quotes for all symbols
  const {
    data: stockQuotes,
    isLoading: isPriceLoading,
    error: priceError,
    refetch: refetchPrices,
  } = useGetBatchStockQuotesQuery(watchlist?.symbols || [], {
    skip: !watchlist?.symbols?.length,
    pollingInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Use RTK Query for individual symbol price fetching
  const {
    data: symbolQuoteData,
    isLoading: isFetchingSymbolPrice,
    error: symbolQuoteError,
  } = useGetStockQuoteQuery(quoteTriggerSymbol, {
    skip: !quoteTriggerSymbol, // Only fetch when we have a symbol to fetch
  });

  // Transform stocks with market data
  const watchlistItems = useMemo((): WatchlistItem[] => {
    if (!watchlist?.symbols || !stockQuotes) {
      return [];
    }

    // Create quotes lookup
    const quotesLookup: Record<string, any> = {};
    stockQuotes.forEach(quote => {
      quotesLookup[quote.symbol] = quote;
    });

    return watchlist.symbols
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
  }, [watchlist?.symbols, stockQuotes]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (watchlistItems.length === 0) {
      return null;
    }

    const gainers = watchlistItems.filter(item => item.changePercent >= 0);
    const losers = watchlistItems.filter(item => item.changePercent < 0);
    const avgChange =
      watchlistItems.reduce((sum, item) => sum + item.changePercent, 0) / watchlistItems.length;

    const topPerformer = watchlistItems.reduce((top, item) =>
      item.changePercent > top.changePercent ? item : top
    );

    const worstPerformer = watchlistItems.reduce((worst, item) =>
      item.changePercent < worst.changePercent ? item : worst
    );

    return {
      gainers: gainers.length,
      losers: losers.length,
      avgChange,
      topPerformer:
        topPerformer.changePercent !== worstPerformer.changePercent ? topPerformer : null,
      worstPerformer:
        topPerformer.changePercent !== worstPerformer.changePercent ? worstPerformer : null,
    };
  }, [watchlistItems]);

  // Load watchlist data
  const loadWatchlist = useCallback(async () => {
    if (!watchlistId) {
      setError('Watchlist ID not provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const watchlistData = await getWatchlistById(watchlistId);

      if (!watchlistData) {
        setError('Watchlist not found');
        return;
      }

      // Verify ownership
      if (watchlistData.userId !== currentUser?.uid) {
        setError('You do not have permission to view this watchlist');
        return;
      }

      setWatchlist(watchlistData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load watchlist';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [watchlistId, currentUser?.uid]);

  // Load data on mount
  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // Handle RTK Query response for symbol price
  useEffect(() => {
    if (symbolQuoteData && quoteTriggerSymbol) {
      // Transform to the format expected by the UI
      setSymbolPrice({
        symbol: symbolQuoteData.symbol,
        price: symbolQuoteData.price,
        change: symbolQuoteData.change,
        changePercent: symbolQuoteData.changePercent,
      });
    }
  }, [symbolQuoteData, quoteTriggerSymbol]);

  // Handle RTK Query errors for symbol price
  useEffect(() => {
    if (symbolQuoteError && quoteTriggerSymbol) {
      let errorMessage = `Unable to fetch price for "${quoteTriggerSymbol}". Please verify the stock symbol and try again.`;

      // Use your existing error handling patterns
      if ('status' in symbolQuoteError) {
        switch (symbolQuoteError.status) {
          case 404:
            errorMessage = `Stock symbol "${quoteTriggerSymbol}" not found. Please verify the symbol is correct.`;
            break;
          case 429:
            errorMessage = `Too many requests. Please wait a moment and try again.`;
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = `Market data service is temporarily unavailable. Please try again in a few moments.`;
            break;
        }
      }

      setSymbolError(errorMessage);
    }
  }, [symbolQuoteError, quoteTriggerSymbol]);

  // Handle navigation
  const handleBack = useCallback(() => {
    navigate('/watchlists');
  }, [navigate]);

  const handleEdit = useCallback(() => {
    navigate(`/watchlists/${watchlistId}/edit`);
  }, [navigate, watchlistId]);

  const handleDelete = useCallback(async () => {
    if (!watchlist) return;

    if (
      !window.confirm(
        `Are you sure you want to delete "${watchlist.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteWatchlist(watchlist.id);
      navigate('/watchlists');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete watchlist';
      setError(errorMessage);
    }
  }, [watchlist, navigate]);

  const handleRefresh = useCallback(() => {
    loadWatchlist();
    if (watchlist?.symbols?.length) {
      refetchPrices();
    }
  }, [loadWatchlist, watchlist?.symbols?.length, refetchPrices]);

  // Handle getting symbol price using RTK Query
  const handleGetSymbolPrice = useCallback(() => {
    if (!newSymbol.trim()) return;

    const symbol = newSymbol.trim().toUpperCase();
    if (!isValidSymbol(symbol)) {
      setSymbolError(`Invalid stock symbol: ${symbol}. Use 1-5 letters only.`);
      return;
    }

    if (watchlist?.symbols.includes(symbol)) {
      setSymbolError(`${symbol} is already in this watchlist`);
      return;
    }

    // Clear previous errors and trigger the RTK Query
    setSymbolError(null);
    setSymbolPrice(null);
    setQuoteTriggerSymbol(symbol); // This triggers the RTK Query
  }, [newSymbol, watchlist?.symbols]);

  // Handle adding new symbol
  const handleAddSymbol = useCallback(async () => {
    if (!watchlistId || !newSymbol.trim()) return;

    const symbol = newSymbol.trim().toUpperCase();
    if (!isValidSymbol(symbol)) {
      setSymbolError(`Invalid stock symbol: ${symbol}. Use 1-5 letters only.`);
      return;
    }

    if (watchlist?.symbols.includes(symbol)) {
      setSymbolError(`${symbol} is already in this watchlist`);
      return;
    }

    setIsAddingSymbol(true);
    setError(null);

    try {
      await addSymbolToWatchlist(watchlistId, symbol);
      setNewSymbol('');
      setSymbolPrice(null); // Clear price data
      setSymbolError(null); // Clear any errors
      setQuoteTriggerSymbol(''); // Clear RTK Query trigger
      await loadWatchlist(); // Reload to get updated data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add symbol';
      setError(errorMessage);
    } finally {
      setIsAddingSymbol(false);
    }
  }, [watchlistId, newSymbol, watchlist?.symbols, loadWatchlist]);

  // Handle removing symbol
  const handleRemoveSymbol = useCallback(
    async (symbol: string) => {
      if (!watchlistId) return;

      if (!window.confirm(`Remove ${symbol} from this watchlist?`)) {
        return;
      }

      setRemovingSymbol(symbol);

      try {
        await removeSymbolFromWatchlist(watchlistId, symbol);
        await loadWatchlist(); // Reload to get updated data
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to remove symbol';
        setError(errorMessage);
      } finally {
        setRemovingSymbol(null);
      }
    },
    [watchlistId, loadWatchlist]
  );

  // Handle stock row click - navigate to stock detail
  const handleStockClick = useCallback(
    (symbol: string) => {
      navigate(`/stocks/${symbol}`);
    },
    [navigate]
  );

  // Loading state
  if (isLoading && !watchlist) {
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

  // Error state
  if (error && !watchlist) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button variant="outlined" onClick={handleBack}>
            Back to Watchlists
          </Button>
        </Box>
      </Container>
    );
  }

  if (!watchlist) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Watchlist not found
          </Alert>
          <Button variant="outlined" onClick={handleBack}>
            Back to Watchlists
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{ flexShrink: 0 }}
            >
              Back
            </Button>
            <Box>
              <Typography variant="h4" component="h1" fontWeight={600}>
                {watchlist.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {watchlist.symbols.length} {watchlist.symbols.length === 1 ? 'stock' : 'stocks'} •
                Created {watchlist.createdAt.toLocaleDateString()}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={handleRefresh}
              disabled={isPriceLoading}
              startIcon={isPriceLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              {isPriceLoading ? 'Updating...' : 'Refresh'}
            </Button>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}>
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Stack>
        </Stack>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Price Error */}
        {priceError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Unable to fetch real-time stock prices. Some data may be unavailable.
          </Alert>
        )}

        {/* Summary Stats */}
        {summaryStats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Average Change
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight={600}
                  sx={{
                    color:
                      summaryStats.avgChange >= 0
                        ? financialColors.positive
                        : financialColors.negative,
                  }}
                >
                  {summaryStats.avgChange >= 0 ? '+' : ''}
                  {summaryStats.avgChange.toFixed(2)}%
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Gainers
                </Typography>
                <Typography variant="h5" fontWeight={600} sx={{ color: financialColors.positive }}>
                  {summaryStats.gainers}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Losers
                </Typography>
                <Typography variant="h5" fontWeight={600} sx={{ color: financialColors.negative }}>
                  {summaryStats.losers}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Stocks
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {watchlist.symbols.length}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Add New Stock - Professional Version */}
        <Paper sx={{ mb: 4, p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
            Add Stock to Watchlist
          </Typography>

          <Stack spacing={2}>
            {/* Stock Symbol Input with Get Price */}
            <Box>
              <Stack direction="row" spacing={1}>
                <TextField
                  label="Stock Symbol"
                  placeholder="e.g., AAPL, GOOGL, MSFT"
                  value={newSymbol}
                  onChange={e => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                    setNewSymbol(value);
                    // Clear any previous price data when symbol changes
                    if (value !== newSymbol) {
                      setSymbolPrice(null);
                      setSymbolError(null);
                      setQuoteTriggerSymbol(''); // Clear RTK Query trigger
                    }
                  }}
                  disabled={isAddingSymbol}
                  fullWidth
                  inputProps={{ maxLength: 5 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Enter the ticker symbol of the stock"
                />

                <Button
                  variant="outlined"
                  onClick={handleGetSymbolPrice}
                  disabled={!newSymbol.trim() || isFetchingSymbolPrice || isAddingSymbol}
                  startIcon={
                    isFetchingSymbolPrice ? <CircularProgress size={16} /> : <RefreshIcon />
                  }
                  sx={{
                    minWidth: 120,
                    flexShrink: 0,
                    alignSelf: 'flex-start',
                    mt: '16px', // Align with input field
                    height: '56px',
                  }}
                >
                  {isFetchingSymbolPrice ? 'Getting...' : 'Get Price'}
                </Button>
              </Stack>
            </Box>

            {/* Current Price Display */}
            {symbolPrice && (
              <Alert
                severity="info"
                sx={{
                  '& .MuiAlert-message': {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                  },
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ width: '100%' }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      Current Price: {formatCurrency(symbolPrice.price)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {symbolPrice.change >= 0 ? '+' : ''}${Math.abs(symbolPrice.change).toFixed(2)}{' '}
                      ({symbolPrice.changePercent >= 0 ? '+' : ''}
                      {symbolPrice.changePercent.toFixed(2)}%)
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={isAddingSymbol ? <CircularProgress size={16} /> : <AddIcon />}
                    onClick={handleAddSymbol}
                    disabled={isAddingSymbol}
                  >
                    {isAddingSymbol ? 'Adding...' : 'Add to Watchlist'}
                  </Button>
                </Stack>
              </Alert>
            )}

            {/* Symbol Error Display */}
            {symbolError && (
              <Alert severity="warning" onClose={() => setSymbolError(null)}>
                {symbolError}
              </Alert>
            )}

            {/* Manual Add Button (when no price data) */}
            {!symbolPrice && !symbolError && newSymbol.trim() && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={isAddingSymbol ? <CircularProgress size={16} /> : <AddIcon />}
                  onClick={handleAddSymbol}
                  disabled={!newSymbol.trim() || isAddingSymbol}
                  sx={{ minWidth: 160 }}
                >
                  {isAddingSymbol ? 'Adding...' : 'Add to Watchlist'}
                </Button>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Stocks Table */}
        {watchlistItems.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Change</TableCell>
                  <TableCell align="right">Change %</TableCell>
                  <TableCell align="right">Volume</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {watchlistItems.map(item => (
                  <TableRow
                    key={item.symbol}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell
                      onClick={() => handleStockClick(item.symbol)}
                      sx={{ fontWeight: 600 }}
                    >
                      {item.symbol}
                    </TableCell>
                    <TableCell onClick={() => handleStockClick(item.symbol)}>{item.name}</TableCell>
                    <TableCell align="right" onClick={() => handleStockClick(item.symbol)}>
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell
                      align="right"
                      onClick={() => handleStockClick(item.symbol)}
                      sx={{
                        color:
                          item.change >= 0 ? financialColors.positive : financialColors.negative,
                        fontWeight: 500,
                      }}
                    >
                      {item.change >= 0 ? '+' : ''}
                      {item.change.toFixed(2)}
                    </TableCell>
                    <TableCell
                      align="right"
                      onClick={() => handleStockClick(item.symbol)}
                      sx={{
                        color:
                          item.changePercent >= 0
                            ? financialColors.positive
                            : financialColors.negative,
                        fontWeight: 500,
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="flex-end"
                        spacing={0.5}
                      >
                        {item.changePercent >= 0 ? (
                          <TrendingUpIcon fontSize="small" />
                        ) : (
                          <TrendingDownIcon fontSize="small" />
                        )}
                        <span>
                          {item.changePercent >= 0 ? '+' : ''}
                          {item.changePercent.toFixed(2)}%
                        </span>
                      </Stack>
                    </TableCell>
                    <TableCell align="right" onClick={() => handleStockClick(item.symbol)}>
                      {item.volume.toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={e => {
                          e.stopPropagation();
                          handleRemoveSymbol(item.symbol);
                        }}
                        disabled={removingSymbol === item.symbol}
                      >
                        {removingSymbol === item.symbol ? (
                          <CircularProgress size={16} />
                        ) : (
                          <RemoveIcon fontSize="small" />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : watchlist.symbols.length > 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Loading Stock Data...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Fetching real-time prices for {watchlist.symbols.length} stocks
            </Typography>
            <CircularProgress />
          </Paper>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No Stocks in Watchlist
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add your first stock using the form above
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
};
