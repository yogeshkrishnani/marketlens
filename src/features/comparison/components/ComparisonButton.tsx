import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { Badge, Button, Tooltip } from '@mui/material';
import React from 'react';

import { useComparison } from '../context/ComparisonContext';

interface ComparisonButtonProps {
  symbol: string;
  name: string;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
}

export const ComparisonButton: React.FC<ComparisonButtonProps> = ({
  symbol,
  name,
  variant = 'outlined',
  size = 'medium',
}) => {
  const { addToComparison, removeFromComparison, isInComparison, comparisonList } = useComparison();

  const inComparison = isInComparison(symbol);

  const handleClick = () => {
    if (inComparison) {
      removeFromComparison(symbol);
    } else {
      addToComparison({ symbol, name });
    }
  };

  // Button is disabled if we're at max capacity and trying to add a new stock
  const isDisabled = !inComparison && comparisonList.length >= 4;

  // Tooltip message based on state
  const getTooltipMessage = () => {
    if (inComparison) {
      return `Remove ${symbol} from comparison`;
    }
    if (isDisabled) {
      return 'Maximum of 4 stocks can be compared. Remove a stock first.';
    }
    return `Add ${symbol} to comparison`;
  };

  return (
    <Tooltip title={getTooltipMessage()}>
      <span>
        {' '}
        {/* Wrapper needed for disabled tooltips */}
        <Badge color="primary" variant="dot" invisible={!inComparison}>
          <Button
            variant={inComparison ? 'contained' : variant}
            size={size}
            startIcon={<CompareArrowsIcon />}
            onClick={handleClick}
            disabled={isDisabled}
            color={inComparison ? 'primary' : 'inherit'}
          >
            Compare
          </Button>
        </Badge>
      </span>
    </Tooltip>
  );
};
