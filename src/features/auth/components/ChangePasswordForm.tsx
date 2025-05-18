// src/features/auth/components/ChangePasswordForm.tsx
import { Save, Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import React, { useState } from 'react';

import { useAuth } from '../context/AuthContext';

export const ChangePasswordForm: React.FC = () => {
  const { currentUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Toggle password visibility
  const handleToggleCurrentPassword = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const handleToggleNewPassword = () => {
    setShowNewPassword(!showNewPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Validate form
  const validateForm = () => {
    // Reset error state
    setError('');

    // Check if all fields are filled
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return false;
    }

    // Check if new password meets requirements
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return false;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return false;
    }

    // Check if new password is different from current
    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !currentUser.email) {
      setError('You must be logged in to change your password');
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);

      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);

      // Clear form and show success message
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err: any) {
      // Handle specific error cases
      if (err.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later');
      } else {
        setError(err.message || 'Failed to update password');
        console.error('Password change error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show alternative message for OAuth users
  if (currentUser?.providerData[0]?.providerId !== 'password') {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        Password change is not available for accounts signed in with
        {currentUser?.providerData[0]?.providerId === 'google.com'
          ? ' Google'
          : ' an external provider'}
        .
      </Alert>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 'sm', mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Change Password
      </Typography>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        For security reasons, please enter your current password to verify your identity.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ my: 2 }}>
          Password changed successfully!
        </Alert>
      )}

      <TextField
        margin="normal"
        required
        fullWidth
        name="currentPassword"
        label="Current Password"
        type={showCurrentPassword ? 'text' : 'password'}
        value={currentPassword}
        onChange={e => setCurrentPassword(e.target.value)}
        disabled={loading || success}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleToggleCurrentPassword}
                edge="end"
              >
                {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="newPassword"
        label="New Password"
        type={showNewPassword ? 'text' : 'password'}
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        disabled={loading || success}
        helperText="Password must be at least 8 characters long"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleToggleNewPassword}
                edge="end"
              >
                {showNewPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label="Confirm New Password"
        type={showConfirmPassword ? 'text' : 'password'}
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        disabled={loading || success}
        helperText="Re-enter your new password"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleToggleConfirmPassword}
                edge="end"
              >
                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
        disabled={loading || success}
        sx={{ mt: 3, mb: 2 }}
      >
        {loading ? 'Updating...' : 'Update Password'}
      </Button>
    </Box>
  );
};
