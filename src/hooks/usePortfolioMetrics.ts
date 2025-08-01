import { useMemo } from 'react';

import {
  Portfolio,
  PortfolioWithMetrics,
  Position,
  PositionWithMarketData,
} from '@/features/portfolio/models';
import { StockDetailQuote } from '@/features/stocks/models/stockDetail';

const calculatePositionMetrics = (
  position: Position,
  currentPrice: number,
  dayChange: number,
  dayChangePercent: number
): PositionWithMarketData => {
  const currentValue = position.shares * currentPrice;
  const costBasis = position.shares * position.purchasePrice;
  const gainLoss = currentValue - costBasis;
  const gainLossPercent = (gainLoss / costBasis) * 100;

  return {
    ...position,
    currentPrice,
    currentValue,
    costBasis,
    gainLoss,
    gainLossPercent,
    dayChange: position.shares * dayChange,
    dayChangePercent,
  };
};

const calculatePortfolioMetrics = (
  portfolio: Portfolio,
  positionsWithMarketData: PositionWithMarketData[]
): PortfolioWithMetrics => {
  const totalValue = positionsWithMarketData.reduce((sum, pos) => sum + pos.currentValue, 0);
  const totalCostBasis = positionsWithMarketData.reduce((sum, pos) => sum + pos.costBasis, 0);
  const totalGainLoss = totalValue - totalCostBasis;
  const totalGainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;
  const dayChange = positionsWithMarketData.reduce((sum, pos) => sum + pos.dayChange, 0);
  const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

  return {
    ...portfolio,
    totalValue,
    totalCostBasis,
    totalGainLoss,
    totalGainLossPercent,
    dayChange,
    dayChangePercent,
    positionsWithMarketData,
  };
};

export function usePortfolioMetrics(
  portfolio: Portfolio | null,
  stockQuotes: StockDetailQuote[] | undefined
): PortfolioWithMetrics | null {
  return useMemo(() => {
    if (!portfolio || !stockQuotes) {
      return null;
    }

    if (portfolio.positions.length === 0) {
      return {
        ...portfolio,
        totalValue: 0,
        totalCostBasis: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
        positionsWithMarketData: [],
      };
    }

    const quotesLookup: Record<string, StockDetailQuote> = {};
    stockQuotes.forEach(quote => {
      quotesLookup[quote.symbol] = quote;
    });

    const positionsWithMarketData = portfolio.positions.map(position => {
      const quote = quotesLookup[position.symbol];
      if (quote) {
        return calculatePositionMetrics(position, quote.price, quote.change, quote.changePercent);
      } else {
        return calculatePositionMetrics(position, position.purchasePrice, 0, 0);
      }
    });

    return calculatePortfolioMetrics(portfolio, positionsWithMarketData);
  }, [portfolio, stockQuotes]);
}
