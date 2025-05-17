import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

import { KeyMetrics } from '../models/stockDetail';
import { formatCompactNumber } from '../utils/stockDetail';

import { financialColors } from '@/theme';

// Financial metrics descriptions for tooltips
const metricsDescriptions: Record<string, string> = {
  peRatio:
    "Price to Earnings Ratio - A company's share price relative to its earnings per share. A higher ratio suggests investors expect higher growth in the future.",
  pbRatio:
    "Price to Book Ratio - A company's market value relative to its book value. Values under 1 can indicate an undervalued stock.",
  evToEbitda:
    "Enterprise Value to EBITDA - Compares a company's value, including debt and liabilities, to its earnings before interest, taxes, depreciation, and amortization.",
  priceToSalesRatio:
    "Price to Sales Ratio - Compares a company's market cap to its revenue, useful for companies with no earnings.",
  roe: "Return on Equity - Measures a company's profitability by revealing how much profit it generates with the money shareholders have invested.",
  roa: 'Return on Assets - Shows how efficiently a company is using its assets to generate profits.',
  debtToEquity:
    "Debt to Equity Ratio - Compares a company's total debt to its shareholders' equity, indicating the proportion of financing from debt versus shareholders.",
  currentRatio:
    "Current Ratio - Measures a company's ability to pay short-term obligations within one year.",
  quickRatio:
    'Quick Ratio - A more stringent measure of liquidity that excludes inventory from current assets.',
  dividendYield:
    'Dividend Yield - The annual dividend payment divided by the share price, showing the return on investment from dividends alone.',
  payoutRatio:
    'Payout Ratio - The proportion of earnings paid out as dividends to shareholders, indicating dividend sustainability.',
  grahamNumber:
    "Graham Number - A figure that measures a stock's fundamental value by considering EPS and book value per share.",
  earningsYield:
    'Earnings Yield - The inverse of the P/E ratio, showing earnings per dollar invested.',
  freeCashFlowYield:
    'Free Cash Flow Yield - Free cash flow per share divided by share price, showing cash return relative to market price.',
  enterpriseValue:
    "Enterprise Value - A measure of a company's total value, including market cap, debt, and excluding cash and cash equivalents.",
  evToRevenue:
    'Enterprise Value to Revenue - A valuation multiple that compares enterprise value to annual revenue.',
};

interface MetricCardProps {
  label: string;
  value: number | string | null;
  description: string;
  isPercentage?: boolean;
  isCurrency?: boolean;
  isRatio?: boolean;
  isBigNumber?: boolean;
  comparison?: {
    value: number;
    label: string;
  };
}

