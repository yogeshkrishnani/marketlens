import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SaveIcon from '@mui/icons-material/Save';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { updateProfile } from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';

import { storage } from '@/services/firebase/config';

interface ProfileEditFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ onCancel, onSuccess }) => {
  const { currentUser } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
    }
  }, [currentUser]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        return;
      }

      setProfileImage(file);

      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setError('You must be logged in to update your profile');
      return;
    }

    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let photoURL = currentUser.photoURL;

      if (profileImage) {
        const storageRef = ref(storage, `profile_images/${currentUser.uid}`);
        await uploadBytes(storageRef, profileImage);
        photoURL = await getDownloadURL(storageRef);
      }

      await updateProfile(currentUser, {
        displayName: displayName.trim(),
        photoURL,
      });

      setSuccess(true);

      // Notify parent component of successful update
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating your profile');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Edit Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Profile updated successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Image */}
        <Grid
          item
          xs={12}
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}
        >
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={imagePreview || currentUser?.photoURL || undefined}
              sx={{ width: 100, height: 100, mb: 1 }}
            >
              {currentUser?.displayName?.[0]?.toUpperCase() ||
                currentUser?.email?.[0]?.toUpperCase() ||
                'U'}
            </Avatar>
            <IconButton
              color="primary"
              aria-label="upload picture"
              component="label"
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: 'background.paper',
                '&:hover': { backgroundColor: 'background.default' },
                boxShadow: 1,
              }}
              size="small"
            >
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={handleImageChange}
                disabled={loading || success}
              />
              <PhotoCameraIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Click the camera icon to upload a new profile picture
          </Typography>
        </Grid>

        {/* Display Name */}
        <Grid item xs={12}>
          <TextField
            label="Display Name"
            fullWidth
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            disabled={loading || success}
            required
            helperText="This name will be visible to other users"
          />
        </Grid>

        {/* Email (read-only) */}
        <Grid item xs={12}>
          <TextField
            label="Email"
            fullWidth
            value={currentUser?.email || ''}
            disabled
            helperText="Email cannot be changed here. Use settings to update email."
          />
        </Grid>

        {/* Buttons */}
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            startIcon={<CancelIcon />}
            disabled={loading || success}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={loading || success}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};
