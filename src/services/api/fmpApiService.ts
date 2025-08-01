import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export enum ApiTagTypes {
  MARKET_DATA = 'MARKET_DATA',
  STOCK_DATA = 'STOCK_DATA',
  PORTFOLIO_DATA = 'PORTFOLIO_DATA',
  WATCHLIST_DATA = 'WATCHLIST_DATA',
}

export const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || 'demo';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

export const api = createApi({
  reducerPath: 'fmpApi',
  baseQuery: fetchBaseQuery({
    baseUrl: FMP_BASE_URL,
  }),
  tagTypes: Object.values(ApiTagTypes),
  endpoints: () => ({}),
});
