export interface Position {
  readonly id: string;
  readonly symbol: string;
  readonly shares: number;
  readonly purchasePrice: number;
  readonly purchaseDate: Date;
  readonly notes?: string;
}

// Interface for creating a new position
export interface CreatePositionData {
  readonly symbol: string;
  readonly shares: number;
  readonly purchasePrice: number;
  readonly purchaseDate?: Date;
  readonly notes?: string;
}

// Interface for updating an existing position
export interface UpdatePositionData {
  readonly shares?: number;
  readonly purchasePrice?: number;
  readonly purchaseDate?: Date;
  readonly notes?: string;
}

// Enhanced position with real-time market data
export interface PositionWithMarketData extends Position {
  readonly currentPrice: number;
  readonly currentValue: number;
  readonly costBasis: number;
  readonly gainLoss: number;
  readonly gainLossPercent: number;
  readonly dayChange: number;
  readonly dayChangePercent: number;
}

// Portfolio interface - now includes positions array
export interface Portfolio {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly userId: string;
  readonly positions: Position[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Portfolio with calculated metrics
export interface PortfolioWithMetrics extends Portfolio {
  readonly totalValue: number;
  readonly totalCostBasis: number;
  readonly totalGainLoss: number;
  readonly totalGainLossPercent: number;
  readonly dayChange: number;
  readonly dayChangePercent: number;
  readonly positionsWithMarketData: PositionWithMarketData[];
}

export interface CreatePortfolioData {
  readonly name: string;
  readonly description?: string;
}

export interface UpdatePortfolioData {
  readonly name?: string;
  readonly description?: string;
}
