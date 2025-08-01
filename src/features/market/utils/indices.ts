import { MarketIndex } from '../models';

export const getIndexName = (symbol: string): string => {
  const mapping: Record<string, string> = {
    SPY: 'S&P 500',
    QQQ: 'Nasdaq',
    DIA: 'Dow Jones',
    IWM: 'Russell 2000',
  };
  return mapping[symbol] || symbol;
};

export const transformIndicesData = (response: any[]): MarketIndex[] => {
  if (!Array.isArray(response)) {
    return [];
  }

  const symbolToName: Record<string, string> = {
    SPY: 'S&P 500',
    QQQ: 'Nasdaq',
    DIA: 'Dow Jones',
    IWM: 'Russell 2000',
  };

  return response.map(item => {
    const name = symbolToName[item.symbol] || item.name;

    const timestamp = item.timestamp || Math.floor(Date.now() / 1000);

    return {
      symbol: item.symbol,
      name: name,
      price: item.price,
      change: item.change,
      changePercent: item.changesPercentage,
      timestamp: timestamp,
    };
  });
};

export const formatIndexPrice = (price: number): string => {
  return price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatIndexChange = (change: number, changePercent: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
};
