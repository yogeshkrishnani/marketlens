import { StockSearchResult } from '../models';

/**
 * Transform stock search API results to app model
 */
export const transformStockSearchResults = (response: any[]): StockSearchResult[] => {
  if (!Array.isArray(response)) {
    return [];
  }

  // Filter out invalid entries and transform to our model
  return (
    response
      .filter(item => item.symbol && item.name)
      .map(item => ({
        symbol: item.symbol,
        name: item.name,
        exchange: item.exchangeShortName || item.stockExchange || '',
        type: item.type || 'Stock',
      }))
      // Only return stocks and ETFs, filter out indices, mutual funds, etc.
      .filter(
        result => result.type === 'Stock' || result.type === 'ETF' || !result.type // Include items with no type specified
      )
  );
};
