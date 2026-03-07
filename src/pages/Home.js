import React from 'react';
import { Box, Button, Grid, Paper, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import PointOfSale from '@mui/icons-material/PointOfSale';
import Dashboard from '@mui/icons-material/Dashboard';
import Inventory from '@mui/icons-material/Inventory';

const floatA = keyframes`
  0% { transform: translateY(0px) translateX(0px) scale(1); }
  50% { transform: translateY(-20px) translateX(15px) scale(1.08); }
  100% { transform: translateY(0px) translateX(0px) scale(1); }
`;

const floatB = keyframes`
  0% { transform: translateY(0px) translateX(0px) scale(1); }
  50% { transform: translateY(18px) translateX(-12px) scale(0.94); }
  100% { transform: translateY(0px) translateX(0px) scale(1); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const Home = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          backgroundImage: 'url("/homebg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1200, mx: 'auto', px: 3, pt: 4 }}>
        <Paper
          elevation={24}
          sx={{
            p: { xs: 4, md: 6 },
            mb: 4,
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,248,240,0.92) 100%)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255,152,0,0.3)',
            boxShadow: '0 20px 60px rgba(255,152,0,0.3), 0 0 100px rgba(255,193,7,0.2)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              animation: `${shimmer} 3s infinite`,
            },
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              background: 'linear-gradient(135deg, #ff6b00 0%, #ff9800 50%, #ffc107 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              fontSize: { xs: '2rem', md: '3.5rem' },
              mb: 1,
              textShadow: '0 4px 20px rgba(255,152,0,0.3)',
            }}
          >
            EVAI TECHNOLOGIES PVT LTD
          </Typography>
          <Typography
            variant="h4"
            sx={{
              mt: 1,
              mb: 3,
              color: '#e65100',
              fontWeight: 800,
              fontSize: { xs: '1.5rem', md: '2.2rem' },
              textShadow: '0 2px 10px rgba(230,81,0,0.2)',
            }}
          >
            Ramesh Exports
          </Typography>
          <Typography 
            sx={{ 
              mb: 4, 
              color: '#bf360c', 
              fontWeight: 600,
              fontSize: { xs: '1rem', md: '1.2rem' },
            }}
          >
            Complete Textile Management Solution
          </Typography>

          <Grid container spacing={2} sx={{ justifyContent: 'center', mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Button 
                variant="contained" 
                size="large"
                fullWidth
                startIcon={<PointOfSale />} 
                onClick={() => navigate('/sales')}
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #ff6b00 0%, #ff9800 100%)',
                  boxShadow: '0 8px 24px rgba(255,152,0,0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #f57c00 0%, #fb8c00 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 32px rgba(255,152,0,0.5)',
                  },
                }}
              >
                Start Sales
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button 
                variant="outlined" 
                size="large"
                fullWidth
                startIcon={<Dashboard />} 
                onClick={() => navigate('/dashboard')}
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  borderWidth: 2,
                  borderColor: '#ff9800',
                  color: '#ff6b00',
                  '&:hover': {
                    borderWidth: 2,
                    borderColor: '#f57c00',
                    background: 'rgba(255,152,0,0.1)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Dashboard
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button 
                variant="outlined" 
                size="large"
                fullWidth
                startIcon={<Inventory />} 
                onClick={() => navigate('/items')}
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  borderWidth: 2,
                  borderColor: '#ff9800',
                  color: '#ff6b00',
                  '&:hover': {
                    borderWidth: 2,
                    borderColor: '#f57c00',
                    background: 'rgba(255,152,0,0.1)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Inventory
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};

export default Home;
