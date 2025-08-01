import { Box, Divider, Grid, Typography } from '@mui/material';
import React from 'react';

import { useAuth } from '../context/AuthContext';

export const ProfileInfo: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Profile Information
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Display Name
          </Typography>
          <Typography variant="body1">{currentUser?.displayName || 'Not set'}</Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Email
          </Typography>
          <Typography variant="body1">{currentUser?.email}</Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Account Details
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Authentication Provider
        </Typography>
        <Typography variant="body1">
          {currentUser?.providerData?.[0]?.providerId === 'password'
            ? 'Email/Password'
            : currentUser?.providerData?.[0]?.providerId === 'google.com'
              ? 'Google'
              : currentUser?.providerData?.[0]?.providerId || 'Unknown'}
        </Typography>
      </Box>
    </Box>
  );
};
