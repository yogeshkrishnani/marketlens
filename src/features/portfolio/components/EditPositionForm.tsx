import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { UpdatePositionData } from '../models';
import { getPortfolioById, updatePositionInPortfolio } from '../services/portfolioService';

import { useAuth } from '@/features/auth/context/AuthContext';

// Form validation interface
interface FormErrors {
  shares?: string;
  purchasePrice?: string;
  purchaseDate?: string;
  notes?: string;
}

// Form data interface
interface FormData {
  shares: string;
  purchasePrice: string;
  purchaseDate: string;
  notes: string;
}

export const EditPositionForm: React.FC = () => {
  const { id: portfolioId, positionId } = useParams<{ id: string; positionId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    shares: '',
    purchasePrice: '',
    purchaseDate: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolioName, setPortfolioName] = useState<string>('');
  const [positionSymbol, setPositionSymbol] = useState<string>('');
  const [isLoadingPosition, setIsLoadingPosition] = useState(true);

  // Load position data on mount
  useEffect(() => {
    const loadPosition = async () => {
      if (!portfolioId || !positionId) {
        setError('Portfolio ID or Position ID not provided');
        setIsLoadingPosition(false);
        return;
      }

      try {
        const portfolio = await getPortfolioById(portfolioId);
        if (!portfolio) {
          setError('Portfolio not found');
          return;
        }

        // Verify ownership
        if (portfolio.userId !== currentUser?.uid) {
          setError('You do not have permission to edit positions in this portfolio');
          return;
        }

        // Find the position to edit
        const position = portfolio.positions.find(p => p.id === positionId);
        if (!position) {
          setError('Position not found in portfolio');
          return;
        }

        // Pre-populate form with existing position data
        setFormData({
          shares: position.shares.toString(),
          purchasePrice: position.purchasePrice.toString(),
          purchaseDate: position.purchaseDate.toISOString().split('T')[0],
          notes: position.notes || '',
        });

        setPortfolioName(portfolio.name);
        setPositionSymbol(position.symbol);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load position';
        setError(errorMessage);
      } finally {
        setIsLoadingPosition(false);
      }
    };

    loadPosition();
  }, [portfolioId, positionId, currentUser?.uid]);

  // Validate form data
  const validateForm = useCallback((data: FormData): FormErrors => {
    const errors: FormErrors = {};

    // Shares validation
    if (!data.shares.trim()) {
      errors.shares = 'Number of shares is required';
    } else {
      const shares = parseFloat(data.shares);
      if (isNaN(shares) || shares <= 0) {
        errors.shares = 'Shares must be a positive number';
      } else if (shares > 1000000) {
        errors.shares = 'Shares cannot exceed 1,000,000';
      }
    }

    // Purchase price validation
    if (!data.purchasePrice.trim()) {
      errors.purchasePrice = 'Purchase price is required';
    } else {
      const price = parseFloat(data.purchasePrice);
      if (isNaN(price) || price <= 0) {
        errors.purchasePrice = 'Purchase price must be a positive number';
      } else if (price > 100000) {
        errors.purchasePrice = 'Purchase price cannot exceed $100,000';
      }
    }

    // Purchase date validation
    if (!data.purchaseDate) {
      errors.purchaseDate = 'Purchase date is required';
    } else {
      const purchaseDate = new Date(data.purchaseDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      if (purchaseDate > today) {
        errors.purchaseDate = 'Purchase date cannot be in the future';
      }

      // Check if date is too old (more than 50 years ago)
      const fiftyYearsAgo = new Date();
      fiftyYearsAgo.setFullYear(fiftyYearsAgo.getFullYear() - 50);
      if (purchaseDate < fiftyYearsAgo) {
        errors.purchaseDate = 'Purchase date cannot be more than 50 years ago';
      }
    }

    return errors;
  }, []);

  // Handle input changes
  const handleInputChange = useCallback(
    (field: keyof FormData) => {
      return (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = event.target.value;

        // Special handling for numeric fields
        if (field === 'shares' || field === 'purchasePrice') {
          // Allow only numbers and decimal point
          value = value.replace(/[^0-9.]/g, '');
          // Prevent multiple decimal points
          const parts = value.split('.');
          if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
          }
        }

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
        if (error) {
          setError(null);
        }
      };
    },
    [formErrors, error]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!portfolioId || !positionId) {
        setError('Portfolio ID or Position ID not available');
        return;
      }

      // Validate form
      const errors = validateForm(formData);
      setFormErrors(errors);

      if (Object.keys(errors).length > 0) {
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        // Create update data
        const updateData: UpdatePositionData = {
          shares: parseFloat(formData.shares),
          purchasePrice: parseFloat(formData.purchasePrice),
          purchaseDate: new Date(formData.purchaseDate),
          notes: formData.notes.trim() || undefined,
        };

        // Update position in portfolio
        await updatePositionInPortfolio(portfolioId, positionId, updateData);

        // Success - navigate back to portfolio detail
        navigate(`/portfolio/${portfolioId}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update position';
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [portfolioId, positionId, validateForm, formData, navigate]
  );

  // Handle cancel action
  const handleCancel = useCallback(() => {
    navigate(`/portfolio/${portfolioId}`);
  }, [navigate, portfolioId]);

  // Check if form has changes
  const hasChanges =
    formData.shares.trim() ||
    formData.purchasePrice.trim() ||
    formData.purchaseDate ||
    formData.notes.trim();

  // Loading state
  if (isLoadingPosition) {
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

  // Error state
  if (error && !portfolioName) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
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
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
            sx={{ flexShrink: 0 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h4" component="h1" fontWeight={600}>
              Edit Position
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Edit {positionSymbol} position in "{portfolioName}"
            </Typography>
          </Box>
        </Stack>

        {/* Form */}
        <Paper sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Global error message */}
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Stock Symbol (Read-only) */}
              <TextField
                label="Stock Symbol"
                value={positionSymbol}
                disabled
                fullWidth
                helperText="Stock symbol cannot be changed. Delete and re-add position to change symbol."
              />

              {/* Shares and Purchase Price Row */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Number of Shares"
                  placeholder="e.g., 100"
                  value={formData.shares}
                  onChange={handleInputChange('shares')}
                  error={Boolean(formErrors.shares)}
                  helperText={formErrors.shares || 'How many shares do you own?'}
                  required
                  fullWidth
                  autoFocus
                  disabled={isSubmitting}
                  inputProps={{ inputMode: 'decimal' }}
                />

                <TextField
                  label="Purchase Price"
                  placeholder="e.g., 150.00"
                  value={formData.purchasePrice}
                  onChange={handleInputChange('purchasePrice')}
                  error={Boolean(formErrors.purchasePrice)}
                  helperText={formErrors.purchasePrice || 'Price per share in USD'}
                  required
                  fullWidth
                  disabled={isSubmitting}
                  inputProps={{ inputMode: 'decimal' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Stack>

              {/* Purchase Date */}
              <TextField
                label="Purchase Date"
                type="date"
                value={formData.purchaseDate}
                onChange={handleInputChange('purchaseDate')}
                error={Boolean(formErrors.purchaseDate)}
                helperText={formErrors.purchaseDate || 'When did you purchase this stock?'}
                required
                fullWidth
                disabled={isSubmitting}
                InputLabelProps={{
                  shrink: true,
                }}
              />

              {/* Notes */}
              <TextField
                label="Notes (Optional)"
                placeholder="Investment thesis, strategy, or other notes..."
                value={formData.notes}
                onChange={handleInputChange('notes')}
                fullWidth
                multiline
                rows={3}
                disabled={isSubmitting}
                helperText="Optional: Add notes about your investment decision"
                inputProps={{ maxLength: 500 }}
              />

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={handleCancel} disabled={isSubmitting}>
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
                  disabled={isSubmitting || !hasChanges}
                  sx={{ minWidth: 160 }}
                >
                  {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Paper>

        {/* Help Text */}
        <Box sx={{ mt: 3, p: 3, backgroundColor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Editing Positions:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can update the number of shares, purchase price, purchase date, and notes for this
            position. The stock symbol cannot be changed - delete and re-add the position if you
            need to change the symbol.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};
