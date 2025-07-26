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

import {
  CreateWatchlistData,
  CreateWatchlistFormData,
  CreateWatchlistFormErrors,
  isValidSymbol,
  isValidWatchlistName,
  WATCHLIST_CONSTRAINTS,
} from '../models';
import { canUserCreateWatchlist, createWatchlist } from '../services/watchlistService';

import { useAuth } from '@/features/auth/context/AuthContext';

// Component props interface
interface CreateWatchlistFormProps {
  readonly onSuccess?: (watchlistId: string) => void;
  readonly onCancel?: () => void;
}

export const CreateWatchlistForm: React.FC<CreateWatchlistFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Form state
  const [formData, setFormData] = useState<CreateWatchlistFormData>({
    name: '',
    initialSymbols: '',
  });

  const [formErrors, setFormErrors] = useState<CreateWatchlistFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate form data
  const validateForm = useCallback((data: CreateWatchlistFormData): CreateWatchlistFormErrors => {
    const errors: CreateWatchlistFormErrors = {};

    // Name validation
    if (!data.name.trim()) {
      errors.name = 'Watchlist name is required';
    } else if (!isValidWatchlistName(data.name.trim())) {
      errors.name = `Name must be between ${WATCHLIST_CONSTRAINTS.MIN_NAME_LENGTH} and ${WATCHLIST_CONSTRAINTS.MAX_NAME_LENGTH} characters`;
    }

    // Symbols validation (optional)
    if (data.initialSymbols.trim()) {
      const symbols = data.initialSymbols
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0);

      if (symbols.length > WATCHLIST_CONSTRAINTS.MAX_SYMBOLS_PER_WATCHLIST) {
        errors.initialSymbols = `Maximum ${WATCHLIST_CONSTRAINTS.MAX_SYMBOLS_PER_WATCHLIST} symbols allowed`;
      }

      // Validate each symbol format
      const invalidSymbols = symbols.filter(symbol => !isValidSymbol(symbol));
      if (invalidSymbols.length > 0) {
        errors.initialSymbols = `Invalid symbols: ${invalidSymbols.join(', ')}. Use 1-5 letters only.`;
      }

      // Check for duplicates
      const uniqueSymbols = new Set(symbols);
      if (uniqueSymbols.size !== symbols.length) {
        errors.initialSymbols = 'Duplicate symbols are not allowed';
      }
    }

    return errors;
  }, []);

  // Parse symbols from input string
  const parseSymbols = useCallback((symbolsString: string): string[] => {
    if (!symbolsString.trim()) return [];

    return symbolsString
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0 && isValidSymbol(s))
      .filter((symbol, index, array) => array.indexOf(symbol) === index); // Remove duplicates
  }, []);

  // Handle input changes
  const handleInputChange = useCallback(
    (field: keyof CreateWatchlistFormData) => {
      return (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = event.target.value;

        // Special handling for symbols field
        if (field === 'initialSymbols') {
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

      if (!currentUser?.uid) {
        setError('You must be logged in to create a watchlist');
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
        // Check if user can create more watchlists
        const canCreate = await canUserCreateWatchlist(currentUser.uid);
        if (!canCreate) {
          throw new Error(
            `Maximum ${WATCHLIST_CONSTRAINTS.MAX_WATCHLISTS_PER_USER} watchlists allowed per user`
          );
        }

        // Parse symbols
        const symbols = parseSymbols(formData.initialSymbols);

        // Create watchlist data
        const watchlistData: CreateWatchlistData = {
          name: formData.name.trim(),
          symbols: symbols.length > 0 ? symbols : undefined,
        };

        // Create watchlist
        const newWatchlist = await createWatchlist(currentUser.uid, watchlistData);

        // Success - call onSuccess or navigate
        if (onSuccess) {
          onSuccess(newWatchlist.id);
        } else {
          navigate(`/watchlists/${newWatchlist.id}`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create watchlist';
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser?.uid, validateForm, formData, parseSymbols, onSuccess, navigate]
  );

  // Handle cancel action
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/watchlists');
    }
  }, [onCancel, navigate]);

  // Check if form has changes
  const hasChanges = formData.name.trim() || formData.initialSymbols.trim();

  // Get symbol count for display
  const symbolCount = parseSymbols(formData.initialSymbols).length;

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
            Create New Watchlist
          </Typography>
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

              {/* Initial Symbols */}
              <TextField
                label="Initial Stocks (Optional)"
                placeholder="e.g., AAPL, GOOGL, MSFT"
                value={formData.initialSymbols}
                onChange={handleInputChange('initialSymbols')}
                error={Boolean(formErrors.initialSymbols)}
                helperText={
                  formErrors.initialSymbols ||
                  `Enter stock symbols separated by commas. ${symbolCount}/${WATCHLIST_CONSTRAINTS.MAX_SYMBOLS_PER_WATCHLIST} symbols`
                }
                fullWidth
                disabled={isSubmitting}
                multiline
                rows={2}
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
                    Symbols to add ({symbolCount}):
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {parseSymbols(formData.initialSymbols).join(', ')}
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
                  {isSubmitting ? 'Creating...' : 'Create Watchlist'}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>

        {/* Help Text */}
        <Box sx={{ mt: 3, p: 3, backgroundColor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Creating Watchlists:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Watchlists help you track stocks you're interested in without purchasing them. You can
            add up to {WATCHLIST_CONSTRAINTS.MAX_SYMBOLS_PER_WATCHLIST} stocks per watchlist and
            create up to {WATCHLIST_CONSTRAINTS.MAX_WATCHLISTS_PER_USER} watchlists total. Stock
            symbols should be 1-5 letters (e.g., AAPL, GOOGL, BRK.A).
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};
