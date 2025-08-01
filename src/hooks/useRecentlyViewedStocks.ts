import { useCallback } from 'react';

import { useLocalStorage } from './useLocalStorage';

export interface ViewedStock {
  symbol: string;
  name: string;
  timestamp: number;
}

const MAX_RECENTLY_VIEWED = 10;

export function useRecentlyViewedStocks() {
  const [recentlyViewed, setRecentlyViewed] = useLocalStorage<ViewedStock[]>(
    'recentlyViewedStocks',
    []
  );

  const addViewedStock = useCallback(
    ({ symbol, name }: { symbol: string; name: string }) => {
      const newStock: ViewedStock = {
        symbol,
        name,
        timestamp: Date.now(),
      };

      setRecentlyViewed(prev => {
        const currentMostRecent = prev[0];
        if (currentMostRecent && currentMostRecent.symbol === symbol) {
          return prev;
        }

        const filtered = prev.filter(stock => stock.symbol !== symbol);

        return [newStock, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
      });
    },
    [setRecentlyViewed]
  );

  const removeViewedStock = useCallback(
    (symbol: string) => {
      setRecentlyViewed(prev => prev.filter(stock => stock.symbol !== symbol));
    },
    [setRecentlyViewed]
  );

  const clearViewedStocks = useCallback(() => {
    setRecentlyViewed([]);
  }, [setRecentlyViewed]);

  return {
    recentlyViewed,
    addViewedStock,
    removeViewedStock,
    clearViewedStocks,
  };
}
