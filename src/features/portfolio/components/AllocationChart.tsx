import { Box, Paper, Typography, useTheme } from '@mui/material';
import React, { useMemo } from 'react';

import { PositionWithMarketData } from '../models';

// Component props interface
interface AllocationChartProps {
  readonly positions: PositionWithMarketData[];
  readonly title?: string;
}

// Chart data interface
interface ChartData {
  readonly name: string;
  readonly value: number;
  readonly percentage: number;
  readonly color: string;
  readonly position: PositionWithMarketData;
}

// Portfolio-specific currency formatting for consistency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Format percentage for display
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const AllocationChart: React.FC<AllocationChartProps> = ({
  positions,
  title = 'Portfolio Allocation',
}) => {
  const theme = useTheme();

  // Calculate allocation data
  const chartData = useMemo((): ChartData[] => {
    if (!positions || positions.length === 0) {
      return [];
    }

    // Calculate total portfolio value
    const totalValue = positions.reduce((sum, position) => sum + position.currentValue, 0);

    if (totalValue === 0) {
      return [];
    }

    // Sort positions by value (largest first) for better visualization
    const sortedPositions = [...positions].sort((a, b) => b.currentValue - a.currentValue);

    // Generate colors - use a professional color palette
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Green
      '#FECA57', // Yellow
      '#FF9FF3', // Pink
      '#54A0FF', // Light Blue
      '#5F27CD', // Purple
      '#00D2D3', // Cyan
      '#FF9F43', // Orange
    ];

    // Generate chart data
    return sortedPositions.map((position, index) => ({
      name: position.symbol,
      value: position.currentValue,
      percentage: (position.currentValue / totalValue) * 100,
      color: colors[index % colors.length],
      position,
    }));
  }, [positions]);

  // Calculate total value
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  // Generate SVG pie chart
  const generatePieChart = () => {
    if (chartData.length === 0) return null;

    const centerX = 150;
    const centerY = 150;
    const radius = 120;
    let cumulativePercentage = 0;

    const paths = chartData.map(item => {
      const startAngle = (cumulativePercentage / 100) * 2 * Math.PI - Math.PI / 2;
      cumulativePercentage += item.percentage;
      const endAngle = (cumulativePercentage / 100) * 2 * Math.PI - Math.PI / 2;

      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);

      const largeArcFlag = item.percentage > 50 ? 1 : 0;

      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ');

      return (
        <path
          key={item.name}
          d={pathData}
          fill={item.color}
          stroke={theme.palette.background.paper}
          strokeWidth="2"
        />
      );
    });

    return (
      <svg width="300" height="300" viewBox="0 0 300 300">
        {paths}
        {/* Center circle for donut effect */}
        <circle cx={centerX} cy={centerY} r="60" fill={theme.palette.background.paper} />
        {/* Center text */}
        <text
          x={centerX}
          y={centerY - 8}
          textAnchor="middle"
          fontSize="12"
          fill={theme.palette.text.secondary}
          fontFamily={theme.typography.fontFamily}
        >
          Total Value
        </text>
        <text
          x={centerX}
          y={centerY + 8}
          textAnchor="middle"
          fontSize="14"
          fontWeight="600"
          fill={theme.palette.text.primary}
          fontFamily={theme.typography.fontFamily}
        >
          {formatCurrency(totalValue)}
        </text>
      </svg>
    );
  };

  // Empty state
  if (chartData.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add positions to your portfolio to see allocation breakdown
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
        {title}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: 3,
        }}
      >
        {/* Chart */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          {generatePieChart()}
        </Box>

        {/* Legend */}
        <Box
          sx={{
            flex: 1,
            minWidth: 250,
          }}
        >
          {chartData.map(item => (
            <Box
              key={item.name}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1,
                borderBottom: 1,
                borderColor: 'divider',
                '&:last-child': {
                  borderBottom: 0,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: item.color,
                  }}
                />
                <Typography variant="body2" fontWeight={500}>
                  {item.name}
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(item.value)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatPercentage(item.percentage)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};
