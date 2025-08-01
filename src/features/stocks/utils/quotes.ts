import { StockQuote } from '../models';

export const transformStockQuotes = (response: any[]): StockQuote[] => {
  if (!Array.isArray(response)) {
    return [];
  }

  return response
    .filter(item => item.symbol && item.name)
    .map(item => ({
      symbol: item.symbol,
      name: item.name,
      price: item.price || 0,
      change: item.change || 0,
      changePercent: item.changesPercentage || 0,
      volume: item.volume || 0,
      marketCap: item.marketCap,
      exchange: item.exchange || '',
    }));
};

export const formatPrice = (price: number): string => {
  return price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatChange = (change: number, changePercent: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
};
