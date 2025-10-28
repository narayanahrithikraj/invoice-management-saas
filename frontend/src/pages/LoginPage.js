import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    Button, TextField, Box, Typography, Paper, Alert, Divider,
    ToggleButtonGroup, ToggleButton, CircularProgress // Import new components
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google'; // Import Google icon for consistency

function LoginPage() {
    // State for login method
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'

    // State for form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mobileNumber, setMobileNumber] = useState(''); // New state for phone
    const [otpCode, setOtpCode] = useState('');          // New state for OTP
    const [otpSent, setOtpSent] = useState(false);        // Track if OTP has been sent

    // State for messages and loading
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);        // Loading state for API calls

    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleMethodChange = (event, newMethod) => {
        if (newMethod !== null) { // Prevent unselecting all options
            setLoginMethod(newMethod);
            // Clear fields and messages when switching methods
            setEmail('');
            setPassword('');
            setMobileNumber('');
            setOtpCode('');
            setMessage('');
            setError('');
            setOtpSent(false);
            setLoading(false);
        }
    };

    // --- Handler for Email/Password Login ---
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                login(data.token, data.role, data.username);
                navigate('/');
            } else {
                setError(data.message || 'Login failed.');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // --- Handler for Sending OTP ---
    const handleSendOtp = async () => {
        setMessage('');
        setError('');
        if (!mobileNumber) {
            setError('Please enter your phone number.');
            return;
        }
        setLoading(true);
        try {
            // Assume +91 if not provided, adjust as needed
            const formattedNumber = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}`;
            const response = await fetch('http://localhost:5000/api/auth/phone/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobileNumber: formattedNumber }), // Send formatted number
            });
            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || 'OTP sent successfully.');
                setOtpSent(true); // Show OTP input field
            } else {
                setError(data.message || 'Failed to send OTP.');
            }
        } catch (err) {
            setError('Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // --- Handler for Verifying OTP ---
    const handleOtpSubmit = async (e) => {
        e.preventDefault(); // Prevent default if used in a form
        setMessage('');
        setError('');
        if (!otpCode) {
            setError('Please enter the OTP code.');
            return;
        }
        setLoading(true);
        try {
            const formattedNumber = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}`;
            const response = await fetch('http://localhost:5000/api/auth/phone/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobileNumber: formattedNumber, otpCode }),
            });
            const data = await response.json();
            if (response.ok) {
                login(data.token, data.role, data.username);
                navigate('/');
            } else {
                setError(data.message || 'OTP verification failed.');
            }
        } catch (err) {
            setError('OTP verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // --- Handler for Google Login ---
    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:5000/api/auth/google';
    };

    return (
        <Paper elevation={3} sx={{ padding: 3, maxWidth: 400, margin: 'auto', marginTop: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
                Login
            </Typography>

            {/* --- Method Toggle --- */}
            <ToggleButtonGroup
                color="primary"
                value={loginMethod}
                exclusive
                onChange={handleMethodChange}
                aria-label="Login Method"
                fullWidth
                sx={{ mb: 2 }}
            >
                <ToggleButton value="email">Email</ToggleButton>
                <ToggleButton value="phone">Phone OTP</ToggleButton>
            </ToggleButtonGroup>

            {/* --- Display Form based on Method --- */}
            {loginMethod === 'email' && (
                <Box component="form" onSubmit={handleEmailSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label="Email" type="email" variant="outlined" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
                    <TextField label="Password" type="password" variant="outlined" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
                    <Typography variant="body2" align="right" sx={{ marginTop: -1, marginBottom: 1 }}>
                        <Link to="/forgot-password" style={{ textDecoration: 'none' }}>Forgot Password?</Link>
                    </Typography>
                    {error && <Alert severity="error">{error}</Alert>}
                    <Button type="submit" variant="contained" color="primary" size="large" disabled={loading}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                    </Button>
                </Box>
            )}

            {loginMethod === 'phone' && (
                 <Box component="form" onSubmit={handleOtpSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Mobile Number (e.g., +91XXXXXXXXXX)"
                        variant="outlined"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        required
                        fullWidth
                        disabled={otpSent || loading} // Disable after sending OTP
                    />
                    <Button variant="contained" onClick={handleSendOtp} disabled={otpSent || loading || !mobileNumber}>
                        {loading ? <CircularProgress size={24} /> : (otpSent ? 'Resend OTP' : 'Send OTP')}
                    </Button>

                    {otpSent && (
                        <TextField
                            label="OTP Code"
                            variant="outlined"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            required
                            fullWidth
                            disabled={loading}
                            inputProps={{ maxLength: 6 }} // OTPs are usually 6 digits
                        />
                    )}

                    {/* Display messages/errors specific to OTP flow */}
                    {message && !error && <Alert severity="success">{message}</Alert>}
                    {error && <Alert severity="error">{error}</Alert>}

                    {otpSent && (
                        <Button type="submit" variant="contained" color="primary" size="large" disabled={loading || !otpCode}>
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP & Login'}
                        </Button>
                    )}
                </Box>
            )}

            {/* --- Google Sign In --- */}
            <Divider sx={{ my: 2 }}>OR</Divider>
            <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleGoogleLogin}
                startIcon={<GoogleIcon />} // Use MUI Google Icon
                disabled={loading}
            >
                Sign in with Google
            </Button>
        </Paper>
    );
}

export default LoginPage;