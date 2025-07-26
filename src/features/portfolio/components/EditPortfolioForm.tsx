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
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { usePortfolio } from '../context/PortfolioContext';
import { UpdatePortfolioData } from '../models';
import { getPortfolioById } from '../services/portfolioService';

import { useAuth } from '@/features/auth/context/AuthContext';

// Form validation interface
interface FormErrors {
  name?: string;
  description?: string;
}

// Form data interface
interface FormData {
  name: string;
  description: string;
}

export const EditPortfolioForm: React.FC = () => {
  const { id: portfolioId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    editPortfolio,
    isLoading: contextLoading,
    error: contextError,
    clearError,
  } = usePortfolio();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load portfolio data on mount
  useEffect(() => {
    const loadPortfolio = async () => {
      if (!portfolioId) {
        setLoadError('Portfolio ID not provided');
        setIsLoadingPortfolio(false);
        return;
      }

      try {
        const portfolio = await getPortfolioById(portfolioId);

        if (!portfolio) {
          setLoadError('Portfolio not found');
          return;
        }

        // Verify ownership
        if (portfolio.userId !== currentUser?.uid) {
          setLoadError('You do not have permission to edit this portfolio');
          return;
        }

        // Pre-populate form with existing data
        setFormData({
          name: portfolio.name,
          description: portfolio.description || '',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load portfolio';
        setLoadError(errorMessage);
      } finally {
        setIsLoadingPortfolio(false);
      }
    };

    loadPortfolio();
  }, [portfolioId, currentUser?.uid]);

  // Validate form data
  const validateForm = useCallback((data: FormData): FormErrors => {
    const errors: FormErrors = {};

    // Name validation
    if (!data.name.trim()) {
      errors.name = 'Portfolio name is required';
    } else if (data.name.trim().length < 2) {
      errors.name = 'Portfolio name must be at least 2 characters';
    } else if (data.name.trim().length > 50) {
      errors.name = 'Portfolio name must be less than 50 characters';
    }

    // Description validation (optional but if provided, check length)
    if (data.description.trim().length > 200) {
      errors.description = 'Description must be less than 200 characters';
    }

    return errors;
  }, []);

  // Handle input changes
  const handleInputChange = useCallback(
    (field: keyof FormData) => {
      return (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;

        setFormData(prev => ({
          ...prev,
          [field]: value,
        }));

        // Clear field error when user starts typing
        if (formErrors[field]) {
          setFormErrors(prev => ({
            ...prev,
            [field]: undefined,
          }));
        }

        // Clear global error
        if (contextError) {
          clearError();
        }
      };
    },
    [formErrors, contextError, clearError]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!portfolioId) {
        console.error('Portfolio ID not available');
        return;
      }

      // Validate form
      const errors = validateForm(formData);
      setFormErrors(errors);

      if (Object.keys(errors).length > 0) {
        return;
      }

      setIsSubmitting(true);

      try {
        // Create update data
        const updateData: UpdatePortfolioData = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        };

        // Update portfolio
        await editPortfolio(portfolioId, updateData);

        // Navigate back to portfolio detail
        navigate(`/portfolio/${portfolioId}`);
      } catch (error) {
        console.error('Failed to update portfolio:', error);
        // Error is handled by the context
      } finally {
        setIsSubmitting(false);
      }
    },
    [portfolioId, validateForm, formData, editPortfolio, navigate]
  );

  // Handle cancel action
  const handleCancel = useCallback(() => {
    navigate(`/portfolio/${portfolioId}`);
  }, [navigate, portfolioId]);

  // Check if form has changes (compare with original values)
  const hasChanges = formData.name.trim() || formData.description.trim();

  // Loading state
  if (isLoadingPortfolio) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Load error state
  if (loadError) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {loadError}
          </Alert>
          <Button variant="outlined" onClick={() => navigate('/portfolio')}>
            Back to Portfolios
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Header */}
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
            Edit Portfolio
          </Typography>
        </Box>

        {/* Form */}
        <Paper sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Global error message */}
              {contextError && (
                <Alert severity="error" onClose={clearError}>
                  {contextError}
                </Alert>
              )}

              {/* Portfolio Name */}
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
                disabled={isSubmitting || contextLoading}
                inputProps={{ maxLength: 50 }}
              />

              {/* Portfolio Description */}
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
                disabled={isSubmitting || contextLoading}
                inputProps={{ maxLength: 200 }}
              />

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={isSubmitting || contextLoading}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={
                    isSubmitting || contextLoading ? <CircularProgress size={16} /> : <SaveIcon />
                  }
                  disabled={isSubmitting || contextLoading || !hasChanges}
                  sx={{ minWidth: 160 }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>

        {/* Help Text */}
        <Box sx={{ mt: 3, p: 3, backgroundColor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Editing Portfolio:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Update your portfolio name and description to better reflect your investment strategy.
            Changes will be saved immediately and visible on your portfolio list.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};
