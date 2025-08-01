import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

import { CreatePortfolioData, Portfolio, UpdatePortfolioData } from '../models';
import {
  addPortfolio,
  deletePortfolio,
  getUserPortfolios,
  updatePortfolio,
} from '../services/portfolioService';

interface PortfolioState {
  portfolios: Portfolio[];
  isLoading: boolean;
  error: string | null;
}

interface PortfolioActions {
  createPortfolio: (userId: string, portfolioData: CreatePortfolioData) => Promise<Portfolio>;
  loadUserPortfolios: (userId: string) => Promise<void>;
  editPortfolio: (portfolioId: string, updateData: UpdatePortfolioData) => Promise<void>;
  removePortfolio: (portfolioId: string) => Promise<void>;
  clearError: () => void;
  refreshPortfolios: (userId: string) => Promise<void>;
}

interface PortfolioContextType extends PortfolioState, PortfolioActions {}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

interface PortfolioProviderProps {
  readonly children: ReactNode;
}

export const PortfolioProvider: React.FC<PortfolioProviderProps> = ({ children }) => {
  const [state, setState] = useState<PortfolioState>({
    portfolios: [],
    isLoading: false,
    error: null,
  });

  const updateState = useCallback((updates: Partial<PortfolioState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const createPortfolio = useCallback(
    async (userId: string, portfolioData: CreatePortfolioData): Promise<Portfolio> => {
      updateState({ isLoading: true, error: null });

      try {
        const newPortfolio = await addPortfolio(userId, portfolioData);

        setState(prev => ({
          ...prev,
          portfolios: [newPortfolio, ...prev.portfolios],
          isLoading: false,
        }));

        return newPortfolio;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create portfolio';
        updateState({ isLoading: false, error: errorMessage });
        throw error;
      }
    },
    [updateState]
  );

  const loadUserPortfolios = useCallback(
    async (userId: string): Promise<void> => {
      updateState({ isLoading: true, error: null });

      try {
        const portfolios = await getUserPortfolios(userId);
        updateState({ portfolios, isLoading: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load portfolios';
        updateState({ isLoading: false, error: errorMessage });
      }
    },
    [updateState]
  );

  const editPortfolio = useCallback(
    async (portfolioId: string, updateData: UpdatePortfolioData): Promise<void> => {
      updateState({ isLoading: true, error: null });

      try {
        await updatePortfolio(portfolioId, updateData);

        setState(prev => ({
          ...prev,
          portfolios: prev.portfolios.map(portfolio =>
            portfolio.id === portfolioId
              ? { ...portfolio, ...updateData, updatedAt: new Date() }
              : portfolio
          ),
          isLoading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update portfolio';
        updateState({ isLoading: false, error: errorMessage });
        throw error;
      }
    },
    [updateState]
  );

  const removePortfolio = useCallback(
    async (portfolioId: string): Promise<void> => {
      updateState({ isLoading: true, error: null });

      try {
        await deletePortfolio(portfolioId);

        setState(prev => ({
          ...prev,
          portfolios: prev.portfolios.filter(portfolio => portfolio.id !== portfolioId),
          isLoading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete portfolio';
        updateState({ isLoading: false, error: errorMessage });
        throw error;
      }
    },
    [updateState]
  );

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const refreshPortfolios = useCallback(
    async (userId: string): Promise<void> => {
      await loadUserPortfolios(userId);
    },
    [loadUserPortfolios]
  );

  const contextValue: PortfolioContextType = {
    portfolios: state.portfolios,
    isLoading: state.isLoading,
    error: state.error,
    createPortfolio,
    loadUserPortfolios,
    editPortfolio,
    removePortfolio,
    clearError,
    refreshPortfolios,
  };

  return <PortfolioContext.Provider value={contextValue}>{children}</PortfolioContext.Provider>;
};

export const usePortfolio = (): PortfolioContextType => {
  const context = useContext(PortfolioContext);

  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }

  return context;
};

export const usePortfolioById = (portfolioId: string): Portfolio | undefined => {
  const { portfolios } = usePortfolio();
  return portfolios.find(portfolio => portfolio.id === portfolioId);
};
