import React, { useState } from 'react';
import { Button, TextField, Box, Typography, Paper, Grid, Alert } from '@mui/material'; // Added Alert

function InvoiceForm({ onInvoiceCreated }) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState(''); // State for form errors

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); // Clear previous errors
    const token = localStorage.getItem('token');
    if (!token) {
        setFormError('Authentication error. Please log in again.');
        return;
    }

    const newInvoice = {
        clientName,
        clientEmail,
        description,
        amount: Number(amount) // Ensure amount is a number
    };

    // Basic validation
    if (!newInvoice.clientName || !newInvoice.description || !newInvoice.amount || isNaN(newInvoice.amount)) {
        setFormError('Please fill in all required fields with valid data.');
        return;
    }

    try {
        // Use environment variable for deployed URL, fallback to localhost for development
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

        const response = await fetch(`${apiUrl}/api/invoices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(newInvoice),
        });

        const data = await response.json();

        if (response.ok && data._id) {
            onInvoiceCreated(); // Callback to refresh the list in HomePage
            // Clear the form
            setClientName('');
            setClientEmail('');
            setDescription('');
            setAmount('');
        } else {
             // Use error message from backend if available
             throw new Error(data.message || 'Failed to create invoice.');
        }
    } catch (err) {
        console.error("Error creating invoice:", err);
        // Show the error message to the user
        setFormError(err.message || 'Failed to create invoice. Check network connection.');
    }
  };

  return (
    <Paper
      elevation={2} // Use slight elevation
      variant="outlined" // Add a border
      sx={{
        padding: 3,
        marginBottom: 4,
        borderRadius: 2,
        borderColor: 'divider' // Use theme's divider color for border
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        Create New Invoice
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Client Name"
              variant="outlined"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Client Email"
              type="email"
              variant="outlined"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              fullWidth
              // Email is not strictly required by model, but you can add 'required' prop here if you want
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              variant="outlined"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Amount (₹)" // Display Rupee symbol in label
              type="number"
              variant="outlined"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              fullWidth
              InputProps={{ inputProps: { step: "0.01", min: "0" } }} // Allow decimals, prevent negative
            />
          </Grid>
          <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'flex-end' }}> {/* Align button bottom */}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
            >
              Add Invoice
            </Button>
          </Grid>
          {/* Display form submission errors */}
          {formError && (
            <Grid item xs={12}>
              <Alert severity="error">{formError}</Alert>
            </Grid>
          )}
        </Grid>
      </Box>
    </Paper>
  );
}

export default InvoiceForm;
