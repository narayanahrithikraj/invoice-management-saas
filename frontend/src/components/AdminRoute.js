import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function AdminRoute({ children }) {
  // Get both token and role from our context
  const { token, role } = useContext(AuthContext);

  if (token && role === 'admin') {
    // If user is logged in AND is an admin, show the page
    return children;
  } else if (token) {
    // If logged in but NOT an admin, send them back to Home
    return <Navigate to="/" replace />;
  } else {
    // If not logged in at all, send them to Login
    return <Navigate to="/login" replace />;
  }
}

export default AdminRoute;