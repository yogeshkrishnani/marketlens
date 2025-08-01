import { SectorPerformance } from '../models';

export const formatSectorName = (name: string): string => {
  return name.replace(' Sector', '').trim();
};

export const transformSectorData = (response: any[]): SectorPerformance[] => {
  if (!Array.isArray(response)) {
    return [];
  }

  return response.map(item => {
    return {
      name: item.sector,
      performance: parseFloat(item.changesPercentage),
    };
  });
};

export const getSectorPerformanceRange = (
  data: SectorPerformance[]
): { min: number; max: number } => {
  if (!data || data.length === 0) {
    return { min: -1.5, max: 1.5 };
  }

  const performances = data.map(sector => sector.performance);
  const min = Math.min(...performances);
  const max = Math.max(...performances);

  return {
    min: min * 1.1,
    max: max * 1.1,
  };
};

export const formatSectorPerformance = (performance: number): string => {
  const sign = performance >= 0 ? '+' : '';
  return `${sign}${(performance * 100).toFixed(2)}%`;
};
