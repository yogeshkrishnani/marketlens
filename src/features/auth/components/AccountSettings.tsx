// src/features/auth/components/AccountSettings.tsx
import { useUser } from '@features/auth/context/UserContext';
import {
  defaultUserSettings,
  updateUserSettings,
} from '@features/auth/services/userProfileService';
import { toggleTheme } from '@features/theme/themeSlice';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Switch,
  Typography,
} from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';

import { useAppDispatch, useAppSelector } from '@/hooks';
import { db } from '@/services/firebase/config';

// Define user settings interface
interface UserSettings {
  // Theme preferences
  themeSyncWithSystem: boolean;

  // Data display preferences
  defaultChartPeriod: string;
  defaultDataRefreshInterval: number;
  showAdvancedMetrics: boolean;

  // Notification preferences
  emailNotifications: boolean;
  priceAlerts: boolean;
  newsAlerts: boolean;
}

// Default settings
const defaultSettings: UserSettings = {
  themeSyncWithSystem: true,
  defaultChartPeriod: '1M',
  defaultDataRefreshInterval: 60, // seconds
  showAdvancedMetrics: false,
  emailNotifications: true,
  priceAlerts: false,
  newsAlerts: false,
};

export const AccountSettings: React.FC = () => {
  const { currentUser } = useAuth();
  const { userProfile, refreshUserProfile } = useUser();
  const dispatch = useAppDispatch();
  const { mode } = useAppSelector(state => state.theme);

  const [settings, setSettings] = useState(userProfile?.settings || defaultUserSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (userProfile?.settings) {
      setSettings(userProfile.settings);
    }
  }, [userProfile]);

  // Load user settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists() && docSnap.data().settings) {
          setSettings({
            ...defaultSettings, // Include defaults for any missing fields
            ...docSnap.data().settings, // Override with user's saved settings
          });
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [currentUser]);

  // Save settings to Firestore
  const saveSettings = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);
      setError('');

      // Update user settings in Firestore
      await updateUserSettings(currentUser.uid, settings);

      // Refresh user profile to get the latest data
      await refreshUserProfile();

      setSuccess(true);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
      console.error('Settings save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Handle settings changes
  const handleChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));

    // For theme sync option, also update theme immediately
    if (key === 'themeSyncWithSystem' && value === false) {
      // If turning off system sync, set theme based on current mode
    } else if (key === 'themeSyncWithSystem' && value === true) {
      // If turning on system sync, update theme based on system preference
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if ((prefersDarkMode && mode === 'light') || (!prefersDarkMode && mode === 'dark')) {
        dispatch(toggleTheme());
      }
    }
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Application Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ my: 2 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Theme Preferences */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={500} gutterBottom>
              Theme Preferences
            </Typography>

            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.themeSyncWithSystem}
                    onChange={e => handleChange('themeSyncWithSystem', e.target.checked)}
                  />
                }
                label="Sync with system theme"
              />

              {!settings.themeSyncWithSystem && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 2 }}>
                    Current theme: {mode === 'dark' ? 'Dark' : 'Light'}
                  </Typography>
                  <Button variant="outlined" size="small" onClick={handleThemeToggle}>
                    Switch to {mode === 'dark' ? 'Light' : 'Dark'} Mode
                  </Button>
                </Box>
              )}
            </FormGroup>
          </Paper>
        </Grid>

        {/* Data Display Preferences */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={500} gutterBottom>
              Data Display Preferences
            </Typography>

            <FormControl fullWidth margin="normal" size="small">
              <InputLabel id="chart-period-label">Default Chart Period</InputLabel>
              <Select
                labelId="chart-period-label"
                value={settings.defaultChartPeriod}
                label="Default Chart Period"
                onChange={(e: SelectChangeEvent) =>
                  handleChange('defaultChartPeriod', e.target.value)
                }
              >
                <MenuItem value="1D">1 Day</MenuItem>
                <MenuItem value="1W">1 Week</MenuItem>
                <MenuItem value="1M">1 Month</MenuItem>
                <MenuItem value="3M">3 Months</MenuItem>
                <MenuItem value="1Y">1 Year</MenuItem>
                <MenuItem value="5Y">5 Years</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" size="small">
              <InputLabel id="refresh-interval-label">Data Refresh Interval</InputLabel>
              <Select
                labelId="refresh-interval-label"
                value={settings.defaultDataRefreshInterval.toString()}
                label="Data Refresh Interval"
                onChange={(e: SelectChangeEvent) =>
                  handleChange('defaultDataRefreshInterval', Number(e.target.value))
                }
              >
                <MenuItem value="30">30 seconds</MenuItem>
                <MenuItem value="60">1 minute</MenuItem>
                <MenuItem value="300">5 minutes</MenuItem>
                <MenuItem value="600">10 minutes</MenuItem>
                <MenuItem value="1800">30 minutes</MenuItem>
              </Select>
            </FormControl>

            <FormGroup sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showAdvancedMetrics}
                    onChange={e => handleChange('showAdvancedMetrics', e.target.checked)}
                  />
                }
                label="Show advanced financial metrics"
              />
            </FormGroup>
          </Paper>
        </Grid>

        {/* Notification Preferences */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={500} gutterBottom>
              Notification Preferences
            </Typography>

            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={e => handleChange('emailNotifications', e.target.checked)}
                  />
                }
                label="Email notifications"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.priceAlerts}
                    onChange={e => handleChange('priceAlerts', e.target.checked)}
                  />
                }
                label="Price alerts"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.newsAlerts}
                    onChange={e => handleChange('newsAlerts', e.target.checked)}
                  />
                }
                label="News alerts"
              />
            </FormGroup>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Note: Email notifications will be sent to {currentUser?.email}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={saveSettings}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
};
