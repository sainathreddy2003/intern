import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Grid, Paper, Fade, Slide, Zoom } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  background: 'linear-gradient(135deg, #ffffff 0%, #fff8f0 50%, #ffe8cc 100%)',
  border: '3px solid transparent',
  borderRadius: 24,
  boxShadow: '0 25px 50px rgba(245, 138, 7, 0.2), 0 0 0 1px rgba(245, 138, 7, 0.1)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, rgba(245, 138, 7, 0.1) 0%, rgba(255, 159, 28, 0.05) 100%)',
    zIndex: -1,
  },
  '&:hover': {
    transform: 'translateY(-10px) scale(1.02)',
    boxShadow: '0 35px 70px rgba(245, 138, 7, 0.3), 0 0 0 2px rgba(245, 138, 7, 0.2)',
    border: '3px solid #ff9f1c',
  },
}));

const HeroButton = styled(Button)(({ theme }) => ({
  padding: '18px 45px',
  fontSize: '18px',
  fontWeight: 700,
  borderRadius: 50,
  background: 'linear-gradient(45deg, #f58a07 0%, #ff9f1c 50%, #ffb74d 100%)',
  color: '#ffffff',
  textTransform: 'none',
  boxShadow: '0 10px 30px rgba(245, 138, 7, 0.4), 0 0 20px rgba(245, 138, 7, 0.2)',
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
    transform: 'translateY(-3px) scale(1.05)',
    boxShadow: '0 15px 40px rgba(245, 138, 7, 0.5), 0 0 30px rgba(245, 138, 7, 0.3)',
    '&::before': {
      left: '100%',
    },
  },
}));

const FeatureCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 248, 240, 0.9) 100%)',
  borderRadius: 20,
  border: '2px solid transparent',
  boxShadow: '0 15px 35px rgba(245, 138, 7, 0.12), 0 0 0 1px rgba(245, 138, 7, 0.08)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, rgba(245, 138, 7, 0.05) 0%, rgba(255, 159, 28, 0.02) 100%)',
    zIndex: -1,
  },
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 248, 240, 0.95) 100%)',
    transform: 'translateY(-8px) scale(1.03)',
    boxShadow: '0 25px 50px rgba(245, 138, 7, 0.2), 0 0 0 2px rgba(245, 138, 7, 0.15)',
    border: '2px solid #ff9f1c',
  },
}));

const FrontPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fff8f0 0%, #ffffff 50%, #fffefc 100%)', position: 'relative', overflow: 'hidden' }}>
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, rgba(245, 138, 7, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '60%',
          right: '10%',
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(255, 159, 28, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse',
        }}
      />
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-20px) scale(1.05); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
          }
        `}
      </style>
      {/* Header with Logo */}
      <Slide in={isVisible} direction="down" timeout={800}>
        <Container maxWidth={false} sx={{ px: { xs: 4, md: 8 }, py: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Zoom in={isVisible} timeout={1000}>
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    background: 'linear-gradient(45deg, #f58a07 0%, #ff9f1c 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    mr: 2,
                    boxShadow: '0 8px 20px rgba(245, 138, 7, 0.3)',
                  }}
                >
                  E
                </Box>
              </Zoom>
              <Fade in={isVisible} timeout={1200}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: '#f58a07',
                    letterSpacing: 0.5,
                  }}
                >
                  Evai Technologies
                </Typography>
              </Fade>
            </Box>
            <Fade in={isVisible} timeout={1400}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  onClick={() => navigate('/services')}
                  sx={{
                    color: '#f58a07',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      background: 'rgba(245, 138, 7, 0.1)',
                    },
                  }}
                >
                  Services
                </Button>
                <Button
                  onClick={() => navigate('/login')}
                  variant="outlined"
                  sx={{
                    color: '#f58a07',
                    borderColor: '#f58a07',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      background: 'rgba(245, 138, 7, 0.1)',
                      borderColor: '#ff9f1c',
                    },
                  }}
                >
                  Sign In
                </Button>
              </Box>
            </Fade>
          </Box>
        </Container>
      </Slide>

      {/* Hero Section */}
      <Slide in={isVisible} direction="up" timeout={1000}>
        <Container maxWidth={false} sx={{ py: 8, px: { xs: 4, md: 8 } }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Fade in={isVisible} timeout={1200}>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography
                    variant="h2"
                    component="h1"
                    sx={{
                      fontWeight: 900,
                      color: '#f58a07',
                      mb: 2,
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      lineHeight: 1.2,
                      textShadow: '2px 2px 4px rgba(245, 138, 7, 0.1)',
                    }}
                  >
                    Complete Business Management Solution
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: '#6f5c4a',
                      mb: 4,
                      fontWeight: 500,
                      lineHeight: 1.6,
                      maxWidth: '700px',
                    }}
                  >
                    Streamline your retail operations with our powerful ERP system. 
                    Manage inventory, sales, purchases, and more - all in one place.
                  </Typography>
                  <Fade in={isVisible} timeout={1400}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <HeroButton onClick={() => navigate('/services')}>
                        Explore Services
                      </HeroButton>
                      <HeroButton 
                        variant="outlined"
                        onClick={() => navigate('/login')}
                        sx={{
                          background: 'transparent',
                          color: '#f58a07',
                          border: '2px solid #f58a07',
                          '&:hover': {
                            background: 'rgba(245, 138, 7, 0.1)',
                          },
                        }}
                      >
                        Sign In
                      </HeroButton>
                    </Box>
                  </Fade>
                </Box>
              </Fade>
            </Grid>
            <Grid item xs={12} md={5}>
              <Zoom in={isVisible} timeout={1500}>
                <StyledPaper>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 800,
                        color: '#f58a07',
                        mb: 2,
                      }}
                    >
                      Retail ERP Pro
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#6f5c4a',
                        mb: 3,
                      }}
                    >
                      Transform your business with intelligent automation
                    </Typography>
                    <Box
                      sx={{
                        width: 200,
                        height: 200,
                        mx: 'auto',
                        background: 'linear-gradient(45deg, #f58a07 0%, #ff9f1c 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '4rem',
                        fontWeight: 900,
                        boxShadow: '0 15px 35px rgba(245, 138, 7, 0.3), 0 0 20px rgba(245, 138, 7, 0.15)',
                        animation: 'pulse 2s infinite',
                      }}
                    >
                      ERP
                    </Box>
                  </Box>
                </StyledPaper>
              </Zoom>
            </Grid>
          </Grid>
        </Container>
      </Slide>

      {/* Features Section */}
      <Container maxWidth={false} sx={{ py: 8, px: { xs: 4, md: 8 } }}>
        <Typography
          variant="h3"
          component="h2"
          sx={{
            textAlign: 'left',
            fontWeight: 800,
            color: '#f58a07',
            mb: 6,
          }}
        >
          Why Choose Our ERP System?
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <FeatureCard>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  mx: 'auto',
                  mb: 2,
                  background: 'linear-gradient(45deg, #f58a07 0%, #ff9f1c 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}
              >
                📊
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f58a07', mb: 1 }}>
                Real-time Analytics
              </Typography>
              <Typography variant="body2" sx={{ color: '#6f5c4a' }}>
                Get instant insights into your business performance
              </Typography>
            </FeatureCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FeatureCard>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  mx: 'auto',
                  mb: 2,
                  background: 'linear-gradient(45deg, #f58a07 0%, #ff9f1c 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}
              >
                📦
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f58a07', mb: 1 }}>
                Inventory Management
              </Typography>
              <Typography variant="body2" sx={{ color: '#6f5c4a' }}>
                Track stock levels and automate reordering
              </Typography>
            </FeatureCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FeatureCard>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  mx: 'auto',
                  mb: 2,
                  background: 'linear-gradient(45deg, #f58a07 0%, #ff9f1c 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}
              >
                💰
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f58a07', mb: 1 }}>
                Sales & POS
              </Typography>
              <Typography variant="body2" sx={{ color: '#6f5c4a' }}>
                Fast checkout and comprehensive sales tracking
              </Typography>
            </FeatureCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FeatureCard>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  mx: 'auto',
                  mb: 2,
                  background: 'linear-gradient(45deg, #f58a07 0%, #ff9f1c 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}
              >
                🔒
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f58a07', mb: 1 }}>
                Secure & Reliable
              </Typography>
              <Typography variant="body2" sx={{ color: '#6f5c4a' }}>
                Enterprise-grade security for your data
              </Typography>
            </FeatureCard>
          </Grid>
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ py: 8, background: 'linear-gradient(45deg, #f58a07 0%, #ff9f1c 100%)' }}>
        <Container maxWidth={false} sx={{ px: { xs: 4, md: 8 } }}>
          <Box sx={{ textAlign: 'left' }}>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 900,
                color: '#ffffff',
                mb: 2,
              }}
            >
              Ready to Transform Your Business?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                mb: 4,
                maxWidth: 600,
              }}
            >
              Join thousands of businesses that have already streamlined their operations with our ERP solution
            </Typography>
            <HeroButton
              onClick={() => navigate('/services')}
              sx={{
                background: '#ffffff',
                color: '#f58a07',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              Get Started Today
            </HeroButton>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default FrontPage;
