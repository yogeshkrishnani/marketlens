export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  exchange?: string;
}
