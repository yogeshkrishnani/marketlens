import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Define types
export interface ComparisonStock {
  symbol: string;
  name: string;
  color?: string; // For chart series
}

interface ComparisonContextType {
  comparisonList: ComparisonStock[];
  addMultipleStocks: (stocks: ComparisonStock[]) => void;
  addToComparison: (stock: ComparisonStock) => void;
  removeFromComparison: (symbol: string) => void;
  clearComparison: () => void;
  isInComparison: (symbol: string) => boolean;
}

// Create the context
const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

// Maximum number of stocks that can be compared
const MAX_COMPARISON_STOCKS = 4;

// Predefined colors for chart series
const CHART_COLORS = ['#2196f3', '#f44336', '#4caf50', '#ff9800'];

// Create the provider component
export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comparisonList, setComparisonList] = useState<ComparisonStock[]>([]);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const savedComparison = localStorage.getItem('comparisonList');
      if (savedComparison) {
        setComparisonList(JSON.parse(savedComparison));
      }
    } catch (error) {
      console.error('Error loading comparison list from localStorage:', error);
    }
  }, []);

  // Save to localStorage when list changes
  useEffect(() => {
    try {
      localStorage.setItem('comparisonList', JSON.stringify(comparisonList));
    } catch (error) {
      console.error('Error saving comparison list to localStorage:', error);
    }
  }, [comparisonList]);

  const addMultipleStocks = useCallback((stocks: ComparisonStock[]) => {
    setComparisonList(
      stocks.map((stock, index) => ({
        ...stock,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
    );
  }, []);

  // Add a stock to comparison
  const addToComparison = useCallback((stock: ComparisonStock) => {
    setComparisonList(prevList => {
      // If already in list, don't add again
      if (prevList.some(item => item.symbol === stock.symbol)) {
        return prevList;
      }

      // If list is at max capacity, don't add
      if (prevList.length >= MAX_COMPARISON_STOCKS) {
        return prevList;
      }

      // Add with a color from our predefined list
      const newStock = {
        ...stock,
        color: CHART_COLORS[prevList.length],
      };

      return [...prevList, newStock];
    });
  }, []);

  // Remove a stock from comparison
  const removeFromComparison = useCallback((symbol: string) => {
    setComparisonList(prevList => {
      // Remove the stock with the given symbol
      const newList = prevList.filter(stock => stock.symbol !== symbol);

      // Important: Reassign colors to maintain the correct sequence
      return newList.map((stock, index) => ({
        ...stock,
        color: CHART_COLORS[index],
      }));
    });
  }, []);

  // Clear the comparison list
  const clearComparison = useCallback(() => {
    setComparisonList([]);
  }, []);

  // Check if a stock is already in the comparison list
  const isInComparison = useCallback(
    (symbol: string) => {
      return comparisonList.some(stock => stock.symbol === symbol);
    },
    [comparisonList]
  );

  // Create the context value
  const contextValue: ComparisonContextType = {
    comparisonList,
    addMultipleStocks,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
  };

  return <ComparisonContext.Provider value={contextValue}>{children}</ComparisonContext.Provider>;
};

// Custom hook for using the comparison context
export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};
