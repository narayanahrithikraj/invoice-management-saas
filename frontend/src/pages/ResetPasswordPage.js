import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, TextField, Box, Typography, Paper, Alert, CircularProgress } from '@mui/material'; // Added CircularProgress

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!newPassword) { setError('Password cannot be empty.'); return; }
    setLoading(true); // Start loading

    try {
      // Use environment variable for API URL
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'Password reset successful! Redirecting...');
        setNewPassword(''); setConfirmPassword('');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Failed to reset password.');
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
        <Typography variant="h4" component="h1" gutterBottom>Reset Password</Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>Enter your new password.</Typography>
        <TextField label="New Password" type="password" variant="outlined" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required fullWidth disabled={loading || !!message} />
        <TextField label="Confirm New Password" type="password" variant="outlined" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required fullWidth disabled={loading || !!message}/>
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" variant="contained" color="primary" size="large" disabled={loading || !!message}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
        </Button>
         <Typography variant="body2" align="center" sx={{ mt: 2 }}><Link to="/login" style={{ textDecoration: 'none' }}>Back to Login</Link></Typography>
      </Box>
    </Paper>
  );
}
export default ResetPasswordPage;