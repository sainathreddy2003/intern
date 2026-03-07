import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS_design';
import ItemsMaster from './pages/ItemsMaster';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Purchase from './pages/Purchase';
import Reports from './pages/Reports';
import Security from './pages/Security';
import Settings from './pages/Settings';
import Cutting from './pages/Cutting';
import GeneralExpense from './pages/GeneralExpense';
import Warehouse from './pages/Warehouse';
import FrontPage from './pages/FrontPage';
import ServicesPage from './pages/ServicesPage';

// Components
import Layout from './components/Layout';
import OfflineIndicator from './components/OfflineIndicator';
import KeyboardShortcuts from './components/KeyboardShortcuts';

// Contexts
import { useAuth } from './contexts/AuthContext';
import { useOffline } from './contexts/OfflineContext_simple';

// Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#f58a07',
      light: '#ffb74d',
      dark: '#c96a00',
    },
    secondary: {
      main: '#ff7a00',
    },
    warning: {
      main: '#ff9f1c',
    },
    success: {
      main: '#2f9e44',
    },
    info: {
      main: '#2563eb',
    },
    background: {
      default: '#fff7ee',
      paper: '#ffffff',
    },
    text: {
      primary: '#18120a',
      secondary: '#6f5c4a',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Manrope", "Segoe UI", "Helvetica", "Arial", sans-serif',
    button: {
      fontWeight: 700,
      letterSpacing: 0.1,
    },
    h4: {
      fontWeight: 800,
      color: '#18120a',
    },
    h5: {
      fontWeight: 750,
      color: '#18120a',
    },
    h6: {
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(180deg, #fff8f0 0%, #fff2e3 100%)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #db6c00 0%, #f58a07 55%, #ffad42 100%)',
          color: '#1d1206',
          boxShadow: '0 10px 30px rgba(180, 98, 0, 0.35)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 700,
          boxShadow: 'none',
        },
        contained: {
          background: 'linear-gradient(90deg, #f28705 0%, #ff9f1c 100%)',
          color: '#1f1206',
        },
        outlined: {
          borderColor: '#f3bc78',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #f1d4ac',
          boxShadow: '0 10px 24px rgba(122, 73, 16, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid #f4dbc0',
          boxShadow: '0 10px 24px rgba(122, 73, 16, 0.06)',
          backgroundImage: 'linear-gradient(180deg, #fffefc 0%, #fff8ef 100%)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #fff0dd 0%, #ffe3be 100%)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 800,
          color: '#5f3410',
          borderBottom: '1px solid #efcd9f',
        },
        root: {
          borderBottom: '1px solid #f4ddc1',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 11,
            background: '#fffdf9',
          },
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        Loading...
      </Box>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" />;
};

function App() {
  const { isAuthenticated } = useAuth();
  const { isOnline } = useOffline();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up electron menu listeners if running in electron
    if (window.electronAPI) {
      const handleMenuAction = (event) => {
        const route = event.replace('menu-', '').replace('-', '/');

        // Handle menu actions
        switch (event) {
          case 'menu-new-bill':
            navigate('/sales');
            break;
          case 'menu-reprint-bill':
            navigate('/reports/sales');
            break;
          case 'menu-purchase-entry':
            navigate('/purchase');
            break;
          case 'menu-day-end':
            navigate('/reports/day-end');
            break;
          case 'menu-download-sync':
            // Trigger sync download
            break;
          case 'menu-upload-sync':
            // Trigger sync upload
            break;
          case 'menu-items-master':
            navigate('/items');
            break;
          case 'menu-customers':
            navigate('/customers');
            break;
          case 'menu-suppliers':
            navigate('/suppliers');
            break;
          case 'menu-reports':
            navigate('/reports');
            break;
          case 'menu-general-expense':
            navigate('/general-expense');
            break;
          default:
            break;
        }
      };

      window.electronAPI.onMenuAction(handleMenuAction);

      return () => {
        window.electronAPI.removeAllListeners('menu-new-bill');
        window.electronAPI.removeAllListeners('menu-reprint-bill');
        window.electronAPI.removeAllListeners('menu-purchase-entry');
        window.electronAPI.removeAllListeners('menu-day-end');
        window.electronAPI.removeAllListeners('menu-download-sync');
        window.electronAPI.removeAllListeners('menu-upload-sync');
        window.electronAPI.removeAllListeners('menu-items-master');
        window.electronAPI.removeAllListeners('menu-customers');
        window.electronAPI.removeAllListeners('menu-suppliers');
        window.electronAPI.removeAllListeners('menu-reports');
        window.electronAPI.removeAllListeners('menu-general-expense');
      };
    }
  }, [navigate]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Keyboard Shortcuts Help */}
      {isAuthenticated && <KeyboardShortcuts />}

      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/home" />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/sales" element={<POS />} />
                  <Route path="/pos" element={<POS />} />
                  <Route path="/items" element={<ItemsMaster />} />
                  <Route path="/parties" element={<Customers />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/warehouse" element={<Warehouse />} />
                  <Route path="/purchase" element={<Purchase />} />
                  <Route path="/general-expense" element={<GeneralExpense />} />
                  <Route path="/reports/*" element={<Reports />} />
                  <Route path="/security" element={<Security />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/cutting" element={<Cutting />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
