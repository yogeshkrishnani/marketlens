import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
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

import { CreatePositionData } from '../models';
import { addPositionToPortfolio, getPortfolioById } from '../services/portfolioService';

import { useAuth } from '@/features/auth/context/AuthContext';
import { useGetStockQuoteQuery } from '@/services/api/financialApi';

// Form validation interface
interface FormErrors {
  symbol?: string;
  shares?: string;
  purchasePrice?: string;
  purchaseDate?: string;
  notes?: string;
}

// Form data interface
interface FormData {
  symbol: string;
  shares: string;
  purchasePrice: string;
  purchaseDate: string;
  notes: string;
}

// Component props interface
interface AddPositionFormProps {
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
}

// Format currency for display
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export const AddPositionForm: React.FC<AddPositionFormProps> = ({ onSuccess, onCancel }) => {
  const { id: portfolioId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    symbol: '',
    shares: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0], // Today's date
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolioName, setPortfolioName] = useState<string>('');
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);

  // Current price state - track which symbol to fetch
  const [priceSymbol, setPriceSymbol] = useState<string>('');

  // Use RTK Query to fetch stock quote
  const {
    data: stockQuote,
    isLoading: isFetchingPrice,
    error: priceError,
  } = useGetStockQuoteQuery(priceSymbol, {
    skip: !priceSymbol || priceSymbol.length < 1,
  });

  // Load portfolio info on mount
  useEffect(() => {
    const loadPortfolio = async () => {
      if (!portfolioId) {
        setError('Portfolio ID not provided');
        setIsLoadingPortfolio(false);
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
          setError('You do not have permission to add positions to this portfolio');
          return;
        }

        setPortfolioName(portfolio.name);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load portfolio';
        setError(errorMessage);
      } finally {
        setIsLoadingPortfolio(false);
      }
    };

    (async () => {
      await loadPortfolio();
    })();
  }, [portfolioId, currentUser?.uid]);

  // Handle get current price button click
  const handleGetCurrentPrice = useCallback(() => {
    if (formData.symbol.trim()) {
      setPriceSymbol(formData.symbol.trim().toUpperCase());
    }
  }, [formData.symbol]);

  // Check if current displayed quote matches the current symbol
  const isQuoteValid = stockQuote && priceSymbol && stockQuote.symbol === priceSymbol;

  // Handle use current price button click
  const handleUseCurrentPrice = useCallback(() => {
    if (isQuoteValid) {
      setFormData(prev => ({
        ...prev,
        purchasePrice: stockQuote.price.toFixed(2),
      }));

      // Clear purchase price error if it exists
      if (formErrors.purchasePrice) {
        setFormErrors(prev => ({
          ...prev,
          purchasePrice: undefined,
        }));
      }
    }
  }, [isQuoteValid, formErrors.purchasePrice, stockQuote?.price]);

  // Clear price data when symbol changes
  const clearPriceData = useCallback(() => {
    setPriceSymbol('');
  }, []);

  // Validate form data
  const validateForm = useCallback((data: FormData): FormErrors => {
    const errors: FormErrors = {};

    // Symbol validation
    if (!data.symbol.trim()) {
      errors.symbol = 'Stock symbol is required';
    } else if (!/^[A-Za-z]{1,5}$/.test(data.symbol.trim())) {
      errors.symbol = 'Please enter a valid stock symbol (1-5 letters)';
    }

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

        // Special handling for symbol field (uppercase)
        if (field === 'symbol') {
          value = value.toUpperCase().replace(/[^A-Z]/g, ''); // Only letters, uppercase
          // Clear current price when symbol changes
          clearPriceData();
        }

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
    [formErrors, error, clearPriceData]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!portfolioId) {
        setError('Portfolio ID not available');
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
        // Create position data
        const positionData: CreatePositionData = {
          symbol: formData.symbol.trim().toUpperCase(),
          shares: parseFloat(formData.shares),
          purchasePrice: parseFloat(formData.purchasePrice),
          purchaseDate: new Date(formData.purchaseDate),
          notes: formData.notes.trim() || undefined,
        };

        // Add position to portfolio
        await addPositionToPortfolio(portfolioId, positionData);

        // Success - navigate back to portfolio detail
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(`/portfolio/${portfolioId}`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add position';
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [portfolioId, validateForm, formData, onSuccess, navigate]
  );

  // Handle cancel action
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(`/portfolio/${portfolioId}`);
    }
  }, [onCancel, navigate, portfolioId]);

  // Check if form has changes
  const hasChanges =
    formData.symbol.trim() ||
    formData.shares.trim() ||
    formData.purchasePrice.trim() ||
    formData.notes.trim();

  // Get price error message for display
  const getPriceErrorMessage = useCallback(() => {
    if (!priceError) return null;

    if (typeof priceError === 'string') {
      return priceError;
    }

    // Handle RTK Query error format
    if ('data' in priceError && priceError.data) {
      return typeof priceError.data === 'string'
        ? priceError.data
        : `"${formData.symbol}" is not a valid stock symbol`;
    }

    if ('message' in priceError && priceError.message) {
      // Convert technical errors to user-friendly messages
      const message = priceError.message;
      if (
        message.includes('Invalid response format') ||
        message.includes('Invalid stock quote data')
      ) {
        return `"${formData.symbol}" is not a valid stock symbol. Please check the spelling and try again.`;
      }
      if (message.includes('Failed to fetch')) {
        return `Unable to connect to market data. Please check your internet connection and try again.`;
      }
      return message;
    }

    // Handle different error status codes
    if ('status' in priceError) {
      switch (priceError.status) {
        case 404:
          return `Stock symbol "${formData.symbol}" not found. Please verify the symbol is correct.`;
        case 429:
          return `Too many requests. Please wait a moment and try again.`;
        case 500:
        case 502:
        case 503:
          return `Market data service is temporarily unavailable. Please try again in a few moments.`;
        default:
          return `Unable to fetch price for "${formData.symbol}". Please verify the stock symbol and try again.`;
      }
    }

    // Default fallback
    return `"${formData.symbol}" appears to be an invalid stock symbol. Please check the spelling and try again.`;
  }, [priceError, formData.symbol]);

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
              Add Position
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Add a new stock position to "{portfolioName}"
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

              {/* Stock Symbol */}
              <Stack spacing={2}>
                <Box sx={{ position: 'relative' }}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="Stock Symbol"
                      placeholder="e.g., AAPL, GOOGL, MSFT"
                      value={formData.symbol}
                      onChange={handleInputChange('symbol')}
                      error={Boolean(formErrors.symbol)}
                      helperText={formErrors.symbol || 'Enter the ticker symbol of the stock'}
                      required
                      fullWidth
                      autoFocus
                      disabled={isSubmitting}
                      inputProps={{ maxLength: 5 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleGetCurrentPrice}
                      disabled={!formData.symbol.trim() || isFetchingPrice || isSubmitting}
                      startIcon={isFetchingPrice ? <CircularProgress size={16} /> : <RefreshIcon />}
                      sx={{
                        minWidth: 140,
                        flexShrink: 0,
                        alignSelf: 'flex-start',
                        mt: '16px', // Align with input field (accounting for label)
                        height: '56px', // Standard input height
                      }}
                    >
                      {isFetchingPrice ? 'Getting...' : 'Get Price'}
                    </Button>
                  </Stack>
                </Box>

                {/* Current Price Display */}
                {isQuoteValid && (
                  <Alert
                    severity="info"
                    sx={{
                      '& .MuiAlert-message': {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ width: '100%' }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Current Price: {formatCurrency(stockQuote.price)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {stockQuote.change >= 0 ? '+' : ''}$
                          {Math.abs(stockQuote.change).toFixed(2)} (
                          {stockQuote.changePercent >= 0 ? '+' : ''}
                          {stockQuote.changePercent.toFixed(2)}%)
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleUseCurrentPrice}
                        disabled={isSubmitting}
                      >
                        Use This Price
                      </Button>
                    </Stack>
                  </Alert>
                )}

                {/* Price Error Display */}
                {priceError && (
                  <Alert severity="warning" onClose={clearPriceData}>
                    {getPriceErrorMessage()}
                  </Alert>
                )}
              </Stack>

              {/* Shares and Purchase Price Row */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Number of Shares"
                  placeholder="e.g., 100"
                  value={formData.shares}
                  onChange={handleInputChange('shares')}
                  error={Boolean(formErrors.shares)}
                  helperText={formErrors.shares || 'How many shares did you buy?'}
                  required
                  fullWidth
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
                  {isSubmitting ? 'Adding Position...' : 'Add Position'}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Paper>

        {/* Help Text */}
        <Box sx={{ mt: 3, p: 3, backgroundColor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Adding Positions:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use the "Get Price" button to fetch the current market price for any stock symbol. This
            helps validate the symbol and gives you the latest price for reference. After adding
            this position, you'll be able to see real-time performance, track gains/losses, and
            monitor your portfolio's overall performance.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};
