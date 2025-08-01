import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Typography, Grid, Skeleton } from '@mui/material';

import { getMarketSummary } from '@/features/market/utils/marketSummary';
import { useGetMarketIndicesQuery } from '@/services/api/financialApi';
import { useGetSectorPerformanceQuery } from '@/services/api/financialApi';
import { financialColors } from '@/theme';

const formatDateInET = (timestamp: number): { date: string; time: string } => {
  const date = new Date(timestamp * 1000);

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York',
  };

  return {
    date: new Intl.DateTimeFormat('en-US', options).format(date),
    time: new Intl.DateTimeFormat('en-US', timeOptions).format(date),
  };
};

export const MarketOverviewHeader = () => {
  const { data: indices, isLoading: indicesLoading } = useGetMarketIndicesQuery();
  const { data: sectors, isLoading: sectorsLoading } = useGetSectorPerformanceQuery();

  const { marketTrend, summaryText, timestamp } = getMarketSummary(indices, sectors);

  let formattedDate = '';
  let formattedTime = '';

  if (timestamp) {
    const { date, time } = formatDateInET(timestamp);
    formattedDate = date;
    formattedTime = time;
  } else {
    const now = Date.now() / 1000;
    const { date, time } = formatDateInET(now);
    formattedDate = date;
    formattedTime = time;
  }

  const TrendIcon =
    marketTrend === 'up'
      ? TrendingUpIcon
      : marketTrend === 'down'
        ? TrendingDownIcon
        : TrendingFlatIcon;

  const trendColor =
    marketTrend === 'up'
      ? financialColors.positive
      : marketTrend === 'down'
        ? financialColors.negative
        : 'text.secondary';

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container alignItems="flex-start" justifyContent="space-between">
        <Grid item xs={12} md={6}>
          <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
            Market Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome to MarketLens. View the latest market data and trends at a glance.
          </Typography>
        </Grid>

        <Grid item xs={12} md={6} sx={{ mt: { xs: 1, md: 0 } }}>
          {indicesLoading || sectorsLoading ? (
            <Skeleton
              variant="rectangular"
              width={300}
              height={40}
              sx={{ ml: { xs: 0, md: 'auto' } }}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                alignItems: 'center',
                mb: 1,
                py: 1,
                px: 1.5,
                borderRadius: 2,
                backgroundColor: theme =>
                  theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                width: 'fit-content',
                ml: { xs: 0, md: 'auto' },
              }}
            >
              <TrendIcon
                fontSize="small"
                sx={{
                  color: trendColor,
                  mr: 1,
                }}
              />
              <Typography variant="body2" component="span">
                {summaryText}
              </Typography>
            </Box>
          )}

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              textAlign: { xs: 'left', md: 'right' },
            }}
          >
            Last updated: {formattedDate}, {formattedTime} ET
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};
