import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Grid, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Fade, Slide, Zoom } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const ServiceCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: 'linear-gradient(135deg, #ffffff 0%, #fff8f0 40%, #ffe8cc 100%)',
  border: '3px solid transparent',
  borderRadius: 24,
  boxShadow: '0 20px 40px rgba(245, 138, 7, 0.15), 0 0 0 1px rgba(245, 138, 7, 0.08)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, rgba(245, 138, 7, 0.08) 0%, rgba(255, 159, 28, 0.04) 100%)',
    zIndex: -1,
  },
  '&:hover': {
    transform: 'translateY(-12px) scale(1.03)',
    boxShadow: '0 30px 60px rgba(245, 138, 7, 0.25), 0 0 0 2px rgba(245, 138, 7, 0.2)',
    border: '3px solid #ff9f1c',
  },
}));

const ServiceIcon = styled(Box)(({ theme }) => ({
  width: 90,
  height: 90,
  mx: 'auto',
  mb: 3,
  background: 'linear-gradient(45deg, #f58a07 0%, #ff9f1c 50%, #ffb74d 100%)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '2.5rem',
  fontWeight: 700,
  boxShadow: '0 10px 25px rgba(245, 138, 7, 0.3), 0 0 15px rgba(245, 138, 7, 0.15)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)',
    borderRadius: '50%',
  },
}));

const LoginButton = styled(Button)(({ theme }) => ({
  padding: '14px 35px',
  fontSize: '16px',
  fontWeight: 700,
  borderRadius: 30,
  background: 'linear-gradient(45deg, #f58a07 0%, #ff9f1c 50%, #ffb74d 100%)',
  color: '#ffffff',
  textTransform: 'none',
  boxShadow: '0 8px 25px rgba(245, 138, 7, 0.3), 0 0 15px rgba(245, 138, 7, 0.15)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
    transition: 'left 0.6s',
  },
  '&:hover': {
    background: 'linear-gradient(45deg, #e67a00 0%, #f58a07 50%, #ff9f1c 100%)',
    transform: 'translateY(-2px) scale(1.05)',
    boxShadow: '0 12px 35px rgba(245, 138, 7, 0.4), 0 0 25px rgba(245, 138, 7, 0.25)',
    '&::before': {
      left: '100%',
    },
  },
}));

