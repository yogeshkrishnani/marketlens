import { KeyMetrics, StockDetailQuote } from '@features/stocks/models/stockDetail';
import { formatCompactNumber } from '@features/stocks/utils/stockDetail';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';

import { ComparisonStock } from '../context/ComparisonContext';

interface ComparisonMetricsTableProps {
  stocks: ComparisonStock[];
  quotes: StockDetailQuote[];
  metrics: { [symbol: string]: KeyMetrics };
}

interface MetricDefinition {
  key: string;
  label: string;
  description: string;
  isPercentage?: boolean;
  isCurrency?: boolean;
  isBigNumber?: boolean;
  isQuote?: boolean;
  isGoodLow?: boolean;
  isGoodHigh?: boolean;
}

const metricGroups: Array<{
  name: string;
  metrics: MetricDefinition[];
}> = [
  {
    name: 'General',
    metrics: [
      {
        key: 'price',
        label: 'Price',
        description: 'Current stock price',
        isCurrency: true,
        isQuote: true,
      },
      {
        key: 'marketCap',
        label: 'Market Cap',
        description: 'Total value of all outstanding shares',
        isCurrency: true,
        isQuote: true,
        isBigNumber: true,
      },
      {
        key: 'volume',
        label: 'Volume',
        description: 'Trading volume of the current day',
        isQuote: true,
        isBigNumber: true,
      },
    ],
  },
  {
    name: 'Valuation',
    metrics: [
      {
        key: 'peRatio',
        label: 'P/E Ratio',
        description:
          "Price to Earnings Ratio - A company's share price relative to its earnings per share",
        isGoodLow: true,
      },
      {
        key: 'pbRatio',
        label: 'P/B Ratio',
        description: "Price to Book Ratio - A company's market value relative to its book value",
        isGoodLow: true,
      },
      {
        key: 'evToEbitda',
        label: 'EV/EBITDA',
        description:
          "Enterprise Value to EBITDA - Compares a company's value to its earnings before interest, taxes, depreciation, and amortization",
        isGoodLow: true,
      },
      {
        key: 'priceToSalesRatio',
        label: 'P/S Ratio',
        description: "Price to Sales Ratio - Compares a company's market cap to its revenue",
        isGoodLow: true,
      },
    ],
  },
  {
    name: 'Profitability',
    metrics: [
      {
        key: 'roe',
        label: 'ROE',
        description: "Return on Equity - Measures profitability relative to shareholders' equity",
        isPercentage: true,
      },
      {
        key: 'roa',
        label: 'ROA',
        description: 'Return on Assets - Measures profitability relative to total assets',
        isPercentage: true,
      },
      {
        key: 'grossMargin',
        label: 'Gross Margin',
        description: 'Gross profit divided by total revenue',
        isPercentage: true,
      },
      {
        key: 'netMargin',
        label: 'Net Margin',
        description: 'Net income divided by total revenue',
        isPercentage: true,
      },
    ],
  },
  {
    name: 'Financial Health',
    metrics: [
      {
        key: 'debtToEquity',
        label: 'Debt/Equity',
        description: "Total debt divided by shareholders' equity",
        isGoodLow: true,
      },
      {
        key: 'currentRatio',
        label: 'Current Ratio',
        description:
          'Current assets divided by current liabilities - Measures short-term liquidity',
        isGoodHigh: true,
      },
      {
        key: 'quickRatio',
        label: 'Quick Ratio',
        description:
          'Liquid assets divided by current liabilities - A more stringent measure of liquidity',
        isGoodHigh: true,
      },
    ],
  },
];

export const ComparisonMetricsTable: React.FC<ComparisonMetricsTableProps> = ({
  stocks,
  quotes,
  metrics,
}) => {
  const formatMetricValue = (
    value: number | null,
    isPercentage?: boolean,
    isCurrency?: boolean,
    isBigNumber?: boolean
  ) => {
    if (value === null || value === undefined) return 'N/A';

    if (isPercentage) {
      return `${(value * 100).toFixed(2)}%`;
    }

    if (isCurrency && isBigNumber) {
      return `$${formatCompactNumber(value)}`;
    }

    if (isCurrency) {
      return `$${value.toFixed(2)}`;
    }

    if (isBigNumber) {
      return formatCompactNumber(value);
    }

    return value.toFixed(2);
  };

  const getMetricValue = (symbol: string, key: string, isQuote?: boolean) => {
    if (isQuote) {
      const quote = quotes.find(q => q.symbol === symbol);
      return quote ? quote[key as keyof StockDetailQuote] : null;
    } else {
      const metric = metrics[symbol];
      return metric ? metric[key as keyof KeyMetrics] : null;
    }
  };

  const findBestWorst = (metricKey: string, isQuote?: boolean, isGoodLow?: boolean) => {
    const values = stocks
      .map(stock => ({
        symbol: stock.symbol,
        value: getMetricValue(stock.symbol, metricKey, isQuote),
      }))
      .filter(item => item.value !== null && !isNaN(Number(item.value)));

    if (values.length === 0) return { best: null, worst: null };

    values.sort((a, b) => {
      if (isGoodLow) {
        return Number(a.value) - Number(b.value);
      } else {
        return Number(b.value) - Number(a.value);
      }
    });

    return {
      best: values[0].symbol,
      worst: values[values.length - 1].symbol,
    };
  };

  return (
    <Box>
      {metricGroups.map(group => (
        <Box key={group.name} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {group.name}
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  {/* Fixed width for metric column */}
                  <TableCell sx={{ fontWeight: 600, width: '25%', minWidth: '150px' }}>
                    Metric
                  </TableCell>

                  {stocks.map(stock => (
                    <TableCell
                      key={stock.symbol}
                      align="center"
                      sx={{
                        fontWeight: 600,
                        width: `${75 / stocks.length}%`,
                        borderLeft: `4px solid ${stock.color}`,
                        py: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: stock.color,
                            mr: 1,
                          }}
                        />
                        {stock.symbol}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {group.metrics.map(metric => {
                  const { best, worst } = findBestWorst(
                    metric.key,
                    metric.isQuote,
                    metric.isGoodLow
                  );

                  return (
                    <TableRow key={metric.key} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {metric.label}
                          <Tooltip title={metric.description} arrow placement="top">
                            <InfoOutlinedIcon
                              fontSize="small"
                              sx={{ ml: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}
                            />
                          </Tooltip>
                        </Box>
                      </TableCell>

                      {stocks.map(stock => {
                        const value = getMetricValue(stock.symbol, metric.key, metric.isQuote);

                        const isBest = best === stock.symbol;
                        const isWorst = worst === stock.symbol;

                        return (
                          <TableCell
                            key={`${stock.symbol}-${metric.key}`}
                            align="center"
                            sx={{
                              ...(isBest && { color: 'success.main', fontWeight: 600 }),
                              ...(isWorst && { color: 'error.main', fontWeight: 600 }),
                              py: 2,
                            }}
                          >
                            {formatMetricValue(
                              value as number,
                              metric.isPercentage,
                              metric.isCurrency,
                              metric.isBigNumber
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
    </Box>
  );
};
