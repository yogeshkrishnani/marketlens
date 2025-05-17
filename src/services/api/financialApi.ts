import { transformMarketMoversData } from '@features/market/utils/marketMovers';
import {
  CompanyProfile,
  HistoricalPrice,
  KeyMetrics,
  StockDetailQuote,
  Timeframe,
} from '@features/stocks/models/stockDetail';
import {
  transformCompanyProfile,
  transformHistoricalPrices,
  transformIntradayPrices,
  transformKeyMetrics,
  transformStockDetailQuote,
} from '@features/stocks/utils/stockDetail';

import { api, ApiTagTypes, FMP_API_KEY, FMP_BASE_URL } from './apiService';

import { MarketIndex, MarketMovers, SectorPerformance, StockQuote } from '@/features/market/models';
import { transformIndicesData } from '@/features/market/utils/indices';
import { transformSectorData } from '@/features/market/utils/sectors';
import { StockSearchResult } from '@/features/stocks/models';
import { transformStockQuotes } from '@/features/stocks/utils/quotes';
import { transformStockSearchResults } from '@/features/stocks/utils/search';

export const POPULAR_STOCK_SYMBOLS = [
  'AAPL',
  'MSFT',
  'GOOGL',
  'AMZN',
  'TSLA',
  'META',
  'NVDA',
  'BRK.B',
  'JPM',
  'JNJ',
];

