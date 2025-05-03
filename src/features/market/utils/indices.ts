import { MarketIndex } from '../models';

// Map ETF symbols to index names
export const getIndexName = (symbol: string): string => {
  const mapping: Record<string, string> = {
    SPY: 'S&P 500',
    QQQ: 'Nasdaq',
    DIA: 'Dow Jones',
    IWM: 'Russell 2000',
  };
  return mapping[symbol] || symbol;
};

// Transform FMP API index data to our domain model
// src/features/market/utils/indices.ts
// Update the transformIndicesData function to keep the original timestamp

export const transformIndicesData = (response: any[]): MarketIndex[] => {
  if (!Array.isArray(response)) {
    return [];
  }

  // Map ETF symbols to index names
  const symbolToName: Record<string, string> = {
    SPY: 'S&P 500',
    QQQ: 'Nasdaq',
    DIA: 'Dow Jones',
    IWM: 'Russell 2000',
  };

  return response.map(item => {
    // Get name from our mapping or fallback to symbol
    const name = symbolToName[item.symbol] || item.name;

    // Store the Unix timestamp directly
    const timestamp = item.timestamp || Math.floor(Date.now() / 1000);

    return {
      symbol: item.symbol,
      name: name,
      price: item.price,
      change: item.change,
      changePercent: item.changesPercentage,
      timestamp: timestamp, // Store Unix timestamp directly
    };
  });
};

// Format market index price for display
export const formatIndexPrice = (price: number): string => {
  return price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Format market index change for display
export const formatIndexChange = (change: number, changePercent: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
};
