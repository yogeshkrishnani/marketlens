import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  IconButton,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useRecentlyViewedStocks } from '@/hooks/useRecentlyViewedStocks';

export const RecentlyViewedStocks: React.FC = () => {
  const navigate = useNavigate();
  const { recentlyViewed, removeViewedStock } = useRecentlyViewedStocks();

  // If no recently viewed stocks, show placeholder
  if (recentlyViewed.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography color="text.secondary">
          Stocks you view will appear here for quick access.
        </Typography>
      </Box>
    );
  }

  // Format timestamp to a readable format
  const formatTimestamp = (timestamp: number): string => {
    const now = new Date();
    const viewedDate = new Date(timestamp);

    // If viewed today
    if (viewedDate.toDateString() === now.toDateString()) {
      return 'Today';
    }

    // If viewed yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (viewedDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    // Otherwise show date
    return viewedDate.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Grid container spacing={2}>
      {recentlyViewed.map(stock => (
        <Grid item xs={6} sm={4} md={3} key={stock.symbol}>
          <Card
            sx={{
              transition: 'transform 0.2s',
              position: 'relative',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3,
              },
            }}
          >
            {/* Close button in top-right corner */}
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                removeViewedStock(stock.symbol);
              }}
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                p: 0.5,
                zIndex: 10,
                color: 'text.secondary',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: 'text.primary',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>

            <CardActionArea onClick={() => navigate(`/stocks/${stock.symbol}`)}>
              <CardContent sx={{ p: 1.5, pb: '12px !important' }}>
                {/* Symbol */}
                <Typography variant="h6" component="div" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                  {stock.symbol}
                </Typography>

                {/* Company Name - truncated if needed */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {stock.name}
                </Typography>

                {/* Timestamp at the bottom */}
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: 'block',
                    textAlign: 'right',
                    mt: 0.5,
                    fontSize: '0.7rem',
                  }}
                >
                  Viewed {formatTimestamp(stock.timestamp)}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
