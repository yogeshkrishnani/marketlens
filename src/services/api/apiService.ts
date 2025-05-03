import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define tag types for cache invalidation
export const ApiTagTypes = {
  MARKET_DATA: 'MarketData',
  STOCK_DATA: 'StockData',
  SECTOR_DATA: 'SectorData',
  MARKET_MOVERS: 'MarketMovers',
} as const;

// FMP API configuration
export const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || 'demo';
export const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Create API service with base configuration
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: FMP_BASE_URL,
    prepareHeaders: headers => {
      // Add any custom headers here
      return headers;
    },
  }),
  tagTypes: Object.values(ApiTagTypes),
  endpoints: () => ({}),
});

// Helper functions for API error handling
export const isErrorWithMessage = (error: unknown): error is { message: string } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
};

export const getErrorMessage = (error: unknown): string => {
  if (isErrorWithMessage(error)) return error.message;
  return 'An unknown error occurred';
};
