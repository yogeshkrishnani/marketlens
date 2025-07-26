// src/features/watchlist/components/WatchListCard.tsx

import {
  MoreVert as MoreVertIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Box,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Watchlist, WatchlistWithMarketData } from '../models';

import { financialColors } from '@/theme';

// Component props interface
interface WatchlistCardProps {
  readonly watchlist: Watchlist | WatchlistWithMarketData;
  readonly onEdit?: (watchlist: Watchlist) => void;
  readonly onDelete?: (watchlistId: string) => void;
  readonly showMarketData?: boolean;
}

// Type guard to check if watchlist has market data
const hasMarketData = (
  watchlist: Watchlist | WatchlistWithMarketData
): watchlist is WatchlistWithMarketData => {
  return 'watchlistItems' in watchlist;
};

export const WatchlistCard: React.FC<WatchlistCardProps> = React.memo(
  ({ watchlist, onEdit, onDelete, showMarketData = false }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const navigate = useNavigate();

    const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    }, []);

    const handleMenuClose = useCallback(() => {
      setAnchorEl(null);
    }, []);

    const handleEdit = useCallback(() => {
      if (onEdit) {
        onEdit(watchlist);
      }
      handleMenuClose();
    }, [onEdit, watchlist, handleMenuClose]);

    const handleDelete = useCallback(() => {
      if (onDelete) {
        onDelete(watchlist.id);
      }
      handleMenuClose();
    }, [onDelete, watchlist.id, handleMenuClose]);

    const handleViewWatchlist = useCallback(() => {
      navigate(`/watchlists/${watchlist.id}`);
    }, [navigate, watchlist.id]);

    const formatDate = useCallback((date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    }, []);

    // Calculate summary statistics for display
    const getSummaryStats = useCallback(() => {
      if (!showMarketData || !hasMarketData(watchlist) || !watchlist.watchlistItems) {
        return null;
      }

      const items = watchlist.watchlistItems;
      if (items.length === 0) {
        return null;
      }

      const gainers = items.filter(item => item.change >= 0);
      const losers = items.filter(item => item.change < 0);
      const avgChange = items.reduce((sum, item) => sum + item.changePercent, 0) / items.length;

      // Find top performer
      const topPerformer = items.reduce((top, item) =>
        item.changePercent > top.changePercent ? item : top
      );

      // Find worst performer
      const worstPerformer = items.reduce((worst, item) =>
        item.changePercent < worst.changePercent ? item : worst
      );

      return {
        gainers: gainers.length,
        losers: losers.length,
        avgChange,
        topPerformer:
          topPerformer.changePercent !== worstPerformer.changePercent ? topPerformer : null,
        worstPerformer:
          topPerformer.changePercent !== worstPerformer.changePercent ? worstPerformer : null,
      };
    }, [showMarketData, watchlist]);

    const summaryStats = getSummaryStats();

    return (
      <Paper
        sx={{
          height: '300px',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4,
          },
        }}
        onClick={handleViewWatchlist}
      >
        <CardContent
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 3, // Consistent padding
          }}
        >
          {/* Header with title and menu */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2, // Reduced from 3
            }}
          >
            {/* Title and description */}
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
                title={watchlist.name}
              >
                {watchlist.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {watchlist.symbols.length} {watchlist.symbols.length === 1 ? 'stock' : 'stocks'}
                {watchlist.symbols.length > 0 && ` • Created ${formatDate(watchlist.createdAt)}`}
              </Typography>
            </Box>

            {/* Menu button */}
            <IconButton size="small" onClick={handleMenuOpen} sx={{ ml: 1 }}>
              <MoreVertIcon fontSize="small" />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={e => e.stopPropagation()}
            >
              <MenuItem onClick={handleViewWatchlist}>
                <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
                View Details
              </MenuItem>
              {onEdit && <MenuItem onClick={handleEdit}>Edit Watchlist</MenuItem>}
              {onDelete && (
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                  Delete Watchlist
                </MenuItem>
              )}
            </Menu>
          </Box>

          {/* Market Data Summary - More Space for What Matters */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {summaryStats ? (
              <>
                {/* Performance Chips */}
                <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                  <Chip
                    icon={<TrendingUpIcon />}
                    label={`${summaryStats.gainers} up`}
                    size="small"
                    variant="outlined"
                    sx={{
                      color: financialColors.positive,
                      borderColor: financialColors.positive,
                      '& .MuiChip-icon': {
                        color: financialColors.positive,
                      },
                    }}
                  />
                  <Chip
                    icon={<TrendingDownIcon />}
                    label={`${summaryStats.losers} down`}
                    size="small"
                    variant="outlined"
                    sx={{
                      color: financialColors.negative,
                      borderColor: financialColors.negative,
                      '& .MuiChip-icon': {
                        color: financialColors.negative,
                      },
                    }}
                  />
                </Stack>

                {/* Average Performance - Clean & Readable */}
                <Box sx={{ my: 2, textAlign: 'left' }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    Average Performance
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                      color:
                        summaryStats.avgChange >= 0
                          ? financialColors.positive
                          : financialColors.negative,
                      lineHeight: 1,
                    }}
                  >
                    {summaryStats.avgChange >= 0 ? '+' : ''}
                    {summaryStats.avgChange.toFixed(2)}%
                  </Typography>
                </Box>

                {/* Top/Worst Performers - Better Typography & Layout */}
                {summaryStats.topPerformer && summaryStats.worstPerformer && (
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: '0.75rem', mb: 0.25 }}
                        >
                          Top Performer
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{
                            color:
                              summaryStats.topPerformer.changePercent >= 0
                                ? financialColors.positive
                                : 'text.primary',
                            lineHeight: 1.2,
                          }}
                        >
                          {summaryStats.topPerformer.symbol}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              summaryStats.topPerformer.changePercent >= 0
                                ? financialColors.positive
                                : 'text.primary',
                            fontSize: '0.8rem',
                            lineHeight: 1.2,
                          }}
                        >
                          {summaryStats.topPerformer.changePercent >= 0 ? '+' : ''}
                          {summaryStats.topPerformer.changePercent.toFixed(1)}%
                        </Typography>
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: '0.75rem', mb: 0.25 }}
                        >
                          Worst Performer
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{
                            color:
                              summaryStats.worstPerformer.changePercent < 0
                                ? financialColors.negative
                                : 'text.primary',
                            lineHeight: 1.2,
                          }}
                        >
                          {summaryStats.worstPerformer.symbol}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              summaryStats.worstPerformer.changePercent < 0
                                ? financialColors.negative
                                : 'text.primary',
                            fontSize: '0.8rem',
                            lineHeight: 1.2,
                          }}
                        >
                          {summaryStats.worstPerformer.changePercent >= 0 ? '+' : ''}
                          {summaryStats.worstPerformer.changePercent.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}
              </>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {watchlist.symbols.length === 0
                    ? 'No stocks added yet'
                    : 'Loading market data...'}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Empty State for Zero Stocks */}
          {watchlist.symbols.length === 0 && (
            <Box sx={{ mt: 'auto', textAlign: 'center', py: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Click to add symbols
              </Typography>
            </Box>
          )}
        </CardContent>
      </Paper>
    );
  }
);
