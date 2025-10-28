import React, { useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');
    const username = searchParams.get('username');
    const error = searchParams.get('error'); // Check for backend errors

    if (error) {
      console.error("Authentication Error from backend:", error);
      // Redirect to login page, maybe pass error message
      navigate('/login?error=google_auth_failed');
    } else if (token && role && username) {
      // Success: Save token/role via context and redirect home
      console.log("Auth Callback: Token and role received. Logging in.");
      login(token, role);
      navigate('/');
    } else {
      // Unexpected: Missing token or role
      console.error("Auth Callback: Missing token or role in URL parameters.");
      navigate('/login?error=callback_failed');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Show a loading indicator while processing
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>Processing authentication...</Typography>
    </Box>
  );
}

export default AuthCallbackPage;