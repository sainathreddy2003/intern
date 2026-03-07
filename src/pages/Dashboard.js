import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
} from '@mui/material';
import PointOfSale from '@mui/icons-material/PointOfSale';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import Inventory from '@mui/icons-material/Inventory';
import AttachMoney from '@mui/icons-material/AttachMoney';
import TrendingUp from '@mui/icons-material/TrendingUp';
import People from '@mui/icons-material/People';
import Business from '@mui/icons-material/Business';
import Assessment from '@mui/icons-material/Assessment';
import Warning from '@mui/icons-material/Warning';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// Services
import { salesAPI, inventoryAPI } from '../services/api';
import { offlineDB } from '../services/offlineDB';
import { useOffline } from '../contexts/OfflineContext_simple';

const safeFormatTime = (value, fmt = 'p') => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : format(date, fmt);
};

const Dashboard = () => {
  const { isOnline, lastSyncTime } = useOffline();
  const navigate = useNavigate();

  // Fetch dashboard data
  const { data: todaySales, isLoading: salesLoading } = useQuery(
    'todaySales',
    () => isOnline 
      ? salesAPI.getDayEndSummary(format(new Date(), 'yyyy-MM-dd'))
      : offlineDB.salesHdr.getByDateRange(
          format(new Date(), 'yyyy-MM-dd'),
          format(new Date(), 'yyyy-MM-dd')
        ),
    {
      enabled: true,
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: lowStockItems, isLoading: stockLoading } = useQuery(
    'lowStockItems',
    () => isOnline 
      ? inventoryAPI.getLowStockItems()
      : offlineDB.items.getLowStock(),
    {
      enabled: true,
      staleTime: 10 * 60 * 1000,
    }
  );

  const { data: recentBills, isLoading: billsLoading } = useQuery(
    'recentBills',
    () => isOnline 
      ? salesAPI.getBills({ limit: 5 })
      : offlineDB.salesHdr.reverse().limit(5),
    {
      enabled: true,
      staleTime: 2 * 60 * 1000,
    }
  );

  // Calculate stats
  const todayStatsRaw = todaySales?.data || todaySales || {};
  const todayStats = {
    totalSales: Number(todayStatsRaw.totalSales ?? todayStatsRaw.totalAmount ?? 0),
    totalDiscount: Number(todayStatsRaw.totalDiscount ?? 0),
    billsCount: Number(todayStatsRaw.billsCount ?? todayStatsRaw.totalBills ?? 0),
    cancelledBills: Number(todayStatsRaw.cancelledBills ?? 0),
  };

  const lowStock = Array.isArray(lowStockItems?.data)
    ? lowStockItems.data
    : Array.isArray(lowStockItems?.data?.items)
      ? lowStockItems.data.items
      : Array.isArray(lowStockItems)
        ? lowStockItems
        : [];
  const recentBillsList = Array.isArray(recentBills?.data?.bills)
    ? recentBills.data.bills
    : Array.isArray(recentBills?.data?.items)
      ? recentBills.data.items
      : Array.isArray(recentBills)
        ? recentBills
        : [];

  const statCards = [
    {
      title: 'Today\'s Sales',
      value: `₹${todayStats.totalSales?.toFixed(2) || '0.00'}`,
      icon: <AttachMoney />,
      color: '#ff9800',
      loading: salesLoading,
    },
    {
      title: 'Total Bills',
      value: todayStats.billsCount || 0,
      icon: <PointOfSale />,
      color: '#ff9800',
      loading: salesLoading,
    },
    {
      title: 'Low Stock Notification',
      value: lowStock.length,
      icon: <Warning />,
      color: lowStock.length > 0 ? '#ff6f00' : '#ff9800',
      loading: stockLoading,
    },
    {
      title: 'Cancelled Bills',
      value: todayStats.cancelledBills || 0,
      icon: <Cancel />,
      color: '#ff6f00',
      loading: salesLoading,
    },
  ];

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#251708', fontWeight: 800 }}>
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={isOnline ? <CheckCircle /> : <Warning />}
            label={isOnline ? 'Online' : 'Offline'}
            sx={{ 
              bgcolor: isOnline ? '#f4a11f' : '#ff7a00',
              color: '#281405',
              fontWeight: 'bold'
            }}
          />
          <Typography variant="body2" color="text.secondary">
            Last sync: {lastSyncTime ? safeFormatTime(lastSyncTime, 'p') : 'Never'}
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ bgcolor: '#ffffff', border: '2px solid #ff9800' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: '#ff9800',
                      color: '#000000',
                      mr: 2,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" component="div" sx={{ color: '#000000', fontWeight: 'bold' }}>
                      {stat.loading ? <CircularProgress size={24} sx={{ color: '#ff9800' }} /> : stat.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#000000', fontWeight: 'bold' }}>
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Bills */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, bgcolor: '#ffffff', border: '2px solid #ff9800' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#000000', fontWeight: 'bold' }}>
              <ShoppingCart sx={{ mr: 1, verticalAlign: 'middle', color: '#ff9800' }} />
              Recent Bills
            </Typography>
            
            {billsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress sx={{ color: '#ff9800' }} />
              </Box>
            ) : recentBillsList.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 3, color: '#000000' }}>
                <ShoppingCart sx={{ fontSize: 48, mb: 1, color: '#ff9800' }} />
                <Typography sx={{ color: '#000000' }}>No bills today</Typography>
              </Box>
            ) : (
              <List>
                {recentBillsList.map((bill) => (
                  <ListItem key={bill.id || bill.bill_no || bill.invoiceNo}>
                    <ListItemIcon>
                      <PointOfSale sx={{ color: '#ff9800' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Bill #${bill.bill_no || bill.invoiceNo || '-'}`}
                      secondary={`₹${Number(bill.grand_total ?? bill.netAmount ?? 0).toFixed(2)} - ${safeFormatTime(bill.bill_date || bill.createdAt, 'p')}`}
                      primaryTypographyProps={{ color: '#000000', fontWeight: 'bold' }}
                      secondaryTypographyProps={{ color: '#000000' }}
                    />
                    <Chip
                      label={bill.status || 'ACTIVE'}
                      size="small"
                      sx={{ 
                        bgcolor: bill.status === 'CANCELLED' ? '#ff6f00' : '#ff9800',
                        color: '#000000',
                        fontWeight: 'bold'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Low Stock Notification */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: '#ffffff', border: '2px solid #ff9800' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#000000', fontWeight: 'bold' }}>
              <Warning sx={{ mr: 1, verticalAlign: 'middle', color: '#ff6f00' }} />
              Low Stock Notification
            </Typography>
            
            {stockLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress sx={{ color: '#ff9800' }} />
              </Box>
            ) : lowStock.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 3, color: '#000000' }}>
                <Inventory sx={{ fontSize: 48, mb: 1, color: '#ff9800' }} />
                <Typography sx={{ color: '#000000' }}>Low Stock Notification: All items are in stock</Typography>
              </Box>
            ) : (
              <List dense>
                {lowStock.slice(0, 5).map((item) => (
                  <ListItem key={item.item_id}>
                    <ListItemIcon>
                      <Inventory sx={{ color: '#ff6f00' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.item_name}
                      secondary={`Current: ${item.currentStock ?? item.stock ?? 0} | Min: ${item.min_stock_level ?? 0}`}
                      primaryTypographyProps={{ color: '#000000', fontWeight: 'bold' }}
                      secondaryTypographyProps={{ color: '#000000' }}
                    />
                  </ListItem>
                ))}
                {lowStock.length > 5 && (
                  <ListItem>
                    <ListItemText
                      primary={`... and ${lowStock.length - 5} more items`}
                      secondary="View all in inventory management"
                      primaryTypographyProps={{ color: '#000000', fontWeight: 'bold' }}
                      secondaryTypographyProps={{ color: '#000000' }}
                    />
                  </ListItem>
                )}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
              Quick Actions
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate('/sales')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <PointOfSale sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body1">New Sale</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ctrl+B
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate('/items')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Inventory sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="body1">Items Master</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Manage items
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate('/customers')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <People sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                    <Typography variant="body1">Customers</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Manage customers
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate('/reports')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Assessment sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                    <Typography variant="body1">Reports</Typography>
                    <Typography variant="caption" color="text.secondary">
                      View reports
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
