import React, { useState, useEffect, useContext } from 'react';
import InvoiceForm from '../InvoiceForm';
import InvoiceList from '../InvoiceList';
import { Typography, Box, Paper, Divider, Button, Input, Alert, CircularProgress } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
// import InvoiceReviewModal from '../components/InvoiceReviewModal'; // Keep commented out as OCR was removed

function HomePage() {
  const [invoices, setInvoices] = useState([]);
  const token = localStorage.getItem('token');
  const { username } = useContext(AuthContext);

  // Removed state related to file upload and modal

  // Fetch Invoices
  const getInvoices = () => {
     if (!token) { setInvoices([]); return; }
     // Use environment variable for API URL
     fetch(`${process.env.REACT_APP_API_URL}/api/invoices`, {
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
  }, [token]);

  // Removed handleFileChange, handleFileUpload, handleSaveVerifiedInvoice functions

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

      {/* Removed Upload Section */}
      {/* <Divider sx={{ my: 4 }}>OR</Divider> */}
      {/* <Paper...> ... </Paper> */}


      <Divider sx={{ my: 4 }} />

      {/* --- Invoice List --- */}
      <InvoiceList invoices={invoices} onListChange={getInvoices} />

      {/* Removed InvoiceReviewModal */}
      {/* <InvoiceReviewModal ... /> */}

    </Box>
  );
}

export default HomePage;