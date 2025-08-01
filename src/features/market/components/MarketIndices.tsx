import { Box, Typography, Paper, Divider, CircularProgress } from '@mui/material';

import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatIndexPrice, formatIndexChange } from '@/features/market/utils/indices';
import { useGetMarketIndicesQuery } from '@/services/api/financialApi';
import { financialColors } from '@/theme';

export const MarketIndices = () => {
  const { data: indices, isLoading, error, refetch } = useGetMarketIndicesQuery();

  return (
    <Paper sx={{ overflow: 'hidden', height: '380px', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600}>
          Market Indices
        </Typography>
      </Box>

      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        {isLoading ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <ErrorMessage
            message="Unable to load market indices. Please try again later."
            onRetry={refetch}
          />
        ) : indices && indices.length > 0 ? (
          indices.map((index, i) => (
            <Box key={index.symbol}>
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
                <Typography variant="body2" fontWeight={500}>
                  {index.name}
                </Typography>

                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
                    {formatIndexPrice(index.price)}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        index.change >= 0 ? financialColors.positive : financialColors.negative,
                      fontWeight: 500,
                    }}
                  >
                    {formatIndexChange(index.change, index.changePercent)}
                  </Typography>
                </Box>
              </Box>
              {i < indices.length - 1 && <Divider />}
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
            <Typography color="text.secondary">No market indices data available.</Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};
