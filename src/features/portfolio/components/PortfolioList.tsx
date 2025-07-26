import {
  Add as AddIcon,
  FolderOpen as FolderOpenIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePortfolio } from '../context/PortfolioContext';
import { Portfolio } from '../models';

import { useAuth } from '@/features/auth/context/AuthContext';

// Portfolio card component
interface PortfolioCardProps {
  readonly portfolio: Portfolio;
  readonly onEdit: (portfolio: Portfolio) => void;
  readonly onDelete: (portfolioId: string) => void;
}

const PortfolioCard: React.FC<PortfolioCardProps> = React.memo(
  ({ portfolio, onEdit, onDelete }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const navigate = useNavigate();

    const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    }, []);

    const handleMenuClose = useCallback(() => {
      setAnchorEl(null);
    }, []);

    const handleEdit = useCallback(() => {
      onEdit(portfolio);
      handleMenuClose();
    }, [onEdit, portfolio, handleMenuClose]);

    const handleDelete = useCallback(() => {
      onDelete(portfolio.id);
      handleMenuClose();
    }, [onDelete, portfolio.id, handleMenuClose]);

    const handleViewPortfolio = useCallback(() => {
      navigate(`/portfolio/${portfolio.id}`);
    }, [navigate, portfolio.id]);

    const formatDate = useCallback((date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    }, []);

    return (
      <Paper
        sx={{
          p: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4,
          },
        }}
        onClick={handleViewPortfolio}
      >
        {/* Header with title and menu */}
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                pr: 1,
              }}
              title={portfolio.name}
            >
              {portfolio.name}
            </Typography>
            {portfolio.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {portfolio.description}
              </Typography>
            )}
          </Box>

          <IconButton
            size="small"
            onClick={e => {
              e.stopPropagation();
              handleMenuOpen(e);
            }}
            sx={{ ml: 1 }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={e => e.stopPropagation()}
          >
            <MenuItem onClick={handleEdit}>Edit Portfolio</MenuItem>
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              Delete Portfolio
            </MenuItem>
          </Menu>
        </Box>

        {/* Portfolio stats placeholder */}
        <Box sx={{ mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <TrendingUpIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
            <Chip
              label="Ready to add positions"
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
          </Box>

          <Typography variant="caption" color="text.secondary">
            Created {formatDate(portfolio.createdAt)}
          </Typography>
        </Box>
      </Paper>
    );
  }
);

// Main Portfolio List component
export const PortfolioList: React.FC = () => {
  const { currentUser } = useAuth();
  const { portfolios, isLoading, error, loadUserPortfolios, removePortfolio, clearError } =
    usePortfolio();
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load portfolios when component mounts
  useEffect(() => {
    if (currentUser?.uid) {
      loadUserPortfolios(currentUser.uid);
    }
  }, [currentUser?.uid, loadUserPortfolios]);

  // Handle portfolio creation
  const handleCreatePortfolio = useCallback(() => {
    navigate('/portfolio/create');
  }, [navigate]);

  // Handle portfolio edit
  const handleEditPortfolio = useCallback(
    (portfolio: Portfolio) => {
      navigate(`/portfolio/${portfolio.id}/edit`);
    },
    [navigate]
  );

  // Handle portfolio deletion
  const handleDeletePortfolio = useCallback(
    async (portfolioId: string) => {
      if (
        !window.confirm(
          'Are you sure you want to delete this portfolio? This action cannot be undone.'
        )
      ) {
        return;
      }

      setDeleteLoading(portfolioId);
      try {
        await removePortfolio(portfolioId);
      } catch (error) {
        console.error('Failed to delete portfolio:', error);
      } finally {
        setDeleteLoading(null);
      }
    },
    [removePortfolio]
  );

  // Show loading state
  if (isLoading && portfolios.length === 0) {
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
            My Portfolios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your investments and monitor performance across multiple portfolios
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreatePortfolio}
          sx={{ minWidth: 'fit-content' }}
        >
          Create Portfolio
        </Button>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Portfolio grid */}
      {portfolios.length > 0 ? (
        <Grid container spacing={3}>
          {portfolios.map(portfolio => (
            <Grid item xs={12} sm={6} md={4} key={portfolio.id}>
              <Box sx={{ position: 'relative' }}>
                <PortfolioCard
                  portfolio={portfolio}
                  onEdit={handleEditPortfolio}
                  onDelete={handleDeletePortfolio}
                />
                {deleteLoading === portfolio.id && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: 1,
                    }}
                  >
                    <CircularProgress size={24} />
                  </Box>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : (
        // Empty state
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundColor: theme => (theme.palette.mode === 'light' ? 'grey.50' : 'grey.900'),
          }}
        >
          <FolderOpenIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            No Portfolios Yet
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
          >
            Start building your investment portfolio by creating your first portfolio. Track stocks,
            monitor performance, and analyze your investments.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreatePortfolio}
            size="large"
          >
            Create Your First Portfolio
          </Button>
        </Paper>
      )}
    </Box>
  );
};
