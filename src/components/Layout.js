import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  Tooltip,
} from '@mui/material';
import Dashboard from '@mui/icons-material/Dashboard';
import Home from '@mui/icons-material/Home';
import PointOfSale from '@mui/icons-material/PointOfSale';
import Inventory from '@mui/icons-material/Inventory';
import People from '@mui/icons-material/People';
import AttachMoney from '@mui/icons-material/AttachMoney';
import Business from '@mui/icons-material/Business';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import Assessment from '@mui/icons-material/Assessment';
import Settings from '@mui/icons-material/Settings';
import Receipt from '@mui/icons-material/Receipt';
import ContentCut from '@mui/icons-material/ContentCut';
import Sync from '@mui/icons-material/Sync';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ExitToApp from '@mui/icons-material/ExitToApp';
import FiberManualRecord from '@mui/icons-material/FiberManualRecord';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOffline } from '../contexts/OfflineContext_simple';

const Layout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { pendingTransactions } = useOffline();

  const [anchorEl, setAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };

  const menuItems = [
    {
      text: 'Home',
      icon: <Home />,
      path: '/home',
      shortcut: 'Alt+M',
    },
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
      shortcut: 'Alt+H',
    },
    {
      text: 'Sales',
      icon: <PointOfSale />,
      path: '/sales',
      shortcut: 'Alt+P',
    },
    {
      text: 'Items',
      icon: <Inventory />,
      path: '/items',
      shortcut: 'Alt+I',
    },
    {
      text: 'Parties',
      icon: <People />,
      path: '/parties',
      shortcut: 'Alt+C',
    },
    {
      text: 'Warehouse',
      icon: <Business />,
      path: '/warehouse',
      shortcut: 'Alt+W',
    },
    {
      text: 'Purchase',
      icon: <ShoppingCart />,
      path: '/purchase',
      shortcut: 'Ctrl+P',
    },
    {
      text: 'General Expense',
      icon: <Receipt />,
      path: '/general-expense',
      shortcut: 'Alt+E',
    },
    {
      text: 'Cutting',
      icon: <ContentCut />,
      path: '/cutting',
      shortcut: 'Alt+X',
    },
    {
      text: 'Reports',
      icon: <Assessment />,
      path: '/reports',
      shortcut: 'Alt+R',
    },
    {
      text: 'Settings',
      icon: <Settings />,
      path: '/settings',
      shortcut: 'Alt+T',
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          px: { xs: 0.75, md: 1.5 },
          py: 0.55,
        }}
      >
        <Toolbar
          sx={{
            minHeight: 84,
            maxWidth: 1720,
            width: '100%',
            mx: 'auto',
          }}
        >
          {/* Logo */}
          <Box sx={{ minWidth: { xs: 140, md: 300 }, maxWidth: { xs: 160, md: 360 } }}>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                color: '#fffaf4',
                fontWeight: 900,
                lineHeight: 1.1,
                fontSize: { xs: '0.94rem', md: '1.22rem' },
              }}
            >
              EVAI TECHNOLOGIES PVT LTD
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,250,244,0.9)',
                fontWeight: 700,
                display: { xs: 'block', md: 'block' },
                fontSize: { xs: '0.72rem', md: '0.8rem' },
              }}
            >
              Ramesh Exports
            </Typography>
          </Box>

          {/* Navigation Items */}
          <Box
            sx={{
              display: 'flex',
              flexGrow: 1,
              gap: 0.5,
              alignItems: 'center',
              whiteSpace: 'nowrap',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              '&::-webkit-scrollbar': { display: 'none' },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              py: 0.5,
            }}
          >
            {menuItems.map((item) => (
              <Button
                key={item.text}
                type="button"
                variant={location.pathname === item.path ? "contained" : "text"}
                onClick={() => navigate(item.path)}
                sx={{
                  color: location.pathname === item.path ? '#241305' : '#fff9f1',
                  bgcolor: location.pathname === item.path ? '#ffe2bb' : 'transparent',
                  fontWeight: 800,
                  borderRadius: 999,
                  px: { xs: 1, md: 1.2 },
                  py: 0.9,
                  minWidth: 0,
                  height: 44,
                  flexShrink: 0,
                  border: location.pathname === item.path ? '1px solid #ffd2a3' : '1px solid transparent',
                  fontSize: { xs: '0.8rem', md: '0.92rem' },
                  '&:hover': {
                    bgcolor: location.pathname === item.path ? '#ffe8ca' : 'rgba(255,255,255,0.18)',
                  },
                  '& .MuiButton-startIcon': {
                    mr: { xs: 0.6, md: 0.8 },
                    '& svg': { fontSize: 20 },
                  },
                }}
                startIcon={item.icon}
              >
                {item.text}
              </Button>
            ))}
          </Box>

          {/* User Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1, mr: 0.2, flexShrink: 0 }}>
            <Tooltip title={pendingTransactions > 0 ? `${pendingTransactions} pending sync` : 'All synced'}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FiberManualRecord
                  sx={{
                    fontSize: 12,
                    color: pendingTransactions > 0 ? '#ffe082' : '#b8f5c8',
                  }}
                />
                <Sync sx={{ fontSize: 18, color: '#fff8ef' }} />
                <Typography variant="caption" sx={{ color: '#fff8ef', fontWeight: 700, display: { xs: 'none', md: 'inline' }, fontSize: '0.78rem' }}>
                  {pendingTransactions > 0 ? `Sync ${pendingTransactions}` : 'Synced'}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
            sx={{ color: '#fffaf4' }}
          >
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#ffe2c0', color: '#6a3608', border: '2px solid #fff2dd', fontWeight: 800 }}>
              {user?.full_name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          pt: { xs: 8.5, sm: 9.5, md: 10.5 }, // match AppBar height dynamically across viewports
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'transparent',
        }}
      >
        {children}
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            bgcolor: '#ffffff',
            border: '1px solid #f1c58f',
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem disabled sx={{ color: '#000000' }}>
          <Avatar sx={{ color: '#6a3608' }} /> {user?.full_name || 'User'}
        </MenuItem>
        <MenuItem disabled sx={{ color: '#000000' }}>
          <AccountCircle sx={{ mr: 1, color: '#ff9800' }} />
          {user?.username || 'username'}
        </MenuItem>
        <MenuItem disabled sx={{ color: '#000000' }}>
          <Business sx={{ mr: 1, color: '#ff9800' }} />
          {user?.branch_name || 'Main Branch'}
        </MenuItem>
        <Divider sx={{ bgcolor: '#ff9800' }} />
        <MenuItem onClick={() => navigate('/settings')} sx={{ color: '#000000' }}>
          <Settings sx={{ mr: 1, color: '#ff9800' }} />
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ color: '#000000' }}>
          <ExitToApp sx={{ mr: 1, color: '#ff9800' }} />
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout;
