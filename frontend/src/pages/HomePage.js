import React, { useState, useEffect, useContext } from 'react';
import InvoiceForm from '../InvoiceForm'; // Correct path relative to src/pages
import InvoiceList from '../InvoiceList'; // Correct path relative to src/pages
import { Typography, Box, Paper, Divider } from '@mui/material'; // Removed unused Button, Input, Alert, CircularProgress
import { AuthContext } from '../context/AuthContext';
// Removed CloudUploadIcon and InvoiceReviewModal imports

function HomePage() {
  const [invoices, setInvoices] = useState([]);
  const token = localStorage.getItem('token');
  const { username } = useContext(AuthContext);

  // Fetch Invoices (Manually created)
  const getInvoices = () => {
     if (!token) { setInvoices([]); return; }
     fetch('http://localhost:5000/api/invoices', {
         method: 'GET',
         headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
     })
        .then(res => {
            if (!res.ok) {
                return res.json().then(errData => { throw new Error(errData.message || `HTTP error! status: ${res.status}`); });
            }
            return res.json();
        })
        .then(data => setInvoices(Array.isArray(data) ? data : []))
        .catch(err => { console.error('Error fetching invoices:', err.message); setInvoices([]); });
  };

  useEffect(() => {
    getInvoices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Re-fetch if token changes


  // Removed handleFileChange, handleFileUpload, handleSaveVerifiedInvoice functions
  // Removed state related to file upload and modal (selectedFile, uploadMessage, uploadError, isUploading, isReviewModalOpen, textToReview)

  return (
    <Box sx={{ paddingBottom: 4 }}>

      {/* Introduction Section */}
      <Paper elevation={0} sx={{ padding: 3, marginBottom: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome {username || 'User'}, to Your Invoice Dashboard 👋
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Here you can create new invoices manually or manage clients and subscriptions.
        </Typography>
      </Paper>

      {/* Manual Invoice Creation Form */}
      <InvoiceForm onInvoiceCreated={getInvoices} />

      {/* Removed the "OR" Divider and the entire "Upload Existing Invoice" Paper section */}

      <Divider sx={{ my: 4 }} /> {/* Keep this divider before the list */}

      {/* Invoice List */}
      <InvoiceList invoices={invoices} onListChange={getInvoices} />

      {/* Removed the InvoiceReviewModal component instance */}

    </Box>
  );
}

export default HomePage;