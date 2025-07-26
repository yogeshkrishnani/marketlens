// src/features/watchlist/models/index.ts

// Core watchlist interface
export interface Watchlist {
  readonly id: string;
  readonly name: string;
  readonly userId: string;
  readonly symbols: string[]; // Array of stock symbols: ["AAPL", "GOOGL", "TSLA"]
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Interface for creating a new watchlist
export interface CreateWatchlistData {
  readonly name: string;
  readonly symbols?: string[]; // Optional initial symbols
}

// Interface for updating an existing watchlist
export interface UpdateWatchlistData {
  readonly name?: string;
  readonly symbols?: string[]; // Complete replacement of symbols array
}

// Enhanced watchlist with real-time market data
export interface WatchlistWithMarketData extends Watchlist {
  readonly watchlistItems: WatchlistItem[];
  readonly totalValue?: number; // Optional: if we want to show total value
  readonly topPerformer?: WatchlistItem; // Best performing stock
  readonly worstPerformer?: WatchlistItem; // Worst performing stock
}

// Individual stock item within a watchlist with market data
export interface WatchlistItem {
  readonly symbol: string;
  readonly name: string;
  readonly price: number;
  readonly change: number;
  readonly changePercent: number;
  readonly volume: number;
  readonly marketCap?: number;
  readonly dayHigh?: number;
  readonly dayLow?: number;
}

// Summary statistics for a watchlist
export interface WatchlistSummary {
  readonly symbolCount: number;
  readonly avgChange: number;
  readonly avgChangePercent: number;
  readonly gainersCount: number;
  readonly losersCount: number;
  readonly topGainer: string | null;
  readonly topLoser: string | null;
}

// Interface for adding/removing symbols from watchlist
export interface WatchlistSymbolOperation {
  readonly watchlistId: string;
  readonly symbol: string;
}

// Watchlist preferences/settings
export interface WatchlistSettings {
  readonly sortBy: 'symbol' | 'change' | 'changePercent' | 'price' | 'volume';
  readonly sortOrder: 'asc' | 'desc';
  readonly refreshInterval: number; // in seconds
  readonly showExtendedHours: boolean;
}

// Error types for watchlist operations
export interface WatchlistError {
  readonly code:
    | 'NOT_FOUND'
    | 'UNAUTHORIZED'
    | 'INVALID_SYMBOL'
    | 'DUPLICATE_SYMBOL'
    | 'NETWORK_ERROR';
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

// Form validation interfaces
export interface CreateWatchlistFormData {
  name: string;
  initialSymbols: string; // Comma-separated string for input
}

export interface CreateWatchlistFormErrors {
  name?: string;
  initialSymbols?: string;
}

// Constants for validation and limits
export const WATCHLIST_CONSTRAINTS = {
  MAX_NAME_LENGTH: 50,
  MIN_NAME_LENGTH: 1,
  MAX_SYMBOLS_PER_WATCHLIST: 50,
  MAX_WATCHLISTS_PER_USER: 10,
  SYMBOL_REGEX: /^[A-Z]{1,5}$/,
} as const;

// Helper type for watchlist operations
export type WatchlistOperation = 'create' | 'update' | 'delete' | 'addSymbol' | 'removeSymbol';

// Type guards for runtime type checking
export const isValidWatchlist = (obj: unknown): obj is Watchlist => {
  if (!obj || typeof obj !== 'object' || obj === null) {
    return false;
  }

  const watchlist = obj as Record<string, unknown>;

  // Check required string properties
  if (
    typeof watchlist.id !== 'string' ||
    typeof watchlist.name !== 'string' ||
    typeof watchlist.userId !== 'string'
  ) {
    return false;
  }

  // Check symbols array
  if (!Array.isArray(watchlist.symbols)) {
    return false;
  }

  // Validate each symbol is a string
  for (const symbol of watchlist.symbols) {
    if (typeof symbol !== 'string') {
      return false;
    }
  }

  // Check dates
  if (!(watchlist.createdAt instanceof Date) || !(watchlist.updatedAt instanceof Date)) {
    return false;
  }

  return true;
};

export const isValidSymbol = (symbol: string): boolean => {
  return WATCHLIST_CONSTRAINTS.SYMBOL_REGEX.test(symbol.toUpperCase());
};

export const isValidWatchlistName = (name: string): boolean => {
  const trimmedName = name.trim();
  return (
    trimmedName.length >= WATCHLIST_CONSTRAINTS.MIN_NAME_LENGTH &&
    trimmedName.length <= WATCHLIST_CONSTRAINTS.MAX_NAME_LENGTH
  );
};

// Utility type for watchlist display states
export type WatchlistDisplayState = 'loading' | 'loaded' | 'error' | 'empty';

// Interface for bulk operations
export interface BulkWatchlistOperation {
  readonly operation: 'add' | 'remove';
  readonly watchlistId: string;
  readonly symbols: string[];
}

export interface BulkOperationResult {
  readonly successful: string[];
  readonly failed: Array<{
    symbol: string;
    error: string;
  }>;
}