// Card for individual metrics with tooltips
const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  description,
  isPercentage = false,
  isCurrency = false,
  isRatio = false,
  isBigNumber = false,
  comparison,
}) => {
  // Format the value based on its type
  const formattedValue = (() => {
    if (value === null || value === undefined) return 'N/A';

    if (isPercentage) {
      return `${(Number(value) * 100).toFixed(2)}%`;
    }

    if (isCurrency) {
      return `$${formatCompactNumber(Number(value))}`;
    }

    if (isBigNumber) {
      return formatCompactNumber(Number(value));
    }

    if (isRatio) {
      return Number(value).toFixed(2);
    }

    return value;
  })();

  // Determine if the comparison is positive or negative (if provided)
  const isPositive = comparison ? Number(comparison.value) > 0 : undefined;

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {label}
          </Typography>
          <Tooltip title={description} arrow placement="top">
            <IconButton size="small">
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {formattedValue}
        </Typography>

        {comparison && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            {isPositive !== undefined && (
              <>
                {isPositive ? (
                  <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                )}
              </>
            )}
            <Typography
              variant="caption"
              sx={{
                color: isPositive
                  ? financialColors.positive
                  : isPositive === false
                    ? financialColors.negative
                    : 'text.secondary',
              }}
            >
              {comparison.label}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Category tabs for the metrics table
type MetricsCategory = 'valuation' | 'profitability' | 'financial-health' | 'advanced';

interface KeyMetricsTableProps {
  metrics: KeyMetrics | undefined;
  isLoading: boolean;
  error: any;
  industryAverages?: Partial<KeyMetrics>;
}

export const KeyMetricsTable: React.FC<KeyMetricsTableProps> = ({
  metrics,
  isLoading,
  error,
  industryAverages,
}) => {
  const [category, setCategory] = useState<MetricsCategory>('valuation');

  const handleCategoryChange = (_: React.SyntheticEvent, newValue: MetricsCategory) => {
    setCategory(newValue);
  };

  // Define metrics to show by category - matching your existing KeyMetrics model
  const categoryMetrics: Record<
    MetricsCategory,
    Array<{
      key: keyof KeyMetrics;
      label: string;
      isPercentage?: boolean;
      isCurrency?: boolean;
      isRatio?: boolean;
      isBigNumber?: boolean;
    }>
  > = {
    valuation: [
      { key: 'peRatio', label: 'P/E Ratio', isRatio: true },
      { key: 'pbRatio', label: 'P/B Ratio', isRatio: true },
      { key: 'evToEbitda', label: 'EV/EBITDA', isRatio: true },
      { key: 'priceToSalesRatio', label: 'Price to Sales', isRatio: true },
    ],
    profitability: [
      { key: 'roe', label: 'Return on Equity', isPercentage: true },
      { key: 'roa', label: 'Return on Assets', isPercentage: true },
      { key: 'earningsYield', label: 'Earnings Yield', isPercentage: true },
      { key: 'freeCashFlowYield', label: 'FCF Yield', isPercentage: true },
    ],
    'financial-health': [
      { key: 'debtToEquity', label: 'Debt to Equity', isRatio: true },
      { key: 'currentRatio', label: 'Current Ratio', isRatio: true },
      { key: 'quickRatio', label: 'Quick Ratio', isRatio: true },
      { key: 'payoutRatio', label: 'Payout Ratio', isPercentage: true },
    ],
    advanced: [
      { key: 'grahamNumber', label: 'Graham Number', isBigNumber: true },
      { key: 'evToRevenue', label: 'EV/Revenue', isRatio: true },
      { key: 'enterpriseValue', label: 'Enterprise Value', isCurrency: true },
      { key: 'dividendYield', label: 'Dividend Yield', isPercentage: true },
    ],
  };

  // Generate comparison text if industry averages are available
  const getComparisonInfo = (key: keyof KeyMetrics) => {
    if (!industryAverages || !industryAverages[key] || !metrics || !metrics[key]) return undefined;

    const diff = Number(metrics[key]) - Number(industryAverages[key]);
    const percentDiff = (diff / Number(industryAverages[key])) * 100;

    return {
      value: diff,
      label: `${Math.abs(percentDiff).toFixed(1)}% ${diff >= 0 ? 'above' : 'below'} industry avg`,
    };
  };

  // Render the metrics cards for the selected category
  const renderMetricsCards = () => {
    const selectedMetrics = categoryMetrics[category];

    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {selectedMetrics.map(metricConfig => (
          <Grid item xs={12} sm={6} md={3} key={metricConfig.key}>
            <MetricCard
              label={metricConfig.label}
              value={metrics ? metrics[metricConfig.key] : null}
              description={metricsDescriptions[metricConfig.key] || ''}
              isPercentage={metricConfig.isPercentage}
              isCurrency={metricConfig.isCurrency}
              isRatio={metricConfig.isRatio}
              isBigNumber={metricConfig.isBigNumber}
              comparison={getComparisonInfo(metricConfig.key)}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  // Handle loading and error states
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading financial metrics. Please try again later.
      </Alert>
    );
  }

  if (!metrics) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No financial metrics available for this stock.
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={category}
          onChange={handleCategoryChange}
          aria-label="Metrics categories"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Valuation" value="valuation" />
          <Tab label="Profitability" value="profitability" />
          <Tab label="Financial Health" value="financial-health" />
          <Tab label="Advanced" value="advanced" />
        </Tabs>
      </Box>

      {/* Render selected category metrics */}
      {renderMetricsCards()}

      {/* Metrics date */}
      {metrics && metrics.date && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 3, display: 'block', textAlign: 'right' }}
        >
          Data as of {new Date(metrics.date).toLocaleDateString()}
        </Typography>
      )}
    </Box>
  );
};
