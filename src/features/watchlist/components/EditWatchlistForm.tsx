// src/features/watchlist/components/EditWatchlistForm.tsx

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

import {
  isValidSymbol,
  isValidWatchlistName,
  UpdateWatchlistData,
  WATCHLIST_CONSTRAINTS,
} from '../models';
import { getWatchlistById, updateWatchlist } from '../services/watchlistService';

import { useAuth } from '@/features/auth/context/AuthContext';

// Form validation interface
interface FormErrors {
  name?: string;
  symbols?: string;
}

// Form data interface
interface FormData {
  name: string;
  symbols: string; // Comma-separated string for input
}

export const EditWatchlistForm: React.FC = () => {
  const { id: watchlistId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    symbols: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchlistName, setWatchlistName] = useState<string>('');

  // Load watchlist data on mount
  useEffect(() => {
    const loadWatchlist = async () => {
      if (!watchlistId) {
        setError('Watchlist ID not provided');
        setIsLoading(false);
        return;
      }

      try {
        const watchlist = await getWatchlistById(watchlistId);
        if (!watchlist) {
          setError('Watchlist not found');
          return;
        }

        // Verify ownership
        if (watchlist.userId !== currentUser?.uid) {
          setError('You do not have permission to edit this watchlist');
          return;
        }

        // Populate form with current data
        setFormData({
          name: watchlist.name,
          symbols: watchlist.symbols.join(', '),
        });
        setWatchlistName(watchlist.name);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load watchlist';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadWatchlist();
  }, [watchlistId, currentUser?.uid]);

  // Parse symbols from input string
  const parseSymbols = useCallback((symbolsString: string): string[] => {
    if (!symbolsString.trim()) return [];

    return symbolsString
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0 && isValidSymbol(s))
      .filter((symbol, index, array) => array.indexOf(symbol) === index); // Remove duplicates
  }, []);

  // Validate form data
  const validateForm = useCallback((data: FormData): FormErrors => {
    const errors: FormErrors = {};

    // Name validation
    if (!data.name.trim()) {
      errors.name = 'Watchlist name is required';
    } else if (!isValidWatchlistName(data.name.trim())) {
      errors.name = `Name must be between ${WATCHLIST_CONSTRAINTS.MIN_NAME_LENGTH} and ${WATCHLIST_CONSTRAINTS.MAX_NAME_LENGTH} characters`;
    }

    // Symbols validation
    if (data.symbols.trim()) {
      const symbols = data.symbols
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0);

      if (symbols.length > WATCHLIST_CONSTRAINTS.MAX_SYMBOLS_PER_WATCHLIST) {
        errors.symbols = `Maximum ${WATCHLIST_CONSTRAINTS.MAX_SYMBOLS_PER_WATCHLIST} symbols allowed`;
      }

      // Validate each symbol format
      const invalidSymbols = symbols.filter(symbol => !isValidSymbol(symbol));
      if (invalidSymbols.length > 0) {
        errors.symbols = `Invalid symbols: ${invalidSymbols.join(', ')}. Use 1-5 letters only.`;
      }

      // Check for duplicates
      const uniqueSymbols = new Set(symbols);
      if (uniqueSymbols.size !== symbols.length) {
        errors.symbols = 'Duplicate symbols are not allowed';
      }
    }

    return errors;
  }, []);

  // Handle input changes
  const handleInputChange = useCallback(
    (field: keyof FormData) => {
      return (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = event.target.value;

        // Special handling for symbols field
        if (field === 'symbols') {
          // Allow letters, commas, and spaces only
          value = value.toUpperCase().replace(/[^A-Z,\s]/g, '');
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

      if (!watchlistId) {
        setError('Watchlist ID not available');
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
        // Parse symbols
        const symbols = parseSymbols(formData.symbols);

        // Create update data
        const updateData: UpdateWatchlistData = {
          name: formData.name.trim(),
          symbols: symbols,
        };

        // Update watchlist
        await updateWatchlist(watchlistId, updateData);

        // Success - navigate back to watchlists
        navigate('/watchlists');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update watchlist';
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [watchlistId, validateForm, formData, parseSymbols, navigate]
  );

  // Handle cancel action
  const handleCancel = useCallback(() => {
    navigate('/watchlists');
  }, [navigate]);

  // Check if form has changes
  const hasChanges = formData.name.trim() || formData.symbols.trim();

  // Get symbol count for display
  const symbolCount = parseSymbols(formData.symbols).length;

  // Loading state
  if (isLoading) {
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
  if (error && !watchlistName) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button variant="outlined" onClick={() => navigate('/watchlists')}>
            Back to Watchlists
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
          <Box>
            <Typography variant="h4" component="h1" fontWeight={600}>
              Edit Watchlist
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Update "{watchlistName}"
            </Typography>
          </Box>
        </Box>

        {/* Form */}
        <Paper sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Global error message */}
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Watchlist Name */}
              <TextField
                label="Watchlist Name"
                placeholder="e.g., Tech Stocks, Growth Watch, Blue Chips"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={Boolean(formErrors.name)}
                helperText={formErrors.name || 'Choose a descriptive name for your watchlist'}
                required
                fullWidth
                autoFocus
                disabled={isSubmitting}
                inputProps={{ maxLength: WATCHLIST_CONSTRAINTS.MAX_NAME_LENGTH }}
              />

              {/* Symbols */}
              <TextField
                label="Stocks"
                placeholder="e.g., AAPL, GOOGL, MSFT"
                value={formData.symbols}
                onChange={handleInputChange('symbols')}
                error={Boolean(formErrors.symbols)}
                helperText={
                  formErrors.symbols ||
                  `Edit stock symbols separated by commas. ${symbolCount}/${WATCHLIST_CONSTRAINTS.MAX_SYMBOLS_PER_WATCHLIST} symbols`
                }
                fullWidth
                disabled={isSubmitting}
                multiline
                rows={3}
                inputProps={{
                  style: { textTransform: 'uppercase' },
                }}
              />

              {/* Symbol Preview */}
              {symbolCount > 0 && (
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: 'background.default',
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Current symbols ({symbolCount}):
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {parseSymbols(formData.symbols).join(', ')}
                  </Typography>
                </Box>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
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
                  {isSubmitting ? 'Updating...' : 'Update Watchlist'}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>

        {/* Help Text */}
        <Box sx={{ mt: 3, p: 3, backgroundColor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Editing Watchlists:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can change the watchlist name and add or remove stock symbols. Stock symbols should
            be 1-5 letters (e.g., AAPL, GOOGL, BRK.A). Any invalid symbols will be automatically
            filtered out.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};
