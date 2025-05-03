import { useCallback } from 'react';

import { useLocalStorage } from './useLocalStorage';

// Stock type for the recently viewed list
export interface ViewedStock {
  symbol: string;
  name: string;
  timestamp: number;
}

// Define the maximum number of stocks to remember
const MAX_RECENTLY_VIEWED = 10;

// Hook for managing recently viewed stocks
export function useRecentlyViewedStocks() {
  const [recentlyViewed, setRecentlyViewed] = useLocalStorage<ViewedStock[]>(
    'recentlyViewedStocks',
    []
  );

  // Add a stock to the recently viewed list
  // Changed to accept an object with symbol and name properties
  const addViewedStock = useCallback(
    ({ symbol, name }: { symbol: string; name: string }) => {
      // Create new stock entry
      const newStock: ViewedStock = {
        symbol,
        name,
        timestamp: Date.now(),
      };

      setRecentlyViewed(prev => {
        // Check if this stock is already the most recent one (to prevent duplicate updates)
        const currentMostRecent = prev[0];
        if (currentMostRecent && currentMostRecent.symbol === symbol) {
          return prev; // Do nothing if this is already the most recent stock
        }

        // Filter out any existing entries for this stock
        const filtered = prev.filter(stock => stock.symbol !== symbol);

        // Add the new stock at the beginning and limit to MAX_RECENTLY_VIEWED items
        return [newStock, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
      });
    },
    [setRecentlyViewed]
  );

  // Remove a stock from the recently viewed list
  const removeViewedStock = useCallback(
    (symbol: string) => {
      setRecentlyViewed(prev => prev.filter(stock => stock.symbol !== symbol));
    },
    [setRecentlyViewed]
  );

  // Clear all recently viewed stocks
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
