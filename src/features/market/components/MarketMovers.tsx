import { Box, Typography, Paper, Tabs, Tab, CircularProgress } from '@mui/material';
import { useState } from 'react';

import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useGetMarketMoversQuery } from '@/services/api/financialApi';
import { financialColors } from '@/theme';

export const MarketMovers = () => {
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers');
  const { data: marketMovers, isLoading, error, refetch } = useGetMarketMoversQuery();

  const handleTabChange = (_: React.SyntheticEvent, newValue: 'gainers' | 'losers') => {
    setTab(newValue);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  return (
    <Paper sx={{ overflow: 'hidden', height: '380px', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600}>
          Market Movers
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={handleTabChange}
        sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab
          label="TOP GAINERS"
          value="gainers"
          sx={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}
        />
        <Tab
          label="TOP LOSERS"
          value="losers"
          sx={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}
        />
      </Tabs>

      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        {isLoading ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <ErrorMessage
              message="Unable to load market movers. Please try again later."
              onRetry={refetch}
            />
          </Box>
        ) : marketMovers ? (
          <>
            {tab === 'gainers' && marketMovers.gainers.length > 0 ? (
              marketMovers.gainers.map((stock, i) => (
                <Box key={stock.symbol}>
                  <Box
                    sx={{
                      px: 3,
                      py: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      '&:hover': {
                        backgroundColor: theme =>
                          theme.palette.mode === 'light'
                            ? 'rgba(0,0,0,0.02)'
                            : 'rgba(255,255,255,0.03)',
                      },
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {stock.symbol}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {stock.name}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.25 }}>
                        {formatPrice(stock.price)}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: financialColors.positive,
                          fontWeight: 500,
                        }}
                      >
                        {formatChange(stock.change, stock.changePercent)}
                      </Typography>
                    </Box>
                  </Box>
                  {i < marketMovers.gainers.length - 1 && (
                    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />
                  )}
                </Box>
              ))
            ) : tab === 'losers' && marketMovers.losers.length > 0 ? (
              marketMovers.losers.map((stock, i) => (
                <Box key={stock.symbol}>
                  <Box
                    sx={{
                      px: 3,
                      py: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      '&:hover': {
                        backgroundColor: theme =>
                          theme.palette.mode === 'light'
                            ? 'rgba(0,0,0,0.02)'
                            : 'rgba(255,255,255,0.03)',
                      },
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {stock.symbol}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {stock.name}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.25 }}>
                        {formatPrice(stock.price)}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: financialColors.negative,
                          fontWeight: 500,
                        }}
                      >
                        {formatChange(stock.change, stock.changePercent)}
                      </Typography>
                    </Box>
                  </Box>
                  {i < marketMovers.losers.length - 1 && (
                    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />
                  )}
                </Box>
              ))
            ) : (
              <Box
                sx={{
                  p: 3,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography color="text.secondary">No market mover data available.</Typography>
              </Box>
            )}
          </>
        ) : (
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography color="text.secondary">No market mover data available.</Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};