const ServicesPage = () => {
  const navigate = useNavigate();
  const [loginDialog, setLoginDialog] = useState({ open: false, service: '' });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const services = [
    {
      id: 'erp',
      title: 'ERP System',
      description: 'Complete Enterprise Resource Planning solution for your business',
      features: ['Inventory Management', 'Sales & POS', 'Purchase Orders', 'Financial Reports'],
      icon: '🏢',
      hasLogin: true,
      loginPath: '/login',
    },
    {
      id: 'employee',
      title: 'Employee Management Tool',
      description: 'Comprehensive employee management and HR system',
      features: ['Employee Records', 'Attendance Tracking', 'Payroll Management', 'Performance Reviews'],
      icon: '�',
      hasLogin: false,
    },
    {
      id: 'billing',
      title: 'Billing Software',
      description: 'Professional billing and invoicing solution',
      features: ['Invoice Generation', 'Payment Processing', 'Tax Management', 'Customer Billing'],
      icon: '💰',
      hasLogin: false,
    },
    {
      id: 'project',
      title: 'Project Management Tool',
      description: 'Advanced project management and collaboration platform',
      features: ['Task Management', 'Team Collaboration', 'Timeline Tracking', 'Resource Planning'],
      icon: '📊',
      hasLogin: false,
    },
  ];

  const handleLoginClick = (service) => {
    // Only ERP system has login functionality
    if (service.id === 'erp') {
      navigate('/login');
    }
  };

  const handleLoginSubmit = () => {
    // Simulate login - in real app, this would authenticate
    console.log('Logging in to:', loginDialog.service, loginForm);
    setLoginDialog({ open: false, service: '' });
    setLoginForm({ username: '', password: '' });
    // Navigate to main app after successful login
    navigate('/login');
  };

  const handleDialogClose = () => {
    setLoginDialog({ open: false, service: '' });
    setLoginForm({ username: '', password: '' });
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fff8f0 0%, #ffffff 50%, #fffefc 100%)', position: 'relative', overflow: 'hidden' }}>
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '5%',
          left: '8%',
          width: 250,
          height: 250,
          background: 'radial-gradient(circle, rgba(245, 138, 7, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 7s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '40%',
          right: '5%',
          width: 180,
          height: 180,
          background: 'radial-gradient(circle, rgba(255, 159, 28, 0.06) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 9s ease-in-out infinite reverse',
        }}
      />
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-15px) scale(1.05); }
          }
        `}
      </style>
      {/* Header Section */}
      <Slide in={isVisible} direction="down" timeout={800}>
        <Container maxWidth={false} sx={{ py: 8, px: { xs: 4, md: 8 } }}>
          <Fade in={isVisible} timeout={1000}>
            <Box sx={{ textAlign: 'left', mb: 8 }}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 900,
                  color: '#f58a07',
                  mb: 3,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  textShadow: '2px 2px 4px rgba(245, 138, 7, 0.1)',
                }}
              >
                Our Services
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: '#6f5c4a',
                  maxWidth: 800,
                  lineHeight: 1.6,
                  fontWeight: 500,
                }}
              >
                Discover our comprehensive suite of business management solutions. 
                Each service is designed to streamline your operations and boost productivity.
              </Typography>
            </Box>
          </Fade>

          {/* Services Grid */}
          <Fade in={isVisible} timeout={1200}>
            <Grid container spacing={4}>
          {services.map((service) => (
            <Grid item xs={12} sm={6} md={4} key={service.id}>
              <ServiceCard>
                <CardContent sx={{ p: 4 }}>
                  <ServiceIcon>{service.icon}</ServiceIcon>
                  <Typography
                    variant="h4"
                    component="h3"
                    sx={{
                      fontWeight: 800,
                      color: '#f58a07',
                      mb: 2,
                      textAlign: 'center',
                    }}
                  >
                    {service.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#6f5c4a',
                      mb: 3,
                      textAlign: 'center',
                      lineHeight: 1.6,
                    }}
                  >
                    {service.description}
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    {service.features.map((feature, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 1,
                          color: '#6f5c4a',
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#f58a07',
                            mr: 2,
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2">{feature}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ textAlign: 'center' }}>
                    {service.hasLogin ? (
                      <LoginButton
                        onClick={() => handleLoginClick(service)}
                        fullWidth
                      >
                        Login to {service.title}
                      </LoginButton>
                    ) : (
                      <Button
                        variant="outlined"
                        fullWidth
                        disabled
                        sx={{
                          padding: '12px 30px',
                          fontSize: '16px',
                          fontWeight: 700,
                          borderRadius: 25,
                          borderColor: '#f58a07',
                          color: '#f58a07',
                          textTransform: 'none',
                          '&:disabled': {
                            borderColor: '#ccc',
                            color: '#ccc',
                            background: 'rgba(200, 200, 200, 0.1)',
                          },
                        }}
                      >
                        Coming Soon
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </ServiceCard>
            </Grid>
          ))}
        </Grid>
          </Fade>
        </Container>
      </Slide>

      {/* Login Dialog */}
      <Dialog
        open={loginDialog.open}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 20,
            border: '2px solid #f58a07',
            background: 'linear-gradient(135deg, #ffffff 0%, #fff8f0 100%)',
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#f58a07',
            }}
          >
            Login to {loginDialog.service}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.8)',
                },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.8)',
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 2 }}>
          <Button
            onClick={handleDialogClose}
            sx={{
              color: '#6f5c4a',
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <LoginButton onClick={handleLoginSubmit}>
            Login
          </LoginButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServicesPage;
