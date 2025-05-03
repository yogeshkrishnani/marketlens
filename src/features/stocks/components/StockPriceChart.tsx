// src/features/stocks/components/StockPriceChart.tsx

import { Box, Typography, Paper, useTheme } from '@mui/material';
import { ApexOptions } from 'apexcharts';
import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';

import { HistoricalPrice, Timeframe } from '../models/stockDetail';
import { formatPrice } from '../utils/stockDetail';

interface StockPriceChartProps {
  data: HistoricalPrice[];
  timeframe: Timeframe;
  currencySymbol?: string;
  symbol?: string; // Stock symbol for display
}

export const StockPriceChart: React.FC<StockPriceChartProps> = ({
  data,
  timeframe,
  currencySymbol = '$',
  symbol = '',
}) => {
  const theme = useTheme();

  // Determine if we should use candlestick (daily data) or line chart (intraday)
  const isIntraday = timeframe === '1D' || timeframe === '5D';

  // Calculate price change
  const firstPoint = data.length > 0 ? data[0] : null;
  const lastPoint = data.length > 0 ? data[data.length - 1] : null;

  // Use safe values with proper fallbacks
  const startPrice =
    firstPoint && typeof firstPoint.close === 'number' && !isNaN(firstPoint.close)
      ? firstPoint.close
      : 0;

  const endPrice =
    lastPoint && typeof lastPoint.close === 'number' && !isNaN(lastPoint.close)
      ? lastPoint.close
      : 0;

  const priceChange = endPrice - startPrice;
  const priceChangePercent = startPrice !== 0 ? (priceChange / startPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  // Format dates based on timeframe
  const formatDate = (timestamp: number): string => {
    // Handle invalid timestamps
    if (!timestamp || isNaN(timestamp)) {
      return 'N/A';
    }

    try {
      const date = new Date(timestamp * 1000);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }

      if (timeframe === '1D') {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (timeframe === '5D') {
        return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else if (timeframe === '1M' || timeframe === '3M') {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Prepare data series for the chart
  const series = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // Filter out any invalid data points
    const validData = data.filter(
      item =>
        item &&
        typeof item.timestamp === 'number' &&
        !isNaN(item.timestamp) &&
        typeof item.close === 'number' &&
        !isNaN(item.close)
    );

    if (isIntraday) {
      // Line chart for intraday
      return [
        {
          name: symbol || 'Price',
          data: validData.map(item => ({
            x: item.timestamp * 1000, // Convert to milliseconds for ApexCharts
            y: item.close,
          })),
        },
      ];
    } else {
      // Candlestick chart for daily data
      return [
        {
          name: 'candle',
          data: validData.map(item => ({
            x: item.timestamp * 1000, // Convert to milliseconds
            y: [
              // Ensure we have valid OHLC values or fall back to close price
              typeof item.open === 'number' && !isNaN(item.open) ? item.open : item.close,
              typeof item.high === 'number' && !isNaN(item.high) ? item.high : item.close,
              typeof item.low === 'number' && !isNaN(item.low) ? item.low : item.close,
              item.close,
            ],
          })),
        },
      ];
    }
  }, [data, isIntraday, symbol]);

  // Volume data series
  const volumeSeries = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // Filter out any invalid data points
    const validData = data.filter(
      item =>
        item &&
        typeof item.timestamp === 'number' &&
        !isNaN(item.timestamp) &&
        typeof item.volume === 'number' &&
        !isNaN(item.volume)
    );

    return [
      {
        name: 'Volume',
        data: validData.map(item => ({
          x: item.timestamp * 1000,
          y: item.volume || 0, // Ensure volume has a default value
        })),
      },
    ];
  }, [data]);

  // Chart options for price chart
  const chartOptions = useMemo<ApexOptions>(() => {
    const baseOptions: ApexOptions = {
      chart: {
        type: isIntraday ? 'line' : 'candlestick',
        height: 350,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
        },
        animations: {
          enabled: true,
        },
        background: 'transparent',
      },
      theme: {
        mode: theme.palette.mode === 'dark' ? 'dark' : 'light',
      },
      tooltip: {
        enabled: true,
        theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
        x: {
          format:
            timeframe === '1D' ? 'HH:mm' : timeframe === '5D' ? 'MMM dd, HH:mm' : 'MMM dd, yyyy',
        },
        y: {
          formatter: value => `${currencySymbol}${formatPrice(value)}`,
        },
      },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: false,
          style: {
            colors: theme.palette.text.secondary,
          },
          formatter: (value: string) => {
            try {
              // Parse the string value to a number before division
              const numValue = parseFloat(value);
              if (isNaN(numValue)) {
                return 'N/A';
              }
              return formatDate(numValue / 1000);
            } catch (error) {
              return 'N/A';
            }
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: theme.palette.text.secondary,
          },
          formatter: value => `${currencySymbol}${formatPrice(value)}`,
        },
        tooltip: {
          enabled: true,
        },
      },
      grid: {
        show: true,
        borderColor: theme.palette.divider,
        strokeDashArray: 3,
        position: 'back',
      },
      stroke: {
        curve: 'smooth',
        width: isIntraday ? 2 : 1,
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: false,
      },
      colors: [isPositive ? theme.palette.success.main : theme.palette.error.main],
    };

    // Additional options specific to candlestick chart
    if (!isIntraday) {
      return {
        ...baseOptions,
        plotOptions: {
          candlestick: {
            colors: {
              upward: theme.palette.success.main,
              downward: theme.palette.error.main,
            },
            wick: {
              useFillColor: true,
            },
          },
        },
      };
    }

    // Options for the line chart
    return {
      ...baseOptions,
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.3,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 100],
        },
      },
      markers: {
        size: 0,
        strokeWidth: 2,
      },
    };
  }, [isIntraday, theme, timeframe, currencySymbol, isPositive]);

  // Options for volume chart
  const volumeOptions = useMemo<ApexOptions>(() => {
    return {
      chart: {
        type: 'bar',
        height: 100,
        toolbar: {
          show: false,
        },
        background: 'transparent',
      },
      theme: {
        mode: theme.palette.mode === 'dark' ? 'dark' : 'light',
      },
      tooltip: {
        enabled: true,
        theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
        y: {
          formatter: value => value.toLocaleString(),
        },
      },
      xaxis: {
        type: 'datetime',
        labels: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          show: true,
          style: {
            colors: theme.palette.text.secondary,
          },
          formatter: value => {
            if (value >= 1_000_000) {
              return `${(value / 1_000_000).toFixed(1)}M`;
            } else if (value >= 1_000) {
              return `${(value / 1_000).toFixed(1)}K`;
            }
            return value.toString();
          },
        },
      },
      grid: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: false,
      },
      colors: [theme.palette.primary.main],
      plotOptions: {
        bar: {
          columnWidth: '80%',
        },
      },
    };
  }, [theme]);

  // If no data, show a message
  if (data.length === 0) {
    return (
      <Paper
        sx={{
          p: 3,
          height: '400px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          No price data available for the selected timeframe
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Price change display */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {timeframe} Price Change:
        </Typography>
        <Box>
          <Typography
            variant="body1"
            component="span"
            sx={{
              color: isPositive ? 'success.main' : 'error.main',
              fontWeight: 500,
              mr: 1,
            }}
          >
            {isPositive ? '+' : ''}
            {priceChange.toFixed(2)} ({isPositive ? '+' : ''}
            {priceChangePercent.toFixed(2)}%)
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span">
            {formatDate(firstPoint ? firstPoint.timestamp : 0)} -{' '}
            {formatDate(lastPoint ? lastPoint.timestamp : 0)}
          </Typography>
        </Box>
      </Box>

      {/* Main price chart */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Chart
          options={chartOptions}
          series={series}
          type={isIntraday ? 'area' : 'candlestick'}
          height={350}
        />
      </Paper>

      {/* Volume chart */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Volume
        </Typography>
        <Chart options={volumeOptions} series={volumeSeries} type="bar" height={100} />
      </Paper>
    </Box>
  );
};
