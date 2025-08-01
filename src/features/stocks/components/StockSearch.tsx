import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  CircularProgress,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
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

  const debouncedSearchTerm = useDebounce(inputValue, 300);

  const {
    data: searchResults,
    isFetching,
    isError,
    error,
  } = useSearchStocksQuery(debouncedSearchTerm, {
    skip: debouncedSearchTerm.length < 2,
  });

  const [processedResults, setProcessedResults] = useState<StockSearchResult[]>([]);

  useEffect(() => {
    if (inputValue.trim() === '') {
      setProcessedResults([]);
    } else if (debouncedSearchTerm !== inputValue.trim()) {
      setProcessedResults([]);
    } else if (searchResults && debouncedSearchTerm === inputValue.trim()) {
      setProcessedResults(searchResults);
    }
  }, [searchResults, inputValue, debouncedSearchTerm]);

  const handleStockSelection = (_: React.SyntheticEvent, stock: StockSearchResult | null) => {
    if (stock) {
      console.log('Selected stock:', stock);
      navigate(`/stocks/${stock.symbol}`);
    }
  };

  const getErrorMessage = () => {
    if (isError && error) {
      if (typeof error === 'object' && error !== null) {
        if ('status' in error) {
          return `Error ${error.status}: Please try again later.`;
        } else if ('message' in error) {
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
