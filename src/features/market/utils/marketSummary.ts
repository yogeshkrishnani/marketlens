// src/features/market/utils/marketSummary.ts

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
  // Default values if data is not available
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

  // Use S&P 500 (SPY) as the market indicator
  const spIndex = indices.find(index => index.symbol === 'SPY');

  if (!spIndex) {
    return defaultSummary;
  }

  // Get timestamp from the data
  const timestamp = spIndex.timestamp || Math.floor(Date.now() / 1000);

  // Determine market trend
  const marketTrend = spIndex.change > 0 ? 'up' : spIndex.change < 0 ? 'down' : 'neutral';
  const trendPercentage = spIndex.changePercent;

  // Find notable sectors
  let topPerformingSector = '';
  let topPerformance = -Infinity;
  let worstPerformingSector = '';
  let worstPerformance = Infinity;

  if (sectors && sectors.length > 0) {
    // Find best and worst performing sectors
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

  // Generate summary text
  let summaryText = '';

  if (marketTrend === 'up') {
    summaryText = `Markets up ${Math.abs(trendPercentage).toFixed(2)}% with ${topPerformingSector} leading (+${topPerformance.toFixed(2)}%)`;
  } else if (marketTrend === 'down') {
    // When markets are down, highlight the best performing sector if positive, otherwise the worst hit sector
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
