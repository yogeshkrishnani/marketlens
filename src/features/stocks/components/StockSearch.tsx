// src/features/stocks/components/StockSearch.tsx

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SearchIcon from '@mui/icons-material/Search';
import {
  Autocomplete,
  TextField,
  InputAdornment,
  CircularProgress,
  Box,
  Typography,
  Avatar,
  Tooltip,
  Alert,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { StockSearchResult } from '../models';

import { useDebounce } from '@/hooks/useDebounce';
import { useSearchStocksQuery } from '@/services/api/financialApi';

interface StockSearchProps {
  placeholder?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
}

export const StockSearch: React.FC<StockSearchProps> = ({
  placeholder = 'Search for stocks...',
  fullWidth = true,
  size = 'medium',
  variant = 'outlined',
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);

  // Debounce search input to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(inputValue, 300);

  // Use the RTK Query hook to fetch search results
  const {
    data: searchResults,
    isFetching,
    isError,
    error,
  } = useSearchStocksQuery(debouncedSearchTerm, {
    // Skip the query if the search term is too short
    skip: debouncedSearchTerm.length < 2,
  });

  // Store processed search results that clear when input is empty
  const [processedResults, setProcessedResults] = useState<StockSearchResult[]>([]);

  // Update processed results when API results change or input changes
  useEffect(() => {
    // If input is empty, clear results
    if (inputValue.trim() === '') {
      setProcessedResults([]);
    }

    // If we have a new search term that doesn't match the debounced term yet,
    // clear the results until we get fresh data
    else if (debouncedSearchTerm !== inputValue.trim()) {
      setProcessedResults([]);
    }

    // Only update results if they match the current search term
    else if (searchResults && debouncedSearchTerm === inputValue.trim()) {
      setProcessedResults(searchResults);
    }
  }, [searchResults, inputValue, debouncedSearchTerm]);

  // Handle selection of a stock
  const handleStockSelection = (_: React.SyntheticEvent, stock: StockSearchResult | null) => {
    if (stock) {
      setSelectedStock(stock);
      console.log('Selected stock:', stock); // Add console log for debugging
      navigate(`/stocks/${stock.symbol}`);
    }
  };

  // Error message for API failures
  const getErrorMessage = () => {
    if (isError && error) {
      // Type guards for different error types
      if (typeof error === 'object' && error !== null) {
        if ('status' in error) {
          // It's a FetchBaseQueryError
          return `Error ${error.status}: Please try again later.`;
        } else if ('message' in error) {
          // It has a message property
          return (error as any).message;
        }
      }
      return 'Failed to search for stocks. Please try again.';
    }
    return null;
  };

  // Get helper text for the search input
  const getHelperText = () => {
    if (isError) {
      return getErrorMessage();
    }

    if (debouncedSearchTerm.length === 1) {
      return 'Enter at least 2 characters to search';
    }

    return '';
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Autocomplete
        id="stock-search-autocomplete"
        open={open && inputValue.length >= 2}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        onChange={handleStockSelection}
        isOptionEqualToValue={(option, value) => option.symbol === value.symbol}
        getOptionLabel={option => option.symbol}
        options={processedResults}
        loading={isFetching}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => {
          setInputValue(newInputValue);
        }}
        fullWidth={fullWidth}
        filterOptions={x => x} // Disable client-side filtering, let the API handle it
        noOptionsText={inputValue.length >= 2 ? 'No stocks found matching your search' : ''}
        renderInput={params => (
          <TextField
            {...params}
            label={placeholder}
            variant={variant}
            size={size}
            error={isError}
            helperText={getHelperText()}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color={isError ? 'error' : 'action'} />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {isFetching ? <CircularProgress color="inherit" size={20} /> : null}
                  {isError && (
                    <Tooltip title={getErrorMessage() || 'Error searching for stocks'}>
                      <ErrorOutlineIcon color="error" />
                    </Tooltip>
                  )}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} key={option.symbol}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: '0.8rem',
                  mr: 1,
                  bgcolor: 'primary.main',
                }}
              >
                {option.symbol.charAt(0)}
              </Avatar>
              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Typography variant="body2" fontWeight={500} noWrap>
                  {option.symbol}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ display: 'block' }}
                >
                  {option.name}
                </Typography>
              </Box>
              {option.exchange && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {option.exchange}
                </Typography>
              )}
            </Box>
          </li>
        )}
      />

      {/* Display error alert only for serious errors */}
      {isError && error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {getErrorMessage()}
        </Alert>
      )}
    </Box>
  );
};
