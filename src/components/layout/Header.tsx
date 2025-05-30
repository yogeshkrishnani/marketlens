// src/components/layout/Header.tsx

import { toggleTheme } from '@features/theme/themeSlice';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AuthStatus } from '@/features/auth/components/AuthStatus'; // Import the AuthStatus component
import { useAuth } from '@/features/auth/context/AuthContext';
import { useAppDispatch, useAppSelector } from '@/hooks';

// Navigation items - updated to conditionally require auth
const navItems = [
  { label: 'Market Overview', path: '/', requiresAuth: false },
  { label: 'Stocks', path: '/stocks', requiresAuth: false },
  { label: 'Comparison', path: '/comparison', requiresAuth: false },
  { label: 'Portfolio', path: '/portfolio', requiresAuth: true },
  { label: 'Watchlists', path: '/watchlists', requiresAuth: true },
];

export const Header = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = useAppSelector(state => state.theme);
  const { currentUser } = useAuth(); // Get auth state from context

  // Mobile menu state
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Handle mobile menu open/close
  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    navigate(path);
    handleMobileMenuClose();
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  // Filter nav items based on auth status
  const filteredNavItems = navItems.filter(
    item => !item.requiresAuth || (item.requiresAuth && currentUser)
  );

  // Render navigation items
  const renderNavItems = useCallback(() => {
    return filteredNavItems.map(item => {
      const isActive =
        location.pathname === item.path ||
        (item.path === '/stocks' && location.pathname.startsWith('/stocks/'));
      return (
        <Button
          key={item.path}
          onClick={() => handleNavigation(item.path)}
          color={isActive ? 'primary' : 'inherit'}
          sx={{
            fontWeight: isActive ? 600 : 400,
            borderRadius: 0,
            mx: 0.5,
            px: 1.5,
            py: 2.3,
            '&:hover': {
              backgroundColor: 'transparent',
              color: 'primary.main',
            },
          }}
        >
          {item.label}
        </Button>
      );
    });
  }, [handleNavigation, location.pathname, filteredNavItems]);

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar sx={{ height: 64 }}>
        {/* Logo Only */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            py: 1, // Add padding to give logo more space
          }}
          onClick={() => handleNavigation('/')}
        >
          <img src="/logo.svg" alt="MarketLens Logo" style={{ height: '42px', width: '42px' }} />
        </Box>

        {/* Spacer to push navigation to right */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Desktop Navigation - now on the right */}
        {!isMobile && <Box sx={{ display: 'flex' }}>{renderNavItems()}</Box>}

        {/* Vertical Divider */}
        {!isMobile && <Divider orientation="vertical" flexItem sx={{ mx: 2, my: 1.5 }} />}

        {/* Theme Toggle */}
        <IconButton color="inherit" onClick={handleThemeToggle} sx={{ ml: 1 }} size="small">
          {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </IconButton>

        {/* AuthStatus - Replace User Account button */}
        <Box sx={{ ml: 2 }}>
          <AuthStatus />
        </Box>

        {/* Mobile Menu Icon */}
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="menu"
            edge="start"
            onClick={handleMobileMenuOpen}
            sx={{ ml: 1 }}
            size="small"
          >
            <MenuIcon fontSize="small" />
          </IconButton>
        )}

        {/* Mobile Menu */}
        <Menu
          anchorEl={mobileMenuAnchor}
          open={Boolean(mobileMenuAnchor)}
          onClose={handleMobileMenuClose}
          PaperProps={{
            elevation: 2,
            sx: {
              minWidth: 180,
              mt: 1,
            },
          }}
        >
          {filteredNavItems.map(item => (
            <MenuItem
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                py: 1.5,
                fontSize: '0.9rem',
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
