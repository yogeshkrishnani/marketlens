import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Typography, Paper, Grid, CircularProgress, Fade } from '@mui/material';
import { useState, useEffect, useRef } from 'react';

import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useGetSectorPerformanceQuery } from '@/services/api/financialApi';
import { financialColors } from '@/theme';

export const SectorPerformance = () => {
  const { data: sectors, isLoading, error, refetch } = useGetSectorPerformanceQuery();
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [hasScrollContent, setHasScrollContent] = useState(false);
  const scrollBoxRef = useRef<HTMLDivElement>(null);

  // Check if content is scrollable and show indicator
  useEffect(() => {
    const checkScrollability = () => {
      if (scrollBoxRef.current) {
        const hasOverflow = scrollBoxRef.current.scrollHeight > scrollBoxRef.current.clientHeight;
        setHasScrollContent(hasOverflow);

        if (hasOverflow) {
          // Show scroll indicator after data loads
          setShowScrollIndicator(true);

          // Hide indicator after delay or when scrolled
          const timer = setTimeout(() => {
            setShowScrollIndicator(false);
          }, 3000);

          return () => clearTimeout(timer);
        }
      }
    };

    // Check after data loads
    if (sectors && !isLoading) {
      checkScrollability();
    }
  }, [sectors, isLoading]);

  // Add scroll event listener to hide indicator when user scrolls
  useEffect(() => {
    const scrollBox = scrollBoxRef.current;

    const handleScroll = () => {
      setShowScrollIndicator(false);
    };

    if (scrollBox) {
      scrollBox.addEventListener('scroll', handleScroll);
      return () => scrollBox.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Helper function to get color based on performance with intensity scaling
  const getHeatMapColor = (performance: number) => {
    // Define max performance for color intensity scaling
    const maxPerformance = 2.0; // Adjust based on typical range

    // Calculate intensity (0-1) capped at maxPerformance
    const intensity = Math.min(Math.abs(performance) / maxPerformance, 1);

    if (performance > 0) {
      // Positive: scale from light green to deep green
      const r = Math.round(233 - intensity * 148); // 233 -> 85
      const g = Math.round(250 - intensity * 70); // 250 -> 180
      const b = Math.round(233 - intensity * 148); // 233 -> 85
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Negative: scale from light red to deep red
      const r = Math.round(250 - intensity * 30); // 250 -> 220
      const g = Math.round(233 - intensity * 163); // 233 -> 70
      const b = Math.round(233 - intensity * 163); // 233 -> 70
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  return (
    <Paper
      sx={{
        overflow: 'hidden',
        height: '380px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative', // Add position relative for scroll indicator
      }}
    >
      <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600}>
          Sector Performance
        </Typography>
      </Box>

      <Box
        ref={scrollBoxRef}
        sx={{
          p: 2,
          overflow: 'auto',
          flexGrow: 1,
          // Show partial tiles to indicate scrollability
          maxHeight: '326px',
        }}
      >
        {isLoading ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 1 }}>
            <ErrorMessage
              message="Unable to load sector performance data. Please try again later."
              onRetry={refetch}
            />
          </Box>
        ) : sectors && sectors.length > 0 ? (
          <Grid container spacing={1.5}>
            {/* Sort sectors by performance (descending) */}
            {[...sectors]
              .sort((a, b) => b.performance - a.performance)
              .map(sector => (
                <Grid item xs={4} sm={4} md={4} key={sector.name}>
                  <Box
                    sx={{
                      p: 2,
                      height: '100%',
                      backgroundColor: getHeatMapColor(sector.performance),
                      borderRadius: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2,
                      },
                    }}
                  >
                    {/* Sector Name */}
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mb: 2,
                        color: 'text.primary',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={sector.name}
                    >
                      {sector.name}
                    </Typography>

                    {/* Performance Value with Icon */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
                      {sector.performance >= 0 ? (
                        <TrendingUpIcon
                          fontSize="small"
                          sx={{
                            color: financialColors.positive,
                            mr: 0.5,
                            fontSize: '1.1rem',
                          }}
                        />
                      ) : (
                        <TrendingDownIcon
                          fontSize="small"
                          sx={{
                            color: financialColors.negative,
                            mr: 0.5,
                            fontSize: '1.1rem',
                          }}
                        />
                      )}
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color:
                            sector.performance >= 0
                              ? financialColors.positive
                              : financialColors.negative,
                        }}
                      >
                        {sector.performance >= 0 ? '+' : ''}
                        {sector.performance.toFixed(2)}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
          </Grid>
        ) : (
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography color="text.secondary">No sector performance data available.</Typography>
          </Box>
        )}
      </Box>

      {/* Subtle bouncing scroll indicator */}
      <Fade in={showScrollIndicator && hasScrollContent} timeout={500}>
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none', // Prevents the indicator from blocking clicks
            animation: showScrollIndicator ? 'bounce 1.5s ease infinite' : 'none',
            '@keyframes bounce': {
              '0%, 20%, 50%, 80%, 100%': {
                transform: 'translateX(-50%) translateY(0)',
              },
              '40%': {
                transform: 'translateX(-50%) translateY(-6px)',
              },
              '60%': {
                transform: 'translateX(-50%) translateY(-3px)',
              },
            },
          }}
        >
          <KeyboardArrowDownIcon
            sx={{
              fontSize: '1.5rem',
              color: 'primary.main', // Use theme primary color
              padding: '2px',
              borderRadius: '50%',
              backgroundColor: theme =>
                theme.palette.mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(18,18,18,0.8)',
              boxShadow: 2, // Increased shadow for better visibility
            }}
          />
        </Box>
      </Fade>
    </Paper>
  );
};
