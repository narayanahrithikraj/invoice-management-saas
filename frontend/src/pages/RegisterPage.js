import React, { useState, useContext } from 'react'; // Import useContext if needed later
import { useNavigate, Link } from 'react-router-dom';
// import { AuthContext } from '../context/AuthContext'; // Not needed directly here yet
import {
    Button, TextField, Box, Typography, Paper, Alert, Divider,
    FormControl, InputLabel, Select, MenuItem,
    ToggleButtonGroup, ToggleButton, CircularProgress // Import new components
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

function RegisterPage() {
    // State for registration method
    const [registerMethod, setRegisterMethod] = useState('email'); // 'email' or 'phone'

    // State for form fields
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [gender, setGender] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // State for messages and loading
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    // const { login } = useContext(AuthContext); // Get login if needed for OTP registration success

     const handleMethodChange = (event, newMethod) => {
        if (newMethod !== null) {
            setRegisterMethod(newMethod);
            // Clear fields and messages
            setUsername(''); setEmail(''); setPassword(''); setMobileNumber(''); setGender('');
            setOtpCode(''); setMessage(''); setError(''); setOtpSent(false); setLoading(false);
        }
    };

    // --- Handler for Email Registration ---
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); setError(''); setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, mobileNumber: registerMethod === 'email' ? mobileNumber : undefined, gender }), // Conditionally send mobile
            });
            const data = await response.json();
            if (response.ok) {
                setMessage('Registration successful! Redirecting to login...');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(data.message || 'Registration failed.');
            }
        } catch (err) {
            setError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // --- Handler for Sending OTP (Same as Login Page) ---
    const handleSendOtp = async () => {
        setMessage(''); setError('');
        if (!mobileNumber) { setError('Please enter your phone number.'); return; }
        setLoading(true);
        try {
            const formattedNumber = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}`;
            const response = await fetch('http://localhost:5000/api/auth/phone/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobileNumber: formattedNumber }),
            });
            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || 'OTP sent.'); setOtpSent(true);
            } else {
                setError(data.message || 'Failed to send OTP.');
            }
        } catch (err) { setError('Failed to send OTP.'); }
        finally { setLoading(false); }
    };

    // --- Handler for Verifying OTP & Registering ---
    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); setError('');
        if (!otpCode) { setError('Please enter OTP.'); return; }
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
                // If verify-otp registers the user and returns token:
                // login(data.token, data.role, data.username);
                // navigate('/');
                // OR just redirect to login:
                 setMessage('Phone verified successfully! Redirecting to login...');
                 setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(data.message || 'OTP verification failed.');
            }
        } catch (err) { setError('OTP verification failed.'); }
        finally { setLoading(false); }
    };

    // --- Handler for Google Login ---
     const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:5000/api/auth/google';
    };

    return (
        <Paper elevation={3} sx={{ padding: 3, maxWidth: 400, margin: 'auto', marginTop: 4 }}>
             <Typography variant="h4" component="h1" gutterBottom align="center">
                Register
            </Typography>

             {/* --- Method Toggle --- */}
            <ToggleButtonGroup
                color="primary" value={registerMethod} exclusive onChange={handleMethodChange}
                aria-label="Register Method" fullWidth sx={{ mb: 2 }} >
                <ToggleButton value="email">Email & Password</ToggleButton>
                <ToggleButton value="phone">Phone OTP</ToggleButton>
            </ToggleButtonGroup>

            {/* --- Display Form based on Method --- */}
            {registerMethod === 'email' && (
                <Box component="form" onSubmit={handleEmailSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label="Username" variant="outlined" value={username} onChange={(e) => setUsername(e.target.value)} required fullWidth disabled={loading}/>
                    <TextField label="Email" type="email" variant="outlined" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth disabled={loading}/>
                    <TextField label="Password" type="password" variant="outlined" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth disabled={loading}/>
                    <TextField label="Mobile Number (Optional)" variant="outlined" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} fullWidth disabled={loading}/>
                    <FormControl fullWidth disabled={loading}>
                        <InputLabel id="gender-select-label">Gender (Optional)</InputLabel>
                        <Select labelId="gender-select-label" value={gender} label="Gender (Optional)" onChange={(e) => setGender(e.target.value)}>
                            <MenuItem value=""><em>None</em></MenuItem>
                            <MenuItem value="male">Male</MenuItem>
                            <MenuItem value="female">Female</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                            <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                        </Select>
                    </FormControl>
                    {message && !error && <Alert severity="success">{message}</Alert>}
                    {error && <Alert severity="error">{error}</Alert>}
                    <Button type="submit" variant="contained" color="primary" size="large" disabled={loading}>
                         {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
                    </Button>
                </Box>
            )}

            {registerMethod === 'phone' && (
                <Box component="form" onSubmit={handleOtpSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label="Mobile Number (e.g., +91XXXXXXXXXX)" variant="outlined" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required fullWidth disabled={otpSent || loading}/>
                    <Button variant="contained" onClick={handleSendOtp} disabled={otpSent || loading || !mobileNumber}>
                        {loading ? <CircularProgress size={24} /> : (otpSent ? 'Resend OTP' : 'Send OTP')}
                    </Button>
                    {otpSent && (
                        <TextField label="OTP Code" variant="outlined" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required fullWidth disabled={loading} inputProps={{ maxLength: 6 }}/>
                    )}
                    {message && !error && <Alert severity="success">{message}</Alert>}
                    {error && <Alert severity="error">{error}</Alert>}
                    {otpSent && (
                        <Button type="submit" variant="contained" color="primary" size="large" disabled={loading || !otpCode}>
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP & Register'}
                        </Button>
                    )}
                </Box>
            )}

            {/* --- Google Sign Up --- */}
            <Divider sx={{ my: 2 }}>OR</Divider>
            <Button
                variant="outlined" size="large" fullWidth
                onClick={handleGoogleLogin} startIcon={<GoogleIcon />} disabled={loading} >
                Sign up with Google
            </Button>

            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                Already have an account? <Link to="/login" style={{ textDecoration: 'none' }}>Log In</Link>
            </Typography>
        </Paper>
    );
}

export default RegisterPage;