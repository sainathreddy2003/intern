import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  keyframes,
} from '@mui/material';
import Wifi from '@mui/icons-material/Wifi';
import WifiOff from '@mui/icons-material/WifiOff';
import Sync from '@mui/icons-material/Sync';
import SyncProblem from '@mui/icons-material/SyncProblem';
import Refresh from '@mui/icons-material/Refresh';
import Settings from '@mui/icons-material/Settings';
import { useOffline } from '../contexts/OfflineContext_simple';
import { format } from 'date-fns';

// Define spin animation
const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const OfflineIndicator = () => {
  const {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingTransactions,
    syncStatus,
    syncError,
    forceSync,
    clearSyncError,
  } = useOffline();

  const [menuAnchor, setMenuAnchor] = useState(null);

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleForceSync = async () => {
    handleMenuClose();
    await forceSync();
  };

  const handleClearError = () => {
    handleMenuClose();
    clearSyncError();
  };

  const getStatusColor = () => {
    if (syncError) return 'error';
    if (isSyncing) return 'warning';
    if (isOnline) return 'success';
    return 'default';
  };

  const getStatusIcon = () => {
    if (syncError) return <SyncProblem />;
    if (isSyncing) return <Sync />;
    if (isOnline) return <Wifi />;
    return <WifiOff />;
  };

  const getStatusText = () => {
    if (syncError) return 'Sync Error';
    if (isSyncing) return 'Syncing...';
    if (isOnline) return 'Online';
    return 'Offline';
  };

  return (
    <>
      {/* Main Indicator */}
      <Box
        sx={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
        }}
      >
        <Chip
          icon={getStatusIcon()}
          label={getStatusText()}
          color={getStatusColor()}
          variant={isOnline ? 'filled' : 'outlined'}
          onClick={handleMenuOpen}
          sx={{
            cursor: 'pointer',
            '& .MuiChip-icon': {
              animation: isSyncing ? `${spin} 1s linear infinite` : 'none',
            },
          }}
        />
      </Box>

      {/* Pending Transactions Badge */}
      {pendingTransactions > 0 && (
        <Badge
          badgeContent={pendingTransactions}
          color="warning"
          sx={{
            position: 'fixed',
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
          }}
        >
          <Chip
            label="Pending"
            size="small"
            color="warning"
            variant="outlined"
            onClick={handleMenuOpen}
            sx={{ cursor: 'pointer' }}
          />
        </Badge>
      )}

      {/* Status Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 280 },
        }}
      >
        {/* Connection Status */}
        <MenuItem disabled>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {isOnline ? <Wifi color="success" /> : <WifiOff color="error" />}
            <Typography sx={{ ml: 1 }}>
              {isOnline ? 'Connected to server' : 'Working offline'}
            </Typography>
          </Box>
        </MenuItem>

        {/* Sync Status */}
        <MenuItem disabled>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {isSyncing ? (
              <Sync sx={{ animation: `${spin} 1s linear infinite` }} />
            ) : (
              <Sync />
            )}
            <Typography sx={{ ml: 1 }}>
              {isSyncing ? 'Syncing...' : `Last sync: ${
                lastSyncTime 
                  ? format(new Date(lastSyncTime), 'p')
                  : 'Never'
              }`}
            </Typography>
          </Box>
        </MenuItem>

        {/* Pending Transactions */}
        {pendingTransactions > 0 && (
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Typography color="warning.main">
                {pendingTransactions} pending transaction{pendingTransactions > 1 ? 's' : ''}
              </Typography>
            </Box>
          </MenuItem>
        )}

        {/* Sync Error */}
        {syncError && (
          <MenuItem disabled>
            <Box sx={{ width: '100%' }}>
              <Typography color="error" variant="body2">
                {syncError}
              </Typography>
            </Box>
          </MenuItem>
        )}

        {/* Action Items */}
        <Box sx={{ borderTop: 1, borderColor: 'divider', mt: 1, pt: 1 }}>
          {isOnline && !isSyncing && (
            <MenuItem onClick={handleForceSync}>
              <Refresh sx={{ mr: 1 }} />
              Force Sync
            </MenuItem>
          )}
          
          {syncError && (
            <MenuItem onClick={handleClearError}>
              <Settings sx={{ mr: 1 }} />
              Clear Error
            </MenuItem>
          )}
        </Box>
      </Menu>
    </>
  );
};

export default OfflineIndicator;
