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
import Close from '@mui/icons-material/Close';

const KeyboardShortcuts = () => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Show/hide shortcuts help
  useEffect(() => {
    const handleKeyDown = (event) => {
      // F1 to toggle shortcuts help
      if (event.key === 'F1') {
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
        { key: 'Esc', description: 'Close popup/dialog' },
      ],
    },
    {
      category: 'Billing',
      items: [
        { key: 'F9', description: 'Save bill' },
        { key: 'F10', description: 'Hold bill' },
        { key: 'F12', description: 'Clear bill' },
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
            <IconButton
              size="small"
              onClick={() => setIsVisible(false)}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {/* Quick shortcuts */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Quick Access:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              <Chip label="F1: Help" size="small" variant="outlined" />
              <Chip label="F9: Save" size="small" variant="outlined" />
              <Chip label="F10: Hold" size="small" variant="outlined" />
              <Chip label="F12: Clear" size="small" variant="outlined" />
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
              Press F1 to toggle • Press Esc or X to close
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default KeyboardShortcuts;
