import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePortfolio } from '../context/PortfolioContext';
import { CreatePortfolioData } from '../models';

import { useAuth } from '@/features/auth/context/AuthContext';

interface FormErrors {
  name?: string;
  description?: string;
}

interface FormData {
  name: string;
  description: string;
}

interface PortfolioFormProps {
  readonly title?: string;
  readonly submitButtonText?: string;
  readonly onCancel?: () => void;
}

export const PortfolioForm: React.FC<PortfolioFormProps> = ({
  title = 'Create New Portfolio',
  submitButtonText = 'Create Portfolio',
  onCancel,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { createPortfolio, isLoading, error, clearError } = usePortfolio();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback((data: FormData): FormErrors => {
    const errors: FormErrors = {};

    if (!data.name.trim()) {
      errors.name = 'Portfolio name is required';
    } else if (data.name.trim().length < 2) {
      errors.name = 'Portfolio name must be at least 2 characters';
    } else if (data.name.trim().length > 50) {
      errors.name = 'Portfolio name must be less than 50 characters';
    }

    if (data.description.trim().length > 200) {
      errors.description = 'Description must be less than 200 characters';
    }

    return errors;
  }, []);

  const handleInputChange = useCallback(
    (field: keyof FormData) => {
      return (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;

        setFormData(prev => ({
          ...prev,
          [field]: value,
        }));

        if (formErrors[field]) {
          setFormErrors(prev => ({
            ...prev,
            [field]: undefined,
          }));
        }

        if (error) {
          clearError();
        }
      };
    },
    [formErrors, error, clearError]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!currentUser?.uid) {
        console.error('No authenticated user found');
        return;
      }

      const errors = validateForm(formData);
      setFormErrors(errors);

      if (Object.keys(errors).length > 0) {
        return;
      }

      setIsSubmitting(true);

      try {
        const portfolioData: CreatePortfolioData = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        };

        const newPortfolio = await createPortfolio(currentUser.uid, portfolioData);

        navigate(`/portfolio/${newPortfolio.id}`);
      } catch (error) {
        console.error('Failed to create portfolio:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser?.uid, validateForm, formData, createPortfolio, navigate]
  );

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/portfolio');
    }
  }, [onCancel, navigate]);

  const hasChanges = formData.name.trim() || formData.description.trim();

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
            sx={{ flexShrink: 0 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1" fontWeight={600}>
            {title}
          </Typography>
        </Box>

        <Paper sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {error && (
                <Alert severity="error" onClose={clearError}>
                  {error}
                </Alert>
              )}

              <TextField
                label="Portfolio Name"
                placeholder="e.g., Growth Portfolio, Retirement Fund"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={Boolean(formErrors.name)}
                helperText={formErrors.name || 'Choose a descriptive name for your portfolio'}
                required
                fullWidth
                autoFocus
                disabled={isSubmitting || isLoading}
                inputProps={{ maxLength: 50 }}
              />

              <TextField
                label="Description (Optional)"
                placeholder="Describe your investment strategy, goals, or focus..."
                value={formData.description}
                onChange={handleInputChange('description')}
                error={Boolean(formErrors.description)}
                helperText={
                  formErrors.description || 'Optional: Add details about your portfolio strategy'
                }
                fullWidth
                multiline
                rows={3}
                disabled={isSubmitting || isLoading}
                inputProps={{ maxLength: 200 }}
              />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={isSubmitting || isLoading}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={
                    isSubmitting || isLoading ? <CircularProgress size={16} /> : <SaveIcon />
                  }
                  disabled={isSubmitting || isLoading || !hasChanges}
                  sx={{ minWidth: 160 }}
                >
                  {isSubmitting ? 'Creating...' : submitButtonText}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>

        <Box sx={{ mt: 3, p: 3, backgroundColor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Getting Started:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            After creating your portfolio, you'll be able to add stock positions, track performance,
            and monitor your investments. You can always edit the name and description later.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};
