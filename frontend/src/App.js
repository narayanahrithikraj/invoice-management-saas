import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import { AuthContext } from './context/AuthContext';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';

// Import Page Components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ClientsPage from './pages/ClientsPage';
import AdminPage from './pages/AdminPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage'; // <-- NEW
import ResetPasswordPage from './pages/ResetPasswordPage';   // <-- NEW

// Import Route Protectors
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Navigation Component (no changes needed here)
function Navigation() {
  // ... (Your existing Navigation code)
   const navigate = useNavigate();
  const { token, role, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            My Invoices
          </Link>
        </Typography>

        {token ? (
          <>
            <Button color="inherit" component={Link} to="/clients">Clients</Button>
            <Button color="inherit" component={Link} to="/subscriptions">Subscriptions</Button>
            {role === 'admin' && (
              <Button color="inherit" component={Link} to="/admin">Admin Panel</Button>
            )}
            <Button color="inherit" onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <>
            <Button color="inherit" component={Link} to="/login">Login</Button>
            <Button color="inherit" component={Link} to="/register">Register</Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}


function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Container component="main" sx={{ mt: 4 }}>
        <Routes>
          {/* Protected User Routes */}
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
          <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />

          {/* Protected Admin Route */}
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* --- NEW Forgot/Reset Password Routes --- */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          {/* Note the ':token' part - this is a URL parameter */}
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;