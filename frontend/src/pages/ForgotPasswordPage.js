import React, { useState } from 'react';
import { Button, TextField, Box, Typography, Paper, Alert } from '@mui/material';
import { Link } from 'react-router-dom';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError(''); setLoading(true); // Start loading

    try {
      // Use environment variable for API URL
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'If an account exists, email sent.');
        setEmail('');
      } else {
        setError(data.message || 'Failed to send reset link.');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
        setLoading(false); // Stop loading
    }
  };

  return (
    <Paper elevation={3} sx={{ padding: 3, maxWidth: 400, margin: 'auto', marginTop: 4 }}>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>Forgot Password</Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>Enter email to receive reset link.</Typography>
        <TextField label="Email Address" type="email" variant="outlined" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth disabled={loading || !!message}/>
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" variant="contained" color="primary" size="large" disabled={loading || !!message}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
        </Button>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>Remember password? <Link to="/login" style={{ textDecoration: 'none' }}>Log In</Link></Typography>
      </Box>
    </Paper>
  );
}
export default ForgotPasswordPage;