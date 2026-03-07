import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlined from '@mui/icons-material/LockOutlined';
import Store from '@mui/icons-material/Store';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password State
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetStep, setResetStep] = useState(0); // 0: Username, 1: Security Qustion, 2: New Password
  const [resetUsername, setResetUsername] = useState('');
  const [resetQuestion, setResetQuestion] = useState('');
  const [resetAnswer, setResetAnswer] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetAttempts, setResetAttempts] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleForgotClose = () => {
    setForgotPasswordOpen(false);
    setResetStep(0);
    setResetUsername('');
    setResetQuestion('');
    setResetAnswer('');
    setResetToken('');
    setNewPassword('');
    setResetError('');
    setResetAttempts(0);
  };

  const handleForgotNext = async () => {
    setResetError('');
    setIsResetLoading(true);

    try {
      if (resetStep === 0) {
        if (!resetUsername) throw new Error('Please enter your username');
        const res = await authAPI.getSecurityQuestion(resetUsername);
        setResetQuestion(res.data.question);
        setResetStep(1);
      }
      else if (resetStep === 1) {
        if (!resetAnswer) throw new Error('Please enter your answer');
        if (resetAttempts >= 3) throw new Error('Maximum attempt limit reached. Please contact support.');

        try {
          const res = await authAPI.verifySecurityAnswer({ email: resetUsername, answer: resetAnswer });
          setResetToken(res.data.resetToken);
          setResetStep(2);
        } catch (err) {
          setResetAttempts(prev => prev + 1);
          throw new Error(err.message || 'Incorrect answer. Attempts remaining: ' + (2 - resetAttempts));
        }
      }
      else if (resetStep === 2) {
        if (newPassword.length < 6) throw new Error('Password must be at least 6 characters');
        await authAPI.resetPassword({ resetToken, newPassword });
        toast.success('Password reset successfully!');
        handleForgotClose();
      }
    } catch (err) {
      setResetError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      return;
    }

    setIsSubmitting(true);

    const result = await login(formData);

    if (result.success) {
      navigate('/dashboard');
    }

    setIsSubmitting(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 10% 20%, #ffe0b2 0%, transparent 40%), radial-gradient(circle at 90% 80%, #ffcc80 0%, transparent 40%)',
        bgcolor: '#fdfbfb',
        p: { xs: 2, sm: 4 },
      }}
    >
      <Card
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          width: '100%',
          maxWidth: 1000,
          boxShadow: '0 24px 64px rgba(255, 152, 0, 0.12)',
          borderRadius: 4,
          overflow: 'hidden',
          bgcolor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Left Side: Branding / Marketing */}
        <Box
          sx={{
            flex: { xs: 'none', md: 1 },
            background: 'linear-gradient(135deg, #ff9800 0%, #e65100 100%)',
            color: '#fff',
            p: { xs: 4, md: 6 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Decorative Background Elements */}
          <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <Box sx={{ position: 'absolute', bottom: -80, left: -20, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Store sx={{ fontSize: 64, mb: 3 }} />
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              Ramesh Exports
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 500, mb: 2, opacity: 0.9 }}>
              Retail ERP System
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, lineHeight: 1.6, maxWidth: 350 }}>
              Cloud-Sync Management Platform for seamless retail operations, billing, and intelligent inventory tracking.
            </Typography>
          </Box>
        </Box>

        {/* Right Side: Login Form */}
        <Box sx={{ flex: { xs: 'none', md: 1 }, p: { xs: 4, md: 6 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ mb: 4, textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#333', mb: 1 }}>
              Welcome Back
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Please enter your credentials to access your account.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              required
              autoFocus
              disabled={isSubmitting}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': { borderColor: '#ff9800' },
                  '&.Mui-focused fieldset': { borderColor: '#ff9800' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#ff9800' }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircle sx={{ color: '#9e9e9e' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              disabled={isSubmitting}
              sx={{
                mb: 4,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': { borderColor: '#ff9800' },
                  '&.Mui-focused fieldset': { borderColor: '#ff9800' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#ff9800' }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ color: '#9e9e9e' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={isSubmitting}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting || loading}
              sx={{
                py: 1.8,
                bgcolor: '#ff9800',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1rem',
                textTransform: 'none',
                letterSpacing: 0.5,
                borderRadius: 2,
                boxShadow: '0 8px 20px rgba(255, 152, 0, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: '#f57c00',
                  boxShadow: '0 12px 24px rgba(255, 152, 0, 0.4)',
                  transform: 'translateY(-2px)'
                },
                '&:disabled': {
                  bgcolor: '#ffe0b2',
                }
              }}
            >
              {isSubmitting || loading ? (
                <CircularProgress size={26} sx={{ color: '#fff' }} />
              ) : (
                'Sign In to Dashboard'
              )}
            </Button>
          </Box>

          <Box sx={{ mt: 4, p: 2, bgcolor: '#fff3e0', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#e65100', fontWeight: 600 }}>
              Default Login: admin / admin123
            </Typography>
            <Button
              color="primary"
              variant="text"
              size="small"
              onClick={() => setForgotPasswordOpen(true)}
            >
              Forgot Password?
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Forgot Password Modal */}
      <Dialog
        open={forgotPasswordOpen}
        onClose={handleForgotClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 2 } }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          Secure Password Recovery
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={resetStep} sx={{ mb: 4, mt: 2 }}>
            <Step><StepLabel>Identify</StepLabel></Step>
            <Step><StepLabel>Verify</StepLabel></Step>
            <Step><StepLabel>Reset</StepLabel></Step>
          </Stepper>

          {resetError && (
            <Alert severity="error" sx={{ mb: 3 }}>{resetError}</Alert>
          )}

          {resetStep === 0 && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Enter your admin username (email) to recover your account securely.
              </Typography>
              <TextField
                fullWidth
                label="Domain Username"
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
                autoFocus
                disabled={isResetLoading}
              />
            </Box>
          )}

          {resetStep === 1 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#e65100' }}>
                Security Question:
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                "{resetQuestion}"
              </Typography>
              <TextField
                fullWidth
                label="Your Secret Answer"
                type="password"
                value={resetAnswer}
                onChange={(e) => setResetAnswer(e.target.value)}
                autoFocus
                disabled={isResetLoading || resetAttempts >= 3}
                autoComplete="off"
              />
            </Box>
          )}

          {resetStep === 2 && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2, color: 'success.main', fontWeight: 'bold' }}>
                Identity Verified! You may now reset your password.
              </Typography>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
                disabled={isResetLoading}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleForgotClose} color="inherit" disabled={isResetLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleForgotNext}
            variant="contained"
            disabled={isResetLoading || (resetStep === 1 && resetAttempts >= 3)}
          >
            {isResetLoading ? <CircularProgress size={24} color="inherit" /> : (resetStep === 2 ? 'Confirm Overwrite' : 'Next Step')}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{
        position: 'fixed',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 0
      }}>
        <Typography variant="body2" sx={{ color: '#9e9e9e', fontWeight: 500 }}>
          © 2024 Ramesh Exports • Retail ERP v1.0.0
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;
