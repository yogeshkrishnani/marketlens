import { StockSearchResult } from '../models';

export const transformStockSearchResults = (response: any[]): StockSearchResult[] => {
  if (!Array.isArray(response)) {
    return [];
  }

  return response
    .filter(item => item.symbol && item.name)
    .map(item => ({
      symbol: item.symbol,
      name: item.name,
      exchange: item.exchangeShortName || item.stockExchange || '',
      type: item.type || 'Stock',
    }))
    .filter(result => result.type === 'Stock' || result.type === 'ETF' || !result.type);
};
