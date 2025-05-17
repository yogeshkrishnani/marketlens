import { Box } from '@mui/material';
import { ReactNode, useState } from 'react';

import { Header } from './Header';

import { ComparisonDrawer, ComparisonFab } from '@/features/comparison/components/ComparisonDrawer';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [comparisonDrawerOpen, setComparisonDrawerOpen] = useState(false);

  const handleOpenComparisonDrawer = () => {
    setComparisonDrawerOpen(true);
  };

  const handleCloseComparisonDrawer = () => {
    setComparisonDrawerOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 2,
          pb: 4,
          px: { xs: 3, md: 4 },
          backgroundColor: 'background.default',
        }}
      >
        {children}
      </Box>

      <ComparisonFab onClick={handleOpenComparisonDrawer} />
      <ComparisonDrawer open={comparisonDrawerOpen} onClose={handleCloseComparisonDrawer} />
    </Box>
  );
};
