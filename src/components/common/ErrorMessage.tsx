import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Typography, Button } from '@mui/material';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorMessage = ({
  message = 'An error occurred while fetching data.',
  onRetry,
}: ErrorMessageProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 3,
        height: '100%',
      }}
    >
      <ErrorOutlineIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
      <Typography color="error" gutterBottom>
        {message}
      </Typography>

      {onRetry && (
        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      )}
    </Box>
  );
};
