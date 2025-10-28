import React, { useState } from 'react';
import { Button, TextField, Box, Typography, Paper, Alert, CircularProgress } from '@mui/material'; // Added CircularProgress import
import { Link } from 'react-router-dom'; // For back to login link

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(''); // Separate state for errors
  const [loading, setLoading] = useState(false); // Add loading state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true); // Start loading

    try {
      // Use environment variable for API URL
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message regardless of whether email exists (security)
        setMessage(data.message || 'If an account with that email exists, a password reset link has been sent.');
        setEmail(''); // Clear the form
      } else {
        setError(data.message || 'Failed to send reset link. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
        setLoading(false); // Stop loading
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        padding: 3,
        maxWidth: 400,
        margin: 'auto',
        marginTop: 4
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Forgot Password
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Enter your email address below, and we'll send you a link to reset your password.
        </Typography>

        <TextField
          label="Email Address"
          type="email"
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          disabled={loading || !!message} // Disable field after success or during load
        />

        {/* Display Success or Error Messages */}
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={loading || !!message} // Disable button after success message or during load
        >
          {/* Use CircularProgress when loading */}
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
        </Button>

        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Remember your password? <Link to="/login" style={{ textDecoration: 'none' }}>Log In</Link>
        </Typography>
      </Box>
    </Paper>
  );
}

export default ForgotPasswordPage;