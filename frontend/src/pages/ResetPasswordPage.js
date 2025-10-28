import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Import useParams
import { Button, TextField, Box, Typography, Paper, Alert } from '@mui/material';

function ResetPasswordPage() {
  const { token } = useParams(); // Get the token from the URL parameter
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Basic validation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!newPassword) {
        setError('New password cannot be empty.');
        return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Password reset successful! Redirecting to login...');
        setNewPassword(''); // Clear form
        setConfirmPassword('');
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password. The link may be invalid or expired.');
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
          Reset Password
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Enter your new password below.
        </Typography>

        <TextField
          label="New Password"
          type="password"
          variant="outlined"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Confirm New Password"
          type="password"
          variant="outlined"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
          disabled={!!message} // Disable button after success
        >
          Reset Password
        </Button>

         <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>Back to Login</Link>
        </Typography>
      </Box>
    </Paper>
  );
}

export default ResetPasswordPage;