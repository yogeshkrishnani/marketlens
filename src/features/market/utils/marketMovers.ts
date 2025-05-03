import { MarketMovers, StockQuote } from '../models';

// Transform raw FMP API data to our domain model
export const transformMarketMoversData = (gainersData: any[], losersData: any[]): MarketMovers => {
  if (!Array.isArray(gainersData) || !Array.isArray(losersData)) {
    return { gainers: [], losers: [] };
  }

  // Helper function to transform API stock data to our model
  const transformStock = (stock: any): StockQuote => {
    return {
      symbol: stock.symbol,
      name: stock.name,
      price: stock.price,
      change: stock.change,
      changePercent: stock.changesPercentage,
      volume: stock.volume || 0,
    };
  };

  // Transform gainers and losers, limiting to 5 each for display
  const gainers = gainersData.slice(0, 5).map(transformStock);
  const losers = losersData.slice(0, 5).map(transformStock);

  return {
    gainers,
    losers,
  };
};
