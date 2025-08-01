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
import { Formik, Form, Field } from 'formik';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as Yup from 'yup';

import { CreatePositionData } from '../models';
import { addPositionToPortfolio, getPortfolioById } from '../services/portfolioService';

import { useAuth } from '@/features/auth/context/AuthContext';
import { useGetStockQuoteQuery } from '@/services/api/financialApi';

interface AddPositionFormProps {
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
}

interface FormValues {
  symbol: string;
  shares: string;
  purchasePrice: string;
  purchaseDate: string;
  notes: string;
}

const validationSchema = Yup.object({
  symbol: Yup.string()
    .required('Stock symbol is required')
    .matches(/^[A-Za-z]{1,5}$/, 'Please enter a valid stock symbol (1-5 letters)'),
  shares: Yup.string()
    .required('Number of shares is required')
    .test('is-positive-number', 'Shares must be a positive number', value => {
      const shares = parseFloat(value);
      return !isNaN(shares) && shares > 0;
    })
    .test('max-shares', 'Shares cannot exceed 1,000,000', value => {
      const shares = parseFloat(value);
      return !isNaN(shares) && shares <= 1000000;
    }),
  purchasePrice: Yup.string()
    .required('Purchase price is required')
    .test('is-positive-number', 'Purchase price must be a positive number', value => {
      const price = parseFloat(value);
      return !isNaN(price) && price > 0;
    })
    .test('max-price', 'Purchase price cannot exceed $100,000', value => {
      const price = parseFloat(value);
      return !isNaN(price) && price <= 100000;
    }),
  purchaseDate: Yup.date()
    .required('Purchase date is required')
    .max(new Date(), 'Purchase date cannot be in the future')
    .test('not-too-old', 'Purchase date cannot be more than 50 years ago', value => {
      const fiftyYearsAgo = new Date();
      fiftyYearsAgo.setFullYear(fiftyYearsAgo.getFullYear() - 50);
      return value >= fiftyYearsAgo;
    }),
  notes: Yup.string(),
});

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

  const [error, setError] = useState<string | null>(null);
  const [portfolioName, setPortfolioName] = useState<string>('');
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [priceSymbol, setPriceSymbol] = useState<string>('');

  const {
    data: stockQuote,
    isLoading: isFetchingPrice,
    error: priceError,
  } = useGetStockQuoteQuery(priceSymbol, {
    skip: !priceSymbol || priceSymbol.length < 1,
  });

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

  const handleGetCurrentPrice = useCallback((symbol: string) => {
    if (symbol.trim()) {
      setPriceSymbol(symbol.trim().toUpperCase());
    }
  }, []);

  const isQuoteValid = stockQuote && priceSymbol && stockQuote.symbol === priceSymbol;

  const handleUseCurrentPrice = useCallback(
    (setFieldValue: (field: string, value: any) => void) => {
      if (isQuoteValid) {
        setFieldValue('purchasePrice', stockQuote.price.toFixed(2));
      }
    },
    [isQuoteValid, stockQuote?.price]
  );

  const clearPriceData = useCallback(() => {
    setPriceSymbol('');
  }, []);

  const handleSubmit = useCallback(
    async (values: FormValues, { setSubmitting }: any) => {
      if (!portfolioId || !currentUser?.uid) {
        setError('You must be logged in to add positions');
        setSubmitting(false);
        return;
      }

      try {
        const positionData: CreatePositionData = {
          symbol: values.symbol.trim().toUpperCase(),
          shares: parseFloat(values.shares),
          purchasePrice: parseFloat(values.purchasePrice),
          purchaseDate: new Date(values.purchaseDate),
          notes: values.notes.trim() || undefined,
        };

        await addPositionToPortfolio(portfolioId, positionData);

        if (onSuccess) {
          onSuccess();
        } else {
          navigate(`/portfolio/${portfolioId}`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add position';
        setError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
    [portfolioId, currentUser?.uid, onSuccess, navigate]
  );

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(`/portfolio/${portfolioId}`);
    }
  }, [onCancel, navigate, portfolioId]);

  const getPriceErrorMessage = useCallback(() => {
    if (!priceError) return null;

    if (typeof priceError === 'string') {
      return priceError;
    }

    if ('data' in priceError && priceError.data) {
      return typeof priceError.data === 'string'
        ? priceError.data
        : `"${priceSymbol}" is not a valid stock symbol`;
    }

    if ('message' in priceError && priceError.message) {
      const message = priceError.message;
      if (
        message.includes('Invalid response format') ||
        message.includes('Invalid stock quote data')
      ) {
        return `"${priceSymbol}" is not a valid stock symbol. Please check the spelling and try again.`;
      }
      if (message.includes('Failed to fetch')) {
        return `Unable to connect to market data. Please check your internet connection and try again.`;
      }
      return message;
    }

    if ('status' in priceError) {
      switch (priceError.status) {
        case 404:
          return `Stock symbol "${priceSymbol}" not found. Please verify the symbol is correct.`;
        case 429:
          return `Too many requests. Please wait a moment and try again.`;
        case 500:
        case 502:
        case 503:
          return `Market data service is temporarily unavailable. Please try again in a few moments.`;
        default:
          return `Unable to fetch price for "${priceSymbol}". Please verify the stock symbol and try again.`;
      }
    }

    return `"${priceSymbol}" appears to be an invalid stock symbol. Please check the spelling and try again.`;
  }, [priceError, priceSymbol]);

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

  const initialValues: FormValues = {
    symbol: '',
    shares: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
  };

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
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, isSubmitting, setFieldValue, errors, touched }) => (
              <Form>
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
                        <Field name="symbol">
                          {({ field }: any) => (
                            <TextField
                              {...field}
                              label="Stock Symbol"
                              placeholder="e.g., AAPL, GOOGL, MSFT"
                              error={touched.symbol && Boolean(errors.symbol)}
                              helperText={
                                touched.symbol && errors.symbol
                                  ? errors.symbol
                                  : 'Enter the ticker symbol of the stock'
                              }
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
                              onChange={e => {
                                const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                                field.onChange(e);
                                setFieldValue('symbol', value);
                                clearPriceData();
                              }}
                            />
                          )}
                        </Field>
                        <Button
                          variant="outlined"
                          onClick={() => handleGetCurrentPrice(values.symbol)}
                          disabled={!values.symbol.trim() || isFetchingPrice || isSubmitting}
                          startIcon={
                            isFetchingPrice ? <CircularProgress size={16} /> : <RefreshIcon />
                          }
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
                            onClick={() => handleUseCurrentPrice(setFieldValue)}
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
                    <Field name="shares">
                      {({ field }: any) => (
                        <TextField
                          {...field}
                          label="Number of Shares"
                          placeholder="e.g., 100"
                          error={touched.shares && Boolean(errors.shares)}
                          helperText={
                            touched.shares && errors.shares
                              ? errors.shares
                              : 'How many shares did you buy?'
                          }
                          required
                          fullWidth
                          disabled={isSubmitting}
                          inputProps={{ inputMode: 'decimal' }}
                          onChange={e => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            const parts = value.split('.');
                            const formattedValue =
                              parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value;
                            field.onChange(e);
                            setFieldValue('shares', formattedValue);
                          }}
                        />
                      )}
                    </Field>

                    <Field name="purchasePrice">
                      {({ field }: any) => (
                        <TextField
                          {...field}
                          label="Purchase Price"
                          placeholder="e.g., 150.00"
                          error={touched.purchasePrice && Boolean(errors.purchasePrice)}
                          helperText={
                            touched.purchasePrice && errors.purchasePrice
                              ? errors.purchasePrice
                              : 'Price per share in USD'
                          }
                          required
                          fullWidth
                          disabled={isSubmitting}
                          inputProps={{ inputMode: 'decimal' }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                          onChange={e => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            const parts = value.split('.');
                            const formattedValue =
                              parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value;
                            field.onChange(e);
                            setFieldValue('purchasePrice', formattedValue);
                          }}
                        />
                      )}
                    </Field>
                  </Stack>

                  {/* Purchase Date */}
                  <Field name="purchaseDate">
                    {({ field }: any) => (
                      <TextField
                        {...field}
                        label="Purchase Date"
                        type="date"
                        error={touched.purchaseDate && Boolean(errors.purchaseDate)}
                        helperText={
                          touched.purchaseDate && errors.purchaseDate
                            ? errors.purchaseDate
                            : 'When did you purchase this stock?'
                        }
                        required
                        fullWidth
                        disabled={isSubmitting}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    )}
                  </Field>

                  {/* Notes */}
                  <Field name="notes">
                    {({ field }: any) => (
                      <TextField
                        {...field}
                        label="Notes (Optional)"
                        placeholder="Investment thesis, strategy, or other notes..."
                        fullWidth
                        multiline
                        rows={3}
                        disabled={isSubmitting}
                        helperText="Optional: Add notes about your investment decision"
                        inputProps={{ maxLength: 500 }}
                      />
                    )}
                  </Field>

                  {/* Action Buttons */}
                  <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                    <Button variant="outlined" onClick={handleCancel} disabled={isSubmitting}>
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
                      disabled={isSubmitting}
                      sx={{ minWidth: 160 }}
                    >
                      {isSubmitting ? 'Adding Position...' : 'Add Position'}
                    </Button>
                  </Stack>
                </Stack>
              </Form>
            )}
          </Formik>
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
