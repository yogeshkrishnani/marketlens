import CloseIcon from '@mui/icons-material/Close';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  Fab,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useComparison } from '../context/ComparisonContext';

interface ComparisonDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const ComparisonDrawer: React.FC<ComparisonDrawerProps> = ({ open, onClose }) => {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const navigate = useNavigate();

  const handleCompare = () => {
    const symbols = comparisonList.map(stock => stock.symbol).join(',');
    navigate(`/comparison?symbols=${symbols}`);
    onClose();
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 300, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Stocks to Compare</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {comparisonList.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No stocks selected for comparison.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add stocks to compare by clicking the "Compare" button on any stock page.
            </Typography>
          </Box>
        ) : (
          <>
            <List>
              {comparisonList.map(stock => (
                <ListItem
                  key={stock.symbol}
                  sx={{
                    borderLeft: `4px solid ${stock.color}`,
                    pl: 2,
                    mb: 1,
                    borderRadius: 1,
                    backgroundColor: 'background.paper',
                  }}
                >
                  <ListItemText primary={stock.symbol} secondary={stock.name} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => removeFromComparison(stock.symbol)}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button variant="text" color="error" onClick={clearComparison} size="small">
                Clear All
              </Button>

              <Button
                variant="contained"
                color="primary"
                startIcon={<CompareArrowsIcon />}
                onClick={handleCompare}
                disabled={comparisonList.length < 2}
              >
                Compare ({comparisonList.length})
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export const ComparisonFab: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { comparisonList } = useComparison();

  if (comparisonList.length === 0) {
    return null;
  }

  return (
    <Tooltip title="View comparison list">
      <Fab
        color="primary"
        size="medium"
        onClick={onClick}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      >
        <Badge badgeContent={comparisonList.length} color="error">
          <CompareArrowsIcon />
        </Badge>
      </Fab>
    </Tooltip>
  );
};