// Extended API with financial endpoints
export const financialApi = api.injectEndpoints({
  endpoints: builder => ({
    // Get major market indices
    getMarketIndices: builder.query<MarketIndex[], void>({
      query: () => {
        // Use ETFs that track major indices instead of index symbols
        // SPY (S&P 500), QQQ (Nasdaq), DIA (Dow Jones), IWM (Russell 2000)
        return `/quote/SPY,QQQ,DIA,IWM?apikey=${FMP_API_KEY}`;
      },
      transformResponse: (response: any) => {
        return transformIndicesData(response);
      },
      providesTags: [ApiTagTypes.MARKET_DATA],
    }),

    // Get sector performance
    getSectorPerformance: builder.query<SectorPerformance[], void>({
      query: () => {
        return `/sector-performance?apikey=${FMP_API_KEY}`;
      },
      transformResponse: (response: any) => {
        return transformSectorData(response);
      },
      providesTags: [ApiTagTypes.SECTOR_DATA],
    }),

    getMarketMovers: builder.query<MarketMovers, void>({
      query: () => {
        return `/stock_market/gainers?apikey=${FMP_API_KEY}`;
      },
      async transformResponse(gainersResponse: any) {
        // We need to make a second call for losers
        const losersUrl = `${FMP_BASE_URL}/stock_market/losers?apikey=${FMP_API_KEY}`;
        const losersResponse = await fetch(losersUrl).then(res => res.json());

        return transformMarketMoversData(gainersResponse, losersResponse);
      },
      providesTags: [ApiTagTypes.MARKET_DATA],
    }),

    searchStocks: builder.query<StockSearchResult[], string>({
      query: query => {
        // Skip empty queries
        if (!query || query.trim().length < 2) {
          return { url: '', method: 'get' };
        }

        return `/search?query=${encodeURIComponent(query)}&limit=10&apikey=${FMP_API_KEY}`;
      },

      // Transform the response
      transformResponse: (response: any) => {
        // Check if response is valid
        if (!Array.isArray(response)) {
          console.error('Invalid search response format:', response);
          return [];
        }

        return transformStockSearchResults(response);
      },

      // Keep data for 1 minute
      keepUnusedDataFor: 60,
    }),

    getPopularStocks: builder.query<StockQuote[], void>({
      query: () => {
        // Create a comma-separated list of popular stock symbols
        const symbols = POPULAR_STOCK_SYMBOLS.join(',');
        return `/quote/${symbols}?apikey=${FMP_API_KEY}`;
      },
      transformResponse: (response: any) => {
        return transformStockQuotes(response);
      },
      providesTags: [ApiTagTypes.STOCK_DATA],
      // Keep data fresh for 5 minutes
      keepUnusedDataFor: 300,
    }),

    // Get detailed quote information for a specific stock
    getStockQuote: builder.query<StockDetailQuote, string>({
      query: symbol => {
        if (!symbol) {
          throw new Error('Stock symbol is required');
        }
        return `/quote/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}`;
      },
      transformResponse: (response: any) => {
        // API returns an array with a single object
        if (Array.isArray(response) && response.length > 0) {
          return transformStockDetailQuote(response[0]);
        }
        throw new Error('Invalid response format from API');
      },
      providesTags: (result, _error, symbol) =>
        result ? [{ type: ApiTagTypes.STOCK_DATA, id: symbol }] : [ApiTagTypes.STOCK_DATA],
      keepUnusedDataFor: 300, // 5 minutes
    }),

    // Get company profile data
    getCompanyProfile: builder.query<CompanyProfile, string>({
      query: symbol => {
        if (!symbol) {
          throw new Error('Stock symbol is required');
        }
        return `/profile/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}`;
      },
      transformResponse: (response: any) => {
        // API returns an array with a single object
        if (Array.isArray(response) && response.length > 0) {
          return transformCompanyProfile(response[0]);
        }
        throw new Error('Invalid response format from API');
      },
      providesTags: (result, _error, symbol) =>
        result
          ? [{ type: ApiTagTypes.STOCK_DATA, id: `${symbol}-profile` }]
          : [ApiTagTypes.STOCK_DATA],
      keepUnusedDataFor: 3600, // 1 hour (company data changes less frequently)
    }),

    // Get historical price data with customizable timeframe
    getHistoricalPrices: builder.query<HistoricalPrice[], { symbol: string; timeframe: Timeframe }>(
      {
        query: ({ symbol, timeframe }) => {
          if (!symbol) {
            throw new Error('Stock symbol is required');
          }

          // Determine the appropriate endpoint based on timeframe
          let endpoint;
          switch (timeframe) {
            case '1D':
              // Intraday data for 1 day (1-minute intervals)
              endpoint = `/historical-chart/1min/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}`;
              break;
            case '5D':
              // Intraday data for 5 days (5-minute intervals)
              endpoint = `/historical-chart/5min/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}`;
              break;
            case '1M':
              // Daily data for 1 month
              endpoint = `/historical-price-full/${encodeURIComponent(symbol)}?timeseries=30&apikey=${FMP_API_KEY}`;
              break;
            case '3M':
              // Daily data for 3 months
              endpoint = `/historical-price-full/${encodeURIComponent(symbol)}?timeseries=90&apikey=${FMP_API_KEY}`;
              break;
            case '1Y':
              // Daily data for 1 year
              endpoint = `/historical-price-full/${encodeURIComponent(symbol)}?timeseries=365&apikey=${FMP_API_KEY}`;
              break;
            case '5Y':
              // Daily data for 5 years
              endpoint = `/historical-price-full/${encodeURIComponent(symbol)}?timeseries=1825&apikey=${FMP_API_KEY}`;
              break;
            default:
              // Default to 1 month
              endpoint = `/historical-price-full/${encodeURIComponent(symbol)}?timeseries=30&apikey=${FMP_API_KEY}`;
          }

          return endpoint;
        },
        transformResponse: (response: any, _meta, arg) => {
          if (arg.timeframe === '1D' || arg.timeframe === '5D') {
            // Intraday data format
            if (!Array.isArray(response)) {
              throw new Error('Invalid intraday price data format');
            }
            return transformIntradayPrices(response);
          } else {
            // Daily data format
            if (!response || !response.historical || !Array.isArray(response.historical)) {
              throw new Error('Invalid historical price data format');
            }
            return transformHistoricalPrices(response.historical);
          }
        },
        providesTags: (result, _error, arg) =>
          result
            ? [{ type: ApiTagTypes.STOCK_DATA, id: `${arg.symbol}-${arg.timeframe}` }]
            : [ApiTagTypes.STOCK_DATA],
        keepUnusedDataFor: 300, // 5 minutes
      }
    ),

    // Get key financial metrics
    getKeyMetrics: builder.query<KeyMetrics, string>({
      query: symbol => {
        if (!symbol) {
          throw new Error('Stock symbol is required');
        }
        return `/key-metrics/${encodeURIComponent(symbol)}?limit=1&apikey=${FMP_API_KEY}`;
      },
      transformResponse: (response: any) => {
        // API returns an array with metrics objects
        if (Array.isArray(response) && response.length > 0) {
          return transformKeyMetrics(response[0]);
        }
        throw new Error('Invalid response format from API');
      },
      providesTags: (result, _error, symbol) =>
        result
          ? [{ type: ApiTagTypes.STOCK_DATA, id: `${symbol}-metrics` }]
          : [ApiTagTypes.STOCK_DATA],
      keepUnusedDataFor: 3600, // 1 hour
    }),

    getBatchStockQuotes: builder.query<StockDetailQuote[], string[]>({
      query: symbols => {
        return `/quote/${symbols.join(',')}?apikey=${FMP_API_KEY}`;
      },
      transformResponse: (response: any[]) => {
        if (!Array.isArray(response)) {
          return [];
        }
        return response.map(item => transformStockDetailQuote(item));
      },
      providesTags: () => [{ type: ApiTagTypes.STOCK_DATA, id: 'batch-quotes' }],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetBatchStockQuotesQuery,
  useGetCompanyProfileQuery,
  useGetHistoricalPricesQuery,
  useGetKeyMetricsQuery,
  useGetMarketIndicesQuery,
  useGetMarketMoversQuery,
  useGetPopularStocksQuery,
  useGetSectorPerformanceQuery,
  useGetStockQuoteQuery,
  useLazyGetBatchStockQuotesQuery,
  useLazyGetHistoricalPricesQuery,
  useLazyGetKeyMetricsQuery,
  useSearchStocksQuery,
} = financialApi;
