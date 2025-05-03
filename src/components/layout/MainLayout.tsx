import { Box } from '@mui/material';
import { ReactNode } from 'react';

import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
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
    </Box>
  );
};
