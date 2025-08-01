import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { ApexOptions } from 'apexcharts';
import React, { useMemo, useState } from 'react';
import Chart from 'react-apexcharts';

import { ComparisonStock } from '../context/ComparisonContext';

import { HistoricalPrice, Timeframe } from '@/features/stocks/models/stockDetail';

interface ComparisonPriceChartProps {
  data: { [symbol: string]: HistoricalPrice[] };
  stocks: ComparisonStock[];
  timeframe: Timeframe;
}

type ChartType = 'price' | 'percent';

export const ComparisonPriceChart: React.FC<ComparisonPriceChartProps> = ({
  data,
  stocks,
  timeframe,
}) => {
  const [chartType, setChartType] = useState<ChartType>('percent');

  const stockData = useMemo(() => {
    const result: {
      symbol: string;
      color: string;
      initialPrice: number;
      priceData: { x: number; y: number }[];
      percentData: { x: number; y: number }[];
    }[] = [];

    stocks.forEach(stock => {
      const prices = data[stock.symbol] || [];

      if (prices.length > 0) {
        const sortedPrices = [...prices].sort((a, b) => a.timestamp - b.timestamp);

        const initialPrice = sortedPrices[0].close;

        const priceData = sortedPrices.map(price => ({
          x: price.timestamp * 1000,
          y: price.close,
        }));

        const percentData = sortedPrices.map(price => ({
          x: price.timestamp * 1000,
          y: ((price.close - initialPrice) / initialPrice) * 100,
        }));

        result.push({
          symbol: stock.symbol,
          color: stock.color || '#2196f3',
          initialPrice,
          priceData,
          percentData,
        });
      }
    });

    return result;
  }, [data, stocks]);

  const handleChartTypeChange = (_: React.MouseEvent<HTMLElement>, newType: ChartType | null) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const chartOptions: ApexOptions = useMemo(() => {
    const baseOptions: ApexOptions = {
      chart: {
        type: 'line',
        height: 400,
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
        fontFamily: 'inherit',
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      markers: {
        size: 0,
        hover: {
          size: 5,
        },
      },
      tooltip: {
        shared: true,
        marker: {
          show: true,
        },
        x: {
          formatter: function (val: any, timestamp?: number) {
            const date = new Date(timestamp || val);

            if (timeframe === '1D') {
              return date.toLocaleTimeString();
            } else if (timeframe === '5D') {
              return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            } else {
              return date.toLocaleDateString();
            }
          },
        },
      },
              xaxis: {
          type: 'datetime',
          labels: {
            datetimeUTC: false,
            formatter: function (value: string, timestamp?: number) {
              const date = new Date(timestamp || Number(value));

            if (timeframe === '1D') {
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (timeframe === '5D' || timeframe === '1M') {
              return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            } else {
              return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
            }
          },
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
      },
      grid: {
        borderColor: 'rgba(0,0,0,0.1)',
      },
    };

    if (chartType === 'percent') {
      return {
        ...baseOptions,
        yaxis: {
          labels: {
            formatter: (val: number) => `${val.toFixed(2)}%`,
          },
          title: {
            text: 'Percentage Change',
          },
        },
        tooltip: {
          ...baseOptions.tooltip,
          y: {
            formatter: (val: number) => `${val.toFixed(2)}%`,
          },
        },
      };
    } else {
      return {
        ...baseOptions,
        yaxis: {
          labels: {
            formatter: (val: number) => `$${val.toFixed(2)}`,
          },
          title: {
            text: 'Price (USD)',
          },
        },
        tooltip: {
          ...baseOptions.tooltip,
          y: {
            formatter: (val: number) => `$${val.toFixed(2)}`,
          },
        },
      };
    }
  }, [chartType, timeframe]);

  const chartSeries = useMemo(() => {
    return stockData.map(stock => ({
      name: stock.symbol,
      data: chartType === 'percent' ? stock.percentData : stock.priceData,
      color: stock.color,
    }));
  }, [stockData, chartType]);

  if (stockData.length === 0) {
    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        No price data available for the selected stocks and timeframe.
      </Box>
    );
  }

  return (
    <Box>
      {/* Chart type selector */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={handleChartTypeChange}
          size="small"
        >
          <ToggleButton value="price">Price</ToggleButton>
          <ToggleButton value="percent">% Change</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Price chart */}
      <Box sx={{ height: 400 }}>
        <Chart options={chartOptions} series={chartSeries} type="line" height="100%" />
      </Box>

      {/* Legend with starting prices */}
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {stockData.map(stock => (
          <Box
            key={stock.symbol}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: stock.color,
                mr: 1,
              }}
            />
            <Box sx={{ fontSize: '0.875rem' }}>
              <Box component="span" sx={{ fontWeight: 500, mr: 1 }}>
                {stock.symbol}
              </Box>
              <Box component="span" sx={{ color: 'text.secondary' }}>
                Start: ${stock.initialPrice.toFixed(2)}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
