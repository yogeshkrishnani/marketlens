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

export const financialApi = api.injectEndpoints({
  endpoints: builder => ({
    getMarketIndices: builder.query<MarketIndex[], void>({
      query: () => {
        return `/quote/SPY,QQQ,DIA,IWM?apikey=${FMP_API_KEY}`;
      },
      transformResponse: (response: any) => {
        return transformIndicesData(response);
      },
      providesTags: [ApiTagTypes.MARKET_DATA],
    }),

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
        const losersUrl = `${FMP_BASE_URL}/stock_market/losers?apikey=${FMP_API_KEY}`;
        const losersResponse = await fetch(losersUrl).then(res => res.json());

        return transformMarketMoversData(gainersResponse, losersResponse);
      },
      providesTags: [ApiTagTypes.MARKET_DATA],
    }),

    searchStocks: builder.query<StockSearchResult[], string>({
      query: query => {
        if (!query || query.trim().length < 2) {
          return { url: '', method: 'get' };
        }

        return `/search?query=${encodeURIComponent(query)}&limit=10&apikey=${FMP_API_KEY}`;
      },

      transformResponse: (response: any) => {
        if (!Array.isArray(response)) {
          console.error('Invalid search response format:', response);
          return [];
        }

        return transformStockSearchResults(response);
      },

      keepUnusedDataFor: 60,
    }),

    getPopularStocks: builder.query<StockQuote[], void>({
      query: () => {
        const symbols = POPULAR_STOCK_SYMBOLS.join(',');
        return `/quote/${symbols}?apikey=${FMP_API_KEY}`;
      },
      transformResponse: (response: any) => {
        return transformStockQuotes(response);
      },
      providesTags: [ApiTagTypes.STOCK_DATA],
      keepUnusedDataFor: 300,
    }),

    getStockQuote: builder.query<StockDetailQuote, string>({
      query: symbol => {
        if (!symbol) {
          throw new Error('Stock symbol is required');
        }
        return `/quote/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}`;
      },
      transformResponse: (response: any) => {
        if (Array.isArray(response) && response.length > 0) {
          return transformStockDetailQuote(response[0]);
        }
        throw new Error('Invalid response format from API');
      },
      providesTags: (result, _error, symbol) =>
        result ? [{ type: ApiTagTypes.STOCK_DATA, id: symbol }] : [ApiTagTypes.STOCK_DATA],
      keepUnusedDataFor: 300,
    }),

    getCompanyProfile: builder.query<CompanyProfile, string>({
      query: symbol => {
        if (!symbol) {
          throw new Error('Stock symbol is required');
        }
        return `/profile/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}`;
      },
      transformResponse: (response: any) => {
        if (Array.isArray(response) && response.length > 0) {
          return transformCompanyProfile(response[0]);
        }
        throw new Error('Invalid response format from API');
      },
      providesTags: (result, _error, symbol) =>
        result
          ? [{ type: ApiTagTypes.STOCK_DATA, id: `${symbol}-profile` }]
          : [ApiTagTypes.STOCK_DATA],
      keepUnusedDataFor: 3600,
    }),

    getHistoricalPrices: builder.query<HistoricalPrice[], { symbol: string; timeframe: Timeframe }>(
      {
        query: ({ symbol, timeframe }) => {
          if (!symbol) {
            throw new Error('Stock symbol is required');
          }

          let endpoint;
          switch (timeframe) {
            case '1D':
              endpoint = `/historical-chart/1min/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}`;
              break;
            case '5D':
              endpoint = `/historical-chart/5min/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}`;
              break;
            case '1M':
              endpoint = `/historical-price-full/${encodeURIComponent(symbol)}?timeseries=30&apikey=${FMP_API_KEY}`;
              break;
            case '3M':
              endpoint = `/historical-price-full/${encodeURIComponent(symbol)}?timeseries=90&apikey=${FMP_API_KEY}`;
              break;
            case '1Y':
              endpoint = `/historical-price-full/${encodeURIComponent(symbol)}?timeseries=365&apikey=${FMP_API_KEY}`;
              break;
            case '5Y':
              endpoint = `/historical-price-full/${encodeURIComponent(symbol)}?timeseries=1825&apikey=${FMP_API_KEY}`;
              break;
            default:
              endpoint = `/historical-price-full/${encodeURIComponent(symbol)}?timeseries=30&apikey=${FMP_API_KEY}`;
          }

          return endpoint;
        },
        transformResponse: (response: any, _meta, arg) => {
          if (arg.timeframe === '1D' || arg.timeframe === '5D') {
            if (!Array.isArray(response)) {
              throw new Error('Invalid intraday price data format');
            }
            return transformIntradayPrices(response);
          } else {
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
        keepUnusedDataFor: 300,
      }
    ),

    getKeyMetrics: builder.query<KeyMetrics, string>({
      query: symbol => {
        if (!symbol) {
          throw new Error('Stock symbol is required');
        }
        return `/key-metrics/${encodeURIComponent(symbol)}?limit=1&apikey=${FMP_API_KEY}`;
      },
      transformResponse: (response: any) => {
        if (Array.isArray(response) && response.length > 0) {
          return transformKeyMetrics(response[0]);
        }
        throw new Error('Invalid response format from API');
      },
      providesTags: (result, _error, symbol) =>
        result
          ? [{ type: ApiTagTypes.STOCK_DATA, id: `${symbol}-metrics` }]
          : [ApiTagTypes.STOCK_DATA],
      keepUnusedDataFor: 3600,
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
