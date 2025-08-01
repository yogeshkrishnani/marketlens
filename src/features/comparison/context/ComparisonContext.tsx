import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface ComparisonStock {
  symbol: string;
  name: string;
  color?: string;
}

interface ComparisonContextType {
  comparisonList: ComparisonStock[];
  addMultipleStocks: (stocks: ComparisonStock[]) => void;
  addToComparison: (stock: ComparisonStock) => void;
  removeFromComparison: (symbol: string) => void;
  clearComparison: () => void;
  isInComparison: (symbol: string) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

const MAX_COMPARISON_STOCKS = 4;

const CHART_COLORS = ['#2196f3', '#f44336', '#4caf50', '#ff9800'];

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comparisonList, setComparisonList] = useState<ComparisonStock[]>([]);

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

  const addToComparison = useCallback((stock: ComparisonStock) => {
    setComparisonList(prevList => {
      if (prevList.some(item => item.symbol === stock.symbol)) {
        return prevList;
      }

      if (prevList.length >= MAX_COMPARISON_STOCKS) {
        return prevList;
      }

      const newStock = {
        ...stock,
        color: CHART_COLORS[prevList.length],
      };

      return [...prevList, newStock];
    });
  }, []);

  const removeFromComparison = useCallback((symbol: string) => {
    setComparisonList(prevList => {
      const newList = prevList.filter(stock => stock.symbol !== symbol);

      return newList.map((stock, index) => ({
        ...stock,
        color: CHART_COLORS[index],
      }));
    });
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonList([]);
  }, []);

  const isInComparison = useCallback(
    (symbol: string) => {
      return comparisonList.some(stock => stock.symbol === symbol);
    },
    [comparisonList]
  );

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

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};
