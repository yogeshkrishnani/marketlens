import { MarketMovers, StockQuote } from '../models';

export const transformMarketMoversData = (gainersData: any[], losersData: any[]): MarketMovers => {
  if (!Array.isArray(gainersData) || !Array.isArray(losersData)) {
    return { gainers: [], losers: [] };
  }

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

  const gainers = gainersData.slice(0, 5).map(transformStock);
  const losers = losersData.slice(0, 5).map(transformStock);

  return {
    gainers,
    losers,
  };
};
