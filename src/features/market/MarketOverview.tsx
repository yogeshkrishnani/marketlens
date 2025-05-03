import { Box, Grid } from '@mui/material';

import { MarketIndices } from './components/MarketIndices';
import { MarketMovers } from './components/MarketMovers';
import { MarketOverviewHeader } from './components/MarketOverviewHeader';
import { SectorPerformance } from './components/SectorPerformance';

export const MarketOverview = () => {
  return (
    <Box sx={{ py: 3 }}>
      <MarketOverviewHeader />

      <Grid container spacing={3}>
        {/* Market Indices Component */}
        <Grid item xs={12} md={6} lg={4}>
          <MarketIndices />
        </Grid>

        {/* Sector Performance Component */}
        <Grid item xs={12} md={6} lg={4}>
          <SectorPerformance />
        </Grid>

        {/* Market Movers Component */}
        <Grid item xs={12} md={6} lg={4}>
          <MarketMovers />
        </Grid>
      </Grid>
    </Box>
  );
};
