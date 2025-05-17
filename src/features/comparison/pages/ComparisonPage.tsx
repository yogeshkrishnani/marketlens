import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { ComparisonMetricsTable } from '../components/ComparisonMetricsTable';
import { ComparisonPriceChart } from '../components/ComparisonPriceChart';
import { useComparison } from '../context/ComparisonContext';

import { HistoricalPrice, KeyMetrics, Timeframe } from '@/features/stocks/models/stockDetail';
import {
  useGetBatchStockQuotesQuery,
  useLazyGetBatchStockQuotesQuery,
  useLazyGetHistoricalPricesQuery,
  useLazyGetKeyMetricsQuery,
} from '@/services/api/financialApi';

export const ComparisonPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { comparisonList, removeFromComparison, addMultipleStocks } = useComparison();
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [activeTab, setActiveTab] = useState<number>(0);

  // Ref to track initial render
  const initialRenderRef = useRef(true);
  const urlProcessedRef = useRef(false);

  // State to store historical price data
  const [historicalPrices, setHistoricalPrices] = useState<{ [symbol: string]: HistoricalPrice[] }>(
    {}
  );
  const [isPricesLoading, setIsPricesLoading] = useState(false);
  const [pricesError, setPricesError] = useState<unknown>(null);

  // State to store metrics data
  const [metricsData, setMetricsData] = useState<{ [symbol: string]: KeyMetrics }>({});
  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<unknown>(null);

  // Parse URL parameters on initial load
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const symbolsParam = useMemo(() => params.get('symbols') || '', [params]);
  const urlSymbols = useMemo(() => symbolsParam.split(',').filter(Boolean), [symbolsParam]);

  // Lazy query for fetching batch quotes - needed for URL symbol resolution
  const [fetchBatchQuotes] = useLazyGetBatchStockQuotesQuery();

  // Process URL symbols on mount
  useEffect(() => {
    // Only process URL symbols once and only if there are symbols in the URL
    if (!urlProcessedRef.current && urlSymbols.length > 0) {
      const processUrlSymbols = async () => {
        try {
          // Fetch stock details for the symbols from URL
          const quotesResult = await fetchBatchQuotes(urlSymbols).unwrap();

          if (quotesResult && quotesResult.length > 0) {
            // Convert quote results to ComparisonStock objects
            const stocksToAdd = quotesResult
              .filter((quote: { symbol: string }) => urlSymbols.includes(quote.symbol))
              .map((quote: { symbol: string; name: string }) => ({
                symbol: quote.symbol,
                name: quote.name || quote.symbol,
              }));

            // Add all stocks at once with proper colors
            if (stocksToAdd.length > 0) {
              addMultipleStocks(stocksToAdd);
            }
          }
        } catch (error) {
          console.error('Error processing URL symbols:', error);
        }

        // Mark URL as processed
        urlProcessedRef.current = true;
      };

      processUrlSymbols();
    }
  }, [urlSymbols, fetchBatchQuotes, addMultipleStocks]);

  // Get stock symbols from the comparison list - MEMOIZED to prevent unnecessary recalculations
  const stockSymbols = useMemo(() => comparisonList.map(stock => stock.symbol), [comparisonList]);

  // Fetch quotes for all stocks
  const {
    data: stockQuotes,
    isLoading: isQuotesLoading,
    error: quotesError,
  } = useGetBatchStockQuotesQuery(stockSymbols, {
    skip: stockSymbols.length === 0,
  });

  // Create lazy queries for historical prices and metrics
  const [fetchHistoricalPrices, { isFetching: isFetchingHistory }] =
    useLazyGetHistoricalPricesQuery();
  const [fetchKeyMetrics, { isFetching: isFetchingMetrics }] = useLazyGetKeyMetricsQuery();

  // Memoized handlers to prevent re-renders
  const handleTimeframeChange = useCallback((newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe);
  }, []);

  const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const updateUrlWithCurrentStocks = useCallback(() => {
    const symbols = comparisonList.map(stock => stock.symbol).join(',');

    // Only update if the symbols changed to avoid unnecessary navigation
    if (symbols !== searchParams.get('symbols')) {
      setSearchParams({ symbols }, { replace: true });
    }
  }, [comparisonList, searchParams, setSearchParams]);

  useEffect(() => {
    // Skip URL update during initial URL processing
    if (urlSymbols.length > 0 && !urlProcessedRef.current) {
      return;
    }

    // Don't update URL if we have no stocks yet
    if (comparisonList.length === 0) {
      return;
    }

    updateUrlWithCurrentStocks();
  }, [comparisonList, updateUrlWithCurrentStocks, urlSymbols, urlProcessedRef]);

  // Handle removing a stock from comparison
  const handleRemoveStock = useCallback(
    (symbol: string) => {
      removeFromComparison(symbol);

      // If this was the last stock, navigate back to stocks page
      if (comparisonList.length <= 1) {
        setTimeout(() => navigate('/stocks'), 100);
      } else {
        // Otherwise update the URL with the new stock list (after stock is removed)
        setTimeout(updateUrlWithCurrentStocks, 0);
      }
    },
    [removeFromComparison, comparisonList.length, navigate, updateUrlWithCurrentStocks]
  );

  // Effect to fetch historical prices when symbols or timeframe changes
  useEffect(() => {
    // Skip on initial render
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    if (stockSymbols.length === 0) return;

    let isMounted = true;

    const fetchAllHistoricalData = async () => {
      setIsPricesLoading(true);
      setPricesError(null);

      const newHistoricalPrices: { [symbol: string]: HistoricalPrice[] } = {};
      let hasError = false;

      try {
        // Fetch historical data for each stock
        await Promise.all(
          stockSymbols.map(async symbol => {
            try {
              const result = await fetchHistoricalPrices({
                symbol,
                timeframe,
              }).unwrap();

              if (isMounted) {
                newHistoricalPrices[symbol] = result;
              }
            } catch (error) {
              console.error(`Error fetching historical data for ${symbol}:`, error);
              if (isMounted) {
                hasError = true;
                newHistoricalPrices[symbol] = [];
              }
            }
          })
        );

        if (isMounted) {
          setHistoricalPrices(newHistoricalPrices);
          setIsPricesLoading(false);

          if (hasError) {
            setPricesError(new Error('Failed to fetch historical data for one or more stocks'));
          }
        }
      } catch (e) {
        if (isMounted) {
          setIsPricesLoading(false);
          setPricesError(e);
        }
      }
    };

    fetchAllHistoricalData();

    return () => {
      isMounted = false;
    };
  }, [stockSymbols, timeframe, fetchHistoricalPrices]);

  // Initial fetch of data - happens once when component mounts
  useEffect(() => {
    // Wait until URL symbols have been processed
    if (urlSymbols.length > 0 && !urlProcessedRef.current) {
      return;
    }

    if (stockSymbols.length === 0) return;

    let isMounted = true;

    const fetchInitialData = async () => {
      setIsPricesLoading(true);
      setIsMetricsLoading(true);
      setPricesError(null);
      setMetricsError(null);

      const newHistoricalPrices: { [symbol: string]: HistoricalPrice[] } = {};
      const newMetricsData: { [symbol: string]: KeyMetrics } = {};
      let hasHistoricalError = false;
      let hasMetricsError = false;

      try {
        // Fetch both historical data and metrics in parallel
        await Promise.all([
          // Historical data
          ...stockSymbols.map(async symbol => {
            try {
              const result = await fetchHistoricalPrices({
                symbol,
                timeframe,
              }).unwrap();

              if (isMounted) {
                newHistoricalPrices[symbol] = result;
              }
            } catch (error) {
              console.error(`Error fetching historical data for ${symbol}:`, error);
              if (isMounted) {
                hasHistoricalError = true;
                newHistoricalPrices[symbol] = [];
              }
            }
          }),

          // Metrics data
          ...stockSymbols.map(async symbol => {
            try {
              const result = await fetchKeyMetrics(symbol).unwrap();
              if (isMounted && result) {
                newMetricsData[symbol] = result;
              }
            } catch (error) {
              console.error(`Error fetching metrics for ${symbol}:`, error);
              if (isMounted) {
                hasMetricsError = true;
              }
            }
          }),
        ]);

        if (isMounted) {
          setHistoricalPrices(newHistoricalPrices);
          setMetricsData(newMetricsData);
          setIsPricesLoading(false);
          setIsMetricsLoading(false);

          if (hasHistoricalError) {
            setPricesError(new Error('Failed to fetch historical data for one or more stocks'));
          }

          if (hasMetricsError) {
            setMetricsError(new Error('Failed to fetch metrics for one or more stocks'));
          }
        }
      } catch (e) {
        if (isMounted) {
          setIsPricesLoading(false);
          setIsMetricsLoading(false);
          setPricesError(e);
          setMetricsError(e);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [stockSymbols, fetchHistoricalPrices, fetchKeyMetrics, timeframe, urlSymbols]);

  // Effect to update timeframe
  useEffect(() => {
    if (initialRenderRef.current || stockSymbols.length === 0) return;

    let isMounted = true;

    const updateTimeframe = async () => {
      setIsPricesLoading(true);
      setPricesError(null);

      const newHistoricalPrices: { [symbol: string]: HistoricalPrice[] } = {};
      let hasError = false;

      try {
        await Promise.all(
          stockSymbols.map(async symbol => {
            try {
              const result = await fetchHistoricalPrices({
                symbol,
                timeframe,
              }).unwrap();

              if (isMounted) {
                newHistoricalPrices[symbol] = result;
              }
            } catch (error) {
              console.error(`Error fetching historical data for ${symbol}:`, error);
              if (isMounted) {
                hasError = true;
                newHistoricalPrices[symbol] = [];
              }
            }
          })
        );

        if (isMounted) {
          setHistoricalPrices(newHistoricalPrices);
          setIsPricesLoading(false);

          if (hasError) {
            setPricesError(new Error('Failed to fetch historical data for one or more stocks'));
          }
        }
      } catch (e) {
        if (isMounted) {
          setIsPricesLoading(false);
          setPricesError(e);
        }
      }
    };

    updateTimeframe();

    return () => {
      isMounted = false;
    };
  }, [timeframe, stockSymbols, fetchHistoricalPrices]);

  // Overall loading state
  const isLoading =
    isQuotesLoading ||
    isPricesLoading ||
    isMetricsLoading ||
    isFetchingHistory ||
    isFetchingMetrics;

  // Overall error state
  const hasError = quotesError || pricesError || metricsError;

  // No stocks selected
  if (stockSymbols.length === 0) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back
        </Button>

        <Alert severity="info" sx={{ mb: 3 }}>
          No stocks selected for comparison. Please add stocks from the stock detail pages.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
        Back
      </Button>

      <Typography variant="h4" gutterBottom>
        Stock Comparison
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : hasError ? (
        <Alert severity="error" sx={{ mb: 4 }}>
          Error loading comparison data. Please try again later.
        </Alert>
      ) : stockQuotes && stockQuotes.length > 0 ? (
        <>
          {/* Stock Chips */}
          <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {comparisonList.map(stock => (
              <Chip
                key={stock.symbol}
                label={`${stock.symbol} - ${stock.name}`}
                sx={{
                  borderLeft: `4px solid ${stock.color}`,
                  pl: 0.5,
                }}
                onClick={() => navigate(`/stocks/${stock.symbol}`)}
                onDelete={() => handleRemoveStock(stock.symbol)}
              />
            ))}
          </Box>

          {/* Tab Navigation */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Performance" />
              <Tab label="Key Metrics" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 ? (
                /* Performance Tab */
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Price Performance
                  </Typography>

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

                  {/* Comparison Chart */}
                  <ComparisonPriceChart
                    data={historicalPrices}
                    stocks={comparisonList}
                    timeframe={timeframe}
                  />
                </Box>
              ) : (
                /* Key Metrics Tab */
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Financial Metrics Comparison
                  </Typography>

                  <ComparisonMetricsTable
                    stocks={comparisonList}
                    quotes={stockQuotes}
                    metrics={metricsData}
                  />
                </Box>
              )}
            </Box>
          </Paper>
        </>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          No data found for the selected stocks.
        </Alert>
      )}
    </Box>
  );
};
