// src/features/stocks/pages/StockDetailPage.tsx

import { CompanyProfile } from '@features/stocks/components/CompanyProfile';
import { useRecentlyViewedStocks } from '@hooks/useRecentlyViewedStocks';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Grid,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { StockPriceChart } from '../components/StockPriceChart';
import { Timeframe } from '../models/stockDetail';
import { formatPrice, formatCompactNumber, formatChange } from '../utils/stockDetail';

import {
  useGetStockQuoteQuery,
  useGetCompanyProfileQuery,
  useGetHistoricalPricesQuery,
  useGetKeyMetricsQuery,
} from '@/services/api/financialApi';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const StockDetailPage = () => {
  const { symbol = '' } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [tabIndex, setTabIndex] = useState(0);

  const { addViewedStock } = useRecentlyViewedStocks();

  // Fetch stock data from API
  const {
    data: stockQuote,
    isLoading: isQuoteLoading,
    error: quoteError,
  } = useGetStockQuoteQuery(symbol);

  const {
    data: companyProfile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useGetCompanyProfileQuery(symbol);

  const {
    data: historicalPrices,
    isLoading: isPricesLoading,
    error: pricesError,
  } = useGetHistoricalPricesQuery({ symbol, timeframe });

  const {
    data: keyMetrics,
    isLoading: isMetricsLoading,
    error: metricsError,
  } = useGetKeyMetricsQuery(symbol);

  useEffect(() => {
    if (stockQuote && !isQuoteLoading) {
      // Add this stock to recently viewed
      // Use a reference check to break the dependency cycle
      const stockInfo = {
        symbol: stockQuote.symbol,
        name: stockQuote.name,
      };

      // Only add to recently viewed if we have valid data
      addViewedStock(stockInfo);
    }
  }, [stockQuote?.symbol]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe);
  };

  // Navigate back to stocks page
  const handleBackClick = () => {
    navigate('/stocks');
  };

  // Main loading state
  const isLoading = isQuoteLoading || isPricesLoading;

  // Main error state
  const hasError = quoteError || pricesError;

  return (
    <Box>
      {/* Back button */}
      <Button startIcon={<ArrowBackIcon />} onClick={handleBackClick} sx={{ mb: 2 }}>
        Back to Stocks
      </Button>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : hasError ? (
        <Alert severity="error" sx={{ mb: 4 }}>
          Error loading stock data. Please try again later.
        </Alert>
      ) : stockQuote ? (
        <>
          {/* Stock Header */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h4" component="h1" fontWeight={600}>
                    {stockQuote.symbol}
                  </Typography>
                  <Chip label={stockQuote.exchange} size="small" sx={{ ml: 2 }} />
                </Box>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  {stockQuote.name}
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h4" component="div" fontWeight={600}>
                  ${formatPrice(stockQuote.price)}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: stockQuote.change >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 500,
                  }}
                >
                  {formatChange(stockQuote.change, stockQuote.changePercent)}
                </Typography>
              </Box>
            </Box>

            {/* Stock Stats Row */}
            <Box sx={{ mt: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="body2" color="text.secondary">
                    Market Cap
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    ${formatCompactNumber(stockQuote.marketCap)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="body2" color="text.secondary">
                    P/E Ratio
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {stockQuote.pe ? formatPrice(stockQuote.pe, 2) : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="body2" color="text.secondary">
                    Volume
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formatCompactNumber(stockQuote.volume)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="body2" color="text.secondary">
                    Day Range
                  </Typography>
                  <Typography variant="body1" fontWeight={500} noWrap>
                    ${formatPrice(stockQuote.dayLow)} - ${formatPrice(stockQuote.dayHigh)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="body2" color="text.secondary">
                    52-Week Range
                  </Typography>
                  <Typography variant="body1" fontWeight={500} noWrap>
                    ${formatPrice(stockQuote.yearLow)} - ${formatPrice(stockQuote.yearHigh)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="body2" color="text.secondary">
                    Dividend Yield
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {stockQuote.dividendYield
                      ? `${(stockQuote.dividendYield * 100).toFixed(2)}%`
                      : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Tabs for different data sections */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Overview" id="tab-0" aria-controls="tabpanel-0" />
              <Tab label="Financials" id="tab-1" aria-controls="tabpanel-1" />
              <Tab label="News" id="tab-2" aria-controls="tabpanel-2" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              <TabPanel value={tabIndex} index={0}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Price Chart
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {/* Timeframe selector */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      {(['1D', '5D', '1M', '3M', '1Y', '5Y'] as Timeframe[]).map(option => (
                        <Button
                          key={option}
                          variant={timeframe === option ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handleTimeframeChange(option)}
                          sx={{
                            minWidth: '48px',
                            fontWeight: timeframe === option ? 600 : 400,
                            borderRadius: 1.5,
                            ...(timeframe === option
                              ? {}
                              : { borderColor: 'divider', color: 'text.primary' }),
                          }}
                        >
                          {option}
                        </Button>
                      ))}
                    </Box>

                    {isPricesLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} />
                      </Box>
                    ) : pricesError ? (
                      <Alert severity="error">Error loading price data.</Alert>
                    ) : historicalPrices && historicalPrices.length > 0 ? (
                      <StockPriceChart
                        data={historicalPrices}
                        timeframe={timeframe}
                        currencySymbol="$"
                        symbol={symbol}
                      />
                    ) : (
                      <Alert severity="info">No price history available for this timeframe.</Alert>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Company Profile */}
                <CompanyProfile
                  profile={companyProfile}
                  isLoading={isProfileLoading}
                  error={profileError}
                />
              </TabPanel>

              <TabPanel value={tabIndex} index={1}>
                {/* Financials tab content */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Key Metrics
                  </Typography>

                  {isMetricsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : metricsError ? (
                    <Alert severity="error">Error loading financial metrics.</Alert>
                  ) : keyMetrics ? (
                    <Box>
                      {/* We'll replace this with the KeyMetricsTable component later */}
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            P/E Ratio
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {keyMetrics.peRatio ? keyMetrics.peRatio.toFixed(2) : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            P/B Ratio
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {keyMetrics.pbRatio ? keyMetrics.pbRatio.toFixed(2) : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            ROE
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {keyMetrics.roe ? `${(keyMetrics.roe * 100).toFixed(2)}%` : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            Debt to Equity
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {keyMetrics.debtToEquity ? keyMetrics.debtToEquity.toFixed(2) : 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  ) : (
                    <Alert severity="info">No financial metrics available.</Alert>
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={tabIndex} index={2}>
                {/* News tab content - to be implemented later */}
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography>News feed will be implemented in a future update.</Typography>
                </Box>
              </TabPanel>
            </Box>
          </Paper>
        </>
      ) : (
        <Alert severity="info">No data found for symbol: {symbol}</Alert>
      )}
    </Box>
  );
};
