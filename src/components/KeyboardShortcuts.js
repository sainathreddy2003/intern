import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Collapse,
  useTheme,
} from '@mui/material';
import Keyboard from '@mui/icons-material/Keyboard';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import Help from '@mui/icons-material/Help';

const KeyboardShortcuts = () => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Show/hide shortcuts help
  useEffect(() => {
    const handleKeyDown = (event) => {
      // F1 or Ctrl+/ to toggle shortcuts help
      if (event.key === 'F1' || (event.ctrlKey && event.key === '/')) {
        event.preventDefault();
        setIsVisible(!isVisible);
      }
      
      // Escape to hide
      if (event.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  const shortcuts = [
    {
      category: 'General',
      items: [
        { key: 'F1', description: 'Toggle keyboard shortcuts help' },
        { key: 'Ctrl+/', description: 'Toggle keyboard shortcuts help' },
        { key: 'Escape', 'description': 'Close dialogs / Clear cart' },
      ],
    },
    {
      category: 'Sales Operations',
      items: [
        { key: 'Ctrl+B', description: 'New bill' },
        { key: 'Ctrl+R', description: 'Reprint bill' },
        { key: 'Ctrl+H', description: 'Hold bill' },
        { key: 'Ctrl+S', description: 'Save bill' },
        { key: 'Ctrl+P', description: 'Purchase entry' },
        { key: 'Ctrl+E', description: 'Day end process' },
      ],
    },
    {
      category: 'Navigation',
      items: [
        { key: 'Alt+H', description: 'Go to Dashboard' },
        { key: 'Alt+P', description: 'Go to Sales' },
        { key: 'Alt+I', description: 'Go to Items Master' },
        { key: 'Alt+C', description: 'Go to Customers' },
        { key: 'Alt+S', description: 'Go to Suppliers' },
        { key: 'Alt+R', description: 'Go to Reports' },
      ],
    },
    {
      category: 'Sync Operations',
      items: [
        { key: 'Ctrl+D', description: 'Download from server' },
        { key: 'Ctrl+U', description: 'Upload to server' },
        { key: 'Ctrl+F5', description: 'Force sync all data' },
      ],
    },
    {
      category: 'Search',
      items: [
        { key: 'Ctrl+F', description: 'Focus search field' },
        { key: 'Ctrl+K', description: 'Quick search items' },
        { key: 'Ctrl+Shift+F', description: 'Advanced search' },
      ],
    },
  ];

  if (!isVisible) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <IconButton
          size="small"
          onClick={() => setIsVisible(true)}
          sx={{
            bgcolor: 'background.paper',
            boxShadow: 2,
            '&:hover': {
              bgcolor: 'background.default',
            },
          }}
        >
          <Help />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 320,
        maxHeight: '80vh',
        zIndex: 1000,
      }}
    >
      <Card sx={{ boxShadow: 4 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Keyboard sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Keyboard Shortcuts</Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>

          {/* Quick shortcuts */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Quick Access:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              <Chip label="F1: Help" size="small" variant="outlined" />
              <Chip label="Ctrl+B: New Bill" size="small" variant="outlined" />
              <Chip label="Ctrl+S: Save" size="small" variant="outlined" />
              <Chip label="Ctrl+D: Download" size="small" variant="outlined" />
            </Box>
          </Box>

          {/* Detailed shortcuts */}
          <Collapse in={expanded}>
            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {shortcuts.map((category) => (
                <Box key={category.category} sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="primary"
                    gutterBottom
                    sx={{ fontWeight: 'bold' }}
                  >
                    {category.category}
                  </Typography>
                  <List dense>
                    {category.items.map((shortcut, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Chip
                                label={shortcut.key}
                                size="small"
                                sx={{
                                  fontFamily: 'monospace',
                                  mr: 1,
                                  minWidth: 80,
                                  textAlign: 'center',
                                }}
                              />
                              <Typography variant="body2">
                                {shortcut.description}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ))}
            </Box>
          </Collapse>

          {/* Footer */}
          <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Press F1 or Ctrl+/ to toggle • Press Escape to close
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default KeyboardShortcuts;
