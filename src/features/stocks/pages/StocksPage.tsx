// src/features/stocks/pages/StocksPage.tsx

import { RecentlyViewedStocks } from '@features/stocks/components/RecentlyViewedStocks';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { StockSearch } from '../components/StockSearch';
import { formatPrice, formatChange } from '../utils/quotes';

import { useGetPopularStocksQuery } from '@/services/api/financialApi';
import { financialColors } from '@/theme';

export const StocksPage = () => {
  const navigate = useNavigate();
  const { data: popularStocks, isLoading, error, refetch } = useGetPopularStocksQuery();

  // Navigate to stock detail page
  const handleStockClick = (symbol: string) => {
    navigate(`/stocks/${symbol}`);
  };

  // Get color based on change
  const getChangeColor = (change: number) => {
    return change >= 0
      ? financialColors.positive
      : change < 0
        ? financialColors.negative
        : 'text.secondary';
  };

  // Get icon based on change
  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUpIcon fontSize="small" />;
    if (change < 0) return <TrendingDownIcon fontSize="small" />;
    return <TrendingFlatIcon fontSize="small" />;
  };

  return (
    <>
      {/* Header and Search Bar - Clean and prominent */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
          Stocks
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Search for stocks, view detailed information, and analyze performance.
        </Typography>

        <Paper
          elevation={1}
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: '800px' }}>
            <StockSearch placeholder="Search by symbol or company name" size="medium" />
          </Box>

          <Box
            sx={{
              mt: 2,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              justifyContent: 'center',
              width: '100%',
              maxWidth: '800px',
            }}
          >
            {/* Popular search shortcuts */}
            <Chip
              label="AAPL"
              clickable
              onClick={() => handleStockClick('AAPL')}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label="MSFT"
              clickable
              onClick={() => handleStockClick('MSFT')}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label="GOOGL"
              clickable
              onClick={() => handleStockClick('GOOGL')}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label="AMZN"
              clickable
              onClick={() => handleStockClick('AMZN')}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label="TSLA"
              clickable
              onClick={() => handleStockClick('TSLA')}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label="META"
              clickable
              onClick={() => handleStockClick('META')}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Paper>
      </Box>

      {/* Remove market data sections */}

      {/* Popular Stocks Section - Using real API data */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Popular Stocks
          </Typography>
          {error ? (
            <Button
              variant="text"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
            >
              Retry
            </Button>
          ) : (
            <Button variant="text" size="small" endIcon={<ShowChartIcon />}>
              View More
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            Unable to load stock data. Please try again later.
          </Alert>
        ) : popularStocks && popularStocks.length > 0 ? (
          <Grid container spacing={3}>
            {popularStocks.slice(0, 6).map(stock => (
              <Grid item xs={12} sm={6} md={4} key={stock.symbol}>
                <Card
                  sx={{
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3,
                    },
                  }}
                >
                  <CardActionArea onClick={() => handleStockClick(stock.symbol)}>
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                          alignItems: 'flex-start',
                        }}
                      >
                        <Box>
                          <Typography variant="h6" component="div" fontWeight={600}>
                            {stock.symbol}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {stock.name}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" fontWeight={600}>
                            ${formatPrice(stock.price)}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              mt: 0.5,
                            }}
                          >
                            {getChangeIcon(stock.change)}
                            <Typography
                              variant="body2"
                              sx={{
                                ml: 0.5,
                                color: getChangeColor(stock.change),
                                fontWeight: 500,
                              }}
                            >
                              {formatChange(stock.change, stock.changePercent)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">No stock data available at this time.</Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3, mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Recently Viewed
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <RecentlyViewedStocks />
      </Paper>
    </>
  );
};
