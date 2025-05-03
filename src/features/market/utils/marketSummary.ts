// src/features/market/utils/marketSummary.ts

import { MarketIndex } from '../models';
import { SectorPerformance } from '../models';

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

  // Find leading sector (highest absolute performance)
  let leadingSector = '';
  let leadingPerformance = 0;

  if (sectors && sectors.length > 0) {
    // Sort sectors by absolute performance (highest first)
    const sortedSectors = [...sectors].sort(
      (a, b) => Math.abs(b.performance) - Math.abs(a.performance)
    );

    // Get the sector with highest absolute performance
    leadingSector = sortedSectors[0].name;
    leadingPerformance = sortedSectors[0].performance;
  }

  // Generate summary text
  let summaryText = '';

  if (marketTrend === 'up') {
    summaryText = `Markets up ${Math.abs(trendPercentage).toFixed(2)}% with ${leadingSector} sector leading (${leadingPerformance >= 0 ? '+' : ''}${leadingPerformance.toFixed(2)}%)`;
  } else if (marketTrend === 'down') {
    summaryText = `Markets down ${Math.abs(trendPercentage).toFixed(2)}% with ${leadingSector} sector leading (${leadingPerformance >= 0 ? '+' : ''}${leadingPerformance.toFixed(2)}%)`;
  } else {
    summaryText = 'Markets flat today';
  }

  return {
    marketTrend,
    leadingSector,
    trendPercentage,
    summaryText,
    timestamp,
  };
};
