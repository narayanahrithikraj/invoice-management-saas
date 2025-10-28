import React, { createContext, useState } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  // --- NEW: Add username state ---
  const [username, setUsername] = useState(localStorage.getItem('username')); 

  // --- UPDATED: login function accepts and saves username ---
  const login = (newToken, newRole, newUsername) => { 
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);
    localStorage.setItem('username', newUsername); // <-- Save username
    setToken(newToken);
    setRole(newRole);
    setUsername(newUsername); // <-- Set username state
  };

  // --- UPDATED: logout function clears username ---
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username'); // <-- Clear username
    setToken(null);
    setRole(null);
    setUsername(null); // <-- Clear username state
  };

  // --- UPDATED: Provide username in context value ---
  return (
    <AuthContext.Provider value={{ token, role, username, login, logout }}> 
      {children}
    </AuthContext.Provider>
  );
};