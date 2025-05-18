// src/features/auth/pages/AccountPage.tsx
import { AccountSettings } from '@features/auth/components/AccountSettings';
import { ProfileEditForm } from '@features/auth/components/ProfileEditForm';
import { SecuritySettings } from '@features/auth/components/SecuritySettings';
import EditIcon from '@mui/icons-material/Edit';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const AccountPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add this to force refresh

  useEffect(() => {
    // The useAuth hook should automatically refresh the currentUser
    // when changes occur, so we don't need additional logic here.
    // The dependency on refreshTrigger ensures this effect runs
    // after profile updates.

    console.log('User data refreshed');
  }, [refreshTrigger]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Calculate when the user joined
  const joinedDate = currentUser?.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 2, px: { xs: 2, md: 0 } }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
        Account
      </Typography>

      <Grid container spacing={4}>
        {/* Sidebar with user info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                src={currentUser?.photoURL || undefined}
                sx={{ width: 120, height: 120, mb: 2 }}
              >
                {currentUser?.displayName?.[0]?.toUpperCase() ||
                  currentUser?.email?.[0]?.toUpperCase() ||
                  'U'}
              </Avatar>

              <Typography variant="h5" gutterBottom fontWeight={500}>
                {currentUser?.displayName || 'User'}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                {currentUser?.email}
              </Typography>

              <Chip
                label={currentUser?.emailVerified ? 'Email Verified' : 'Email Not Verified'}
                color={currentUser?.emailVerified ? 'success' : 'warning'}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Account Type
              </Typography>
              <Typography variant="body1">Standard</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Joined
              </Typography>
              <Typography variant="body1">{joinedDate}</Typography>
            </Box>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<EditIcon />}
              onClick={() => setIsEditing(true)}
              sx={{ mt: 2 }}
            >
              Edit Profile
            </Button>
          </Paper>
        </Grid>

        {/* Main content area */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="account tabs"
              variant="fullWidth"
            >
              <Tab label="Profile" id="account-tab-0" />
              <Tab label="Settings" id="account-tab-1" />
              <Tab label="Security" id="account-tab-2" />
            </Tabs>

            <Box sx={{ px: 3 }}>
              {/* Profile Tab */}
              <TabPanel value={activeTab} index={0}>
                {isEditing ? (
                  <ProfileEditForm
                    onCancel={() => setIsEditing(false)}
                    onSuccess={() => {
                      setIsEditing(false);
                      // Force component refresh to show updated profile
                      setRefreshTrigger(prev => prev + 1);
                    }}
                  />
                ) : (
                  <ProfileInfo />
                )}
              </TabPanel>

              {/* Settings Tab */}
              <TabPanel value={activeTab} index={1}>
                <AccountSettings />
              </TabPanel>

              {/* Security Tab */}
              <TabPanel value={activeTab} index={2}>
                <SecuritySettings />
              </TabPanel>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Profile Information Display
const ProfileInfo: React.FC = () => {
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
