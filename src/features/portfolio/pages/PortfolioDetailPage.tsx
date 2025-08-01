import { useAuth } from '@features/auth/context/AuthContext';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  ShowChart as ShowChartIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useGetBatchStockQuotesQuery } from '@services/api/financialApi';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AllocationChart } from '../components/AllocationChart';
import { Portfolio, Position, PositionWithMarketData } from '../models';
import { getPortfolioById, removePositionFromPortfolio } from '../services/portfolioService';

import { usePortfolioMetrics } from '@/hooks/usePortfolioMetrics';
import { financialColors } from '@/theme';

const formatPortfolioCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPortfolioChange = (change: number, changePercent: number): string => {
  const sign = change >= 0 ? '+' : '';
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(change));

  return `${sign}${formattedAmount} (${sign}${changePercent.toFixed(2)}%)`;
};

const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

interface PositionCardProps {
  readonly position: PositionWithMarketData;
  readonly onEdit: (position: Position) => void;
  readonly onDelete: (positionId: string) => void;
  readonly isDeleting?: boolean;
}

const PositionCard: React.FC<PositionCardProps> = React.memo(
  ({ position, onEdit, onDelete, isDeleting = false }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    }, []);

    const handleMenuClose = useCallback(() => {
      setAnchorEl(null);
    }, []);

    const handleEdit = useCallback(() => {
      onEdit(position);
      handleMenuClose();
    }, [onEdit, position, handleMenuClose]);

    const handleDelete = useCallback(() => {
      onDelete(position.id);
      handleMenuClose();
    }, [onDelete, position.id, handleMenuClose]);

    const isPositive = position.gainLoss >= 0;
    const isDayPositive = position.dayChange >= 0;

    return (
      <Card
        sx={{
          height: '100%',
          transition: 'all 0.2s',
          opacity: isDeleting ? 0.6 : 1,
          pointerEvents: isDeleting ? 'none' : 'auto',
          '&:hover': {
            transform: isDeleting ? 'none' : 'translateY(-2px)',
            boxShadow: isDeleting ? 1 : 4,
          },
        }}
      >
        <CardContent>
          {/* Header */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {position.symbol}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {position.shares} shares
              </Typography>
            </Box>

            {isDeleting ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <IconButton size="small" onClick={handleMenuOpen}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>

                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                  <MenuItem onClick={handleEdit}>Edit Position</MenuItem>
                  <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    Delete Position
                  </MenuItem>
                </Menu>
              </>
            )}
          </Stack>

          {/* Current Price */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight={600}>
              {formatPortfolioCurrency(position.currentPrice)}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {isDayPositive ? (
                <TrendingUpIcon fontSize="small" sx={{ color: financialColors.positive }} />
              ) : (
                <TrendingDownIcon fontSize="small" sx={{ color: financialColors.negative }} />
              )}
              <Typography
                variant="body2"
                sx={{
                  color: isDayPositive ? financialColors.positive : financialColors.negative,
                  fontWeight: 500,
                }}
              >
                {formatPortfolioChange(position.dayChange, position.dayChangePercent)}
              </Typography>
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Position Value */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Current Value
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {formatPortfolioCurrency(position.currentValue)}
            </Typography>
          </Box>

          {/* Gain/Loss */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total Gain/Loss
            </Typography>
            <Typography
              variant="body1"
              fontWeight={600}
              sx={{
                color: isPositive ? financialColors.positive : financialColors.negative,
              }}
            >
              {formatPortfolioChange(position.gainLoss, position.gainLossPercent)}
            </Typography>
          </Box>

          {/* Purchase Info */}
          <Box>
            <Typography variant="body2" color="text.secondary">
              Purchased at {formatPortfolioCurrency(position.purchasePrice)} on{' '}
              {position.purchaseDate.toLocaleDateString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }
);

// Main Portfolio Detail Page Component
export const PortfolioDetailPage: React.FC = () => {
  const { id: portfolioId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [portfolioData, setPortfolioData] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingPositions, setDeletingPositions] = useState<Set<string>>(new Set());

  // Get unique symbols from portfolio positions for batch quote
  const stockSymbols = useMemo(() => {
    if (!portfolioData?.positions?.length) return [];
    return [...new Set(portfolioData.positions.map(p => p.symbol))];
  }, [portfolioData?.positions]);

  // Use RTK Query to fetch real-time stock quotes
  const {
    data: stockQuotes,
    isLoading: isPriceLoading,
    error: priceError,
    refetch: refetchPrices,
  } = useGetBatchStockQuotesQuery(stockSymbols, {
    skip: stockSymbols.length === 0,
    pollingInterval: 30000, // Auto-refresh every 30 seconds
  });

  const portfolioMetrics = usePortfolioMetrics(portfolioData, stockQuotes);

  // Load portfolio data
  const loadPortfolio = useCallback(async () => {
    if (!portfolioId) {
      setError('Portfolio ID not provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const portfolio = await getPortfolioById(portfolioId);

      if (!portfolio) {
        setError('Portfolio not found');
        return;
      }

      // Verify ownership
      if (portfolio.userId !== currentUser?.uid) {
        setError('You do not have permission to view this portfolio');
        return;
      }

      setPortfolioData(portfolio);
      // Portfolio metrics will be calculated in useEffect when stockQuotes update
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load portfolio';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [portfolioId, currentUser?.uid]);

  // Load data on mount
  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  // Handle navigation
  const handleBack = useCallback(() => {
    navigate('/portfolio');
  }, [navigate]);

  const handleAddPosition = useCallback(() => {
    navigate(`/portfolio/${portfolioId}/add-position`);
  }, [navigate, portfolioId]);

  const handleEditPosition = useCallback(
    (position: Position) => {
      navigate(`/portfolio/${portfolioId}/position/${position.id}/edit`);
    },
    [navigate, portfolioId]
  );

  const handleDeletePosition = useCallback(
    async (positionId: string) => {
      if (!portfolioId) return;

      // Find position for confirmation dialog
      const position = portfolioData?.positions.find(p => p.id === positionId);
      const positionSymbol = position?.symbol || 'this position';

      if (
        !window.confirm(
          `Are you sure you want to delete ${positionSymbol}? This action cannot be undone.`
        )
      ) {
        return;
      }

      // Add to deleting set
      setDeletingPositions(prev => new Set(prev).add(positionId));

      try {
        await removePositionFromPortfolio(portfolioId, positionId);

        // Reload portfolio data to reflect changes
        await loadPortfolio();
      } catch (err) {
        console.error('Failed to delete position:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete position';
        setError(errorMessage);
      } finally {
        // Remove from deleting set
        setDeletingPositions(prev => {
          const newSet = new Set(prev);
          newSet.delete(positionId);
          return newSet;
        });
      }
    },
    [portfolioId, portfolioData?.positions, loadPortfolio]
  );

  const handleRefresh = useCallback(() => {
    // Refetch stock prices using RTK Query
    refetchPrices();
  }, [refetchPrices]);

  // Loading state
  if (isLoading && !portfolioData) {
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
  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button variant="outlined" onClick={handleBack}>
            Back to Portfolios
          </Button>
        </Box>
      </Container>
    );
  }

  // No portfolio state
  if (!portfolioMetrics) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Portfolio not found
          </Alert>
          <Button variant="outlined" onClick={handleBack}>
            Back to Portfolios
          </Button>
        </Box>
      </Container>
    );
  }

  const isPortfolioPositive = portfolioMetrics.totalGainLoss >= 0;
  const isDayPositive = portfolioMetrics.dayChange >= 0;

  return (
    <>
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
                {portfolioMetrics.name}
              </Typography>
              {portfolioMetrics.description && (
                <Typography variant="body1" color="text.secondary">
                  {portfolioMetrics.description}
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={handleRefresh}
              disabled={isPriceLoading}
              startIcon={isPriceLoading ? <CircularProgress size={16} /> : <ShowChartIcon />}
            >
              {isPriceLoading ? 'Updating...' : 'Refresh Prices'}
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddPosition}>
              Add Position
            </Button>
          </Stack>
        </Stack>

        {/* Price Error Alert */}
        {priceError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Unable to fetch real-time stock prices. Portfolio showing purchase values.
          </Alert>
        )}

        {/* Portfolio Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Value
              </Typography>
              <Typography
                variant="h4"
                fontWeight={600}
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {formatPortfolioCurrency(portfolioMetrics.totalValue)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Gain/Loss
              </Typography>
              <Box
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight={600}
                  sx={{
                    color: isPortfolioPositive
                      ? financialColors.positive
                      : financialColors.negative,
                  }}
                >
                  {
                    formatPortfolioChange(
                      portfolioMetrics.totalGainLoss,
                      portfolioMetrics.totalGainLossPercent
                    ).split(' (')[0]
                  }
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: isPortfolioPositive
                      ? financialColors.positive
                      : financialColors.negative,
                  }}
                >
                  {formatPercentage(portfolioMetrics.totalGainLossPercent)}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Day Change
              </Typography>
              <Box
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight={600}
                  sx={{
                    color: isDayPositive ? financialColors.positive : financialColors.negative,
                  }}
                >
                  {
                    formatPortfolioChange(
                      portfolioMetrics.dayChange,
                      portfolioMetrics.dayChangePercent
                    ).split(' (')[0]
                  }
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: isDayPositive ? financialColors.positive : financialColors.negative,
                  }}
                >
                  {formatPercentage(portfolioMetrics.dayChangePercent)}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Positions
              </Typography>
              <Typography
                variant="h4"
                fontWeight={600}
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {portfolioMetrics.positions.length}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Allocation Chart Section */}
        {portfolioMetrics.positionsWithMarketData.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <AllocationChart
                positions={portfolioMetrics.positionsWithMarketData}
                title="Portfolio Allocation"
              />
            </Grid>
          </Grid>
        )}

        {/* Positions */}
        {portfolioMetrics.positionsWithMarketData.length > 0 ? (
          <>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <Typography variant="h5" fontWeight={600}>
                Positions
              </Typography>
              {isPriceLoading && (
                <Chip
                  label="Fetching live prices..."
                  size="small"
                  icon={<CircularProgress size={12} />}
                  variant="outlined"
                />
              )}
            </Stack>

            <Grid container spacing={3}>
              {portfolioMetrics.positionsWithMarketData.map(position => (
                <Grid item xs={12} sm={6} md={4} key={position.id}>
                  <PositionCard
                    position={position}
                    onEdit={handleEditPosition}
                    onDelete={handleDeletePosition}
                    isDeleting={deletingPositions.has(position.id)}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        ) : (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              backgroundColor: theme => (theme.palette.mode === 'light' ? 'grey.50' : 'grey.900'),
            }}
          >
            <ShowChartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" fontWeight={600} gutterBottom>
              No Positions Yet
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
            >
              Start building your portfolio by adding your first stock position. Track performance
              and monitor your investments.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddPosition}
              size="large"
            >
              Add Your First Position
            </Button>
          </Paper>
        )}
      </Box>
    </>
  );
};
