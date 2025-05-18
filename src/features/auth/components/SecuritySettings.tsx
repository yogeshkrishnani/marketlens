// src/features/auth/components/SecuritySettings.tsx
import { Alert, Box, Button, Chip, CircularProgress, Divider, Typography } from '@mui/material';
import { sendEmailVerification } from 'firebase/auth';
import React, { useState } from 'react';

import { useAuth } from '../context/AuthContext';

import { ChangePasswordForm } from './ChangePasswordForm';

export const SecuritySettings: React.FC = () => {
  const { currentUser } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // State variables for email verification
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  // Handle sending verification email
  const handleSendVerification = async () => {
    if (!currentUser) return;

    try {
      setVerificationLoading(true);
      setVerificationError('');

      await sendEmailVerification(currentUser);

      setVerificationSuccess(true);
      // Reset success message after 5 seconds
      setTimeout(() => {
        setVerificationSuccess(false);
      }, 5000);
    } catch (err: any) {
      // Handle specific error cases
      if (err.code === 'auth/too-many-requests') {
        setVerificationError('Too many requests. Please try again later.');
      } else {
        setVerificationError(err.message || 'Failed to send verification email');
      }
      console.error('Email verification error:', err);
    } finally {
      setVerificationLoading(false);
    }
  };

  // Function to refresh user data (to check if email has been verified)
  const refreshUserData = async () => {
    if (currentUser) {
      try {
        await currentUser.reload();
        // Force component re-render to reflect updated email verification status
        setVerificationSuccess(false);
      } catch (err) {
        console.error('Error refreshing user data:', err);
      }
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Security Settings
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Email Verification
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Chip
            label={currentUser?.emailVerified ? 'Verified' : 'Not Verified'}
            color={currentUser?.emailVerified ? 'success' : 'warning'}
          />

          {!currentUser?.emailVerified && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleSendVerification}
              disabled={verificationLoading}
              startIcon={verificationLoading ? <CircularProgress size={16} /> : null}
            >
              {verificationLoading ? 'Sending...' : 'Send Verification Email'}
            </Button>
          )}

          {/* Button to refresh verification status */}
          {!currentUser?.emailVerified && (
            <Button variant="text" size="small" onClick={refreshUserData}>
              Refresh Status
            </Button>
          )}
        </Box>

        {/* Show success message */}
        {verificationSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Verification email sent! Check your inbox and click the link to verify your email
            address.
          </Alert>
        )}

        {/* Show error message */}
        {verificationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {verificationError}
          </Alert>
        )}

        {/* Information about email verification */}
        {!currentUser?.emailVerified && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Please verify your email address to enable all account features. After clicking the link
            in the verification email, you can click "Refresh Status" to update your verification
            status.
          </Alert>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Password
        </Typography>

        {showPasswordForm ? (
          <>
            <ChangePasswordForm />
            <Button variant="text" onClick={() => setShowPasswordForm(false)} sx={{ mt: 2 }}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="outlined" size="small" onClick={() => setShowPasswordForm(true)}>
            Change Password
          </Button>
        )}
      </Box>
    </Box>
  );
};
