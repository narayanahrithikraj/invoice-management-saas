import React, { useState } from 'react';
import { Button, TextField, Box, Typography, Paper, Alert } from '@mui/material';
import { Link } from 'react-router-dom'; // For back to login link

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(''); // Separate state for errors

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
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
        />

        {/* Display Success or Error Messages */}
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={!!message} // Disable button after success message
        >
          Send Reset Link
        </Button>

        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Remember your password? <Link to="/login" style={{ textDecoration: 'none' }}>Log In</Link>
        </Typography>
      </Box>
    </Paper>
  );
}

export default ForgotPasswordPage;