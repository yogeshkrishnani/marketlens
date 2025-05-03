import { SectorPerformance } from '../models';

// Format sector name for display
export const formatSectorName = (name: string): string => {
  // Clean up sector names from API
  return name.replace(' Sector', '').trim();
};

// Transform raw API sector data to our domain model
export const transformSectorData = (response: any[]): SectorPerformance[] => {
  if (!Array.isArray(response)) {
    return [];
  }

  return response.map(item => {
    return {
      name: item.sector,
      performance: parseFloat(item.changesPercentage), // Convert to number if it's a string
    };
  });
};

// Get min/max performance for chart scaling
export const getSectorPerformanceRange = (
  data: SectorPerformance[]
): { min: number; max: number } => {
  if (!data || data.length === 0) {
    return { min: -1.5, max: 1.5 }; // Default range if no data
  }

  const performances = data.map(sector => sector.performance);
  const min = Math.min(...performances);
  const max = Math.max(...performances);

  // Add 10% padding to the range for better visualization
  return {
    min: min * 1.1,
    max: max * 1.1,
  };
};

// Format sector performance for display
export const formatSectorPerformance = (performance: number): string => {
  const sign = performance >= 0 ? '+' : '';
  return `${sign}${(performance * 100).toFixed(2)}%`;
};
