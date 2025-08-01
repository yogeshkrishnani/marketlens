export type Timeframe = '1D' | '5D' | '1M' | '3M' | '1Y' | '5Y';

// Detailed stock quote information
export interface StockDetailQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  volume: number;
  avgVolume: number;
  pe: number | null;
  eps: number | null;
  beta: number | null;
  dividend: number | null;
  dividendYield: number | null;
  nextEarningsDate: string | null;
  open: number;
  previousClose: number;
  timestamp: number;
  exchange: string;
}

// Company profile information
export interface CompanyProfile {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  employees: number;
  ceo: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  ipoDate: string | null;
  exchange: string;
  exchangeSymbol: string;
  currency: string;
  logo: string | null;
}

// Historical price data point
export interface HistoricalPrice {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Key financial metrics
export interface KeyMetrics {
  date: string;
  marketCap: number;
  peRatio: number | null;
  pbRatio: number | null;
  dividendYield: number | null;
  roe: number | null;
  roa: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  enterpriseValue: number | null;
  evToRevenue: number | null;
  evToEbitda: number | null;
  earningsYield: number | null;
  freeCashFlowYield: number | null;
  payoutRatio: number | null;
  priceToBookRatio: number | null;
  priceToSalesRatio: number | null;
  grahamNumber: number | null;
}
