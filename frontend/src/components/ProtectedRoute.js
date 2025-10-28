import React, { useContext } from 'react'; // <-- Import useContext
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // <-- Import our context

function ProtectedRoute({ children }) {
  // --- KEY CHANGE ---
  // Get the token from our context instead of localStorage
  const { token } = useContext(AuthContext); 
  // --- END KEY CHANGE ---

  if (token) {
    // If token exists, render the component
    return children;
  } else {
    // If no token, redirect them to the /login page
    return <Navigate to="/login" replace />;
  }
}

export default ProtectedRoute;