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
        // Use environment variable for API URL
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'; // Fallback for safety

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
             throw new Error(data.message || 'Failed to create invoice.');
        }
    } catch (err) {
        console.error("Error creating invoice:", err);
        setFormError(`Failed to create invoice: ${err.message}`); // Show error on form
    }
  };

  return (
    <Paper
      elevation={2} // Use slight elevation or outlined
      variant="outlined"
      sx={{
        padding: 3,
        marginBottom: 4,
        borderRadius: 2,
        borderColor: 'divider'
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
              // Consider making email required based on your needs
              fullWidth
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
              label="Amount (₹)" // Display Rupee symbol here
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
          {formError && <Grid item xs={12}><Alert severity="error">{formError}</Alert></Grid>}
        </Grid>
      </Box>
    </Paper>
  );
}

export default InvoiceForm;