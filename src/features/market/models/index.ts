// Market Indices Models
export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number; // Unix timestamp
}

// Sector Performance Models
export interface SectorPerformance {
  name: string;
  performance: number;
}

// Stock Quote Models
export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

// Market Movers Models
export interface MarketMovers {
  gainers: StockQuote[];
  losers: StockQuote[];
}
