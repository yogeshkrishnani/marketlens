import { MarketIndex, SectorPerformance } from '../models';

export interface MarketSummary {
  marketTrend: 'up' | 'down' | 'neutral';
  leadingSector: string;
  trendPercentage: number;
  summaryText: string;
  timestamp: number | null;
}

export const getMarketSummary = (
  indices: MarketIndex[] | undefined,
  sectors: SectorPerformance[] | undefined
): MarketSummary => {
  const defaultSummary: MarketSummary = {
    marketTrend: 'neutral',
    leadingSector: '',
    trendPercentage: 0,
    summaryText: 'Market data unavailable',
    timestamp: null,
  };

  if (!indices || indices.length === 0) {
    return defaultSummary;
  }

  const spIndex = indices.find(index => index.symbol === 'SPY');

  if (!spIndex) {
    return defaultSummary;
  }

  const timestamp = spIndex.timestamp || Math.floor(Date.now() / 1000);

  const marketTrend = spIndex.change > 0 ? 'up' : spIndex.change < 0 ? 'down' : 'neutral';
  const trendPercentage = spIndex.changePercent;

  let topPerformingSector = '';
  let topPerformance = -Infinity;
  let worstPerformingSector = '';
  let worstPerformance = Infinity;

  if (sectors && sectors.length > 0) {
    sectors.forEach(sector => {
      if (sector.performance > topPerformance) {
        topPerformance = sector.performance;
        topPerformingSector = sector.name;
      }
      if (sector.performance < worstPerformance) {
        worstPerformance = sector.performance;
        worstPerformingSector = sector.name;
      }
    });
  }

  let summaryText = '';

  if (marketTrend === 'up') {
    summaryText = `Markets up ${Math.abs(trendPercentage).toFixed(2)}% with ${topPerformingSector} leading (+${topPerformance.toFixed(2)}%)`;
  } else if (marketTrend === 'down') {
    if (topPerformance > 0) {
      summaryText = `Markets down ${Math.abs(trendPercentage).toFixed(2)}% with ${topPerformingSector} outperforming (+${topPerformance.toFixed(2)}%)`;
    } else {
      summaryText = `Markets down ${Math.abs(trendPercentage).toFixed(2)}% with ${worstPerformingSector} hardest hit (${worstPerformance.toFixed(2)}%)`;
    }
  } else {
    summaryText = 'Markets flat today';
  }

  return {
    marketTrend,
    leadingSector: marketTrend === 'up' ? topPerformingSector : worstPerformingSector,
    trendPercentage,
    summaryText,
    timestamp,
  };
};
