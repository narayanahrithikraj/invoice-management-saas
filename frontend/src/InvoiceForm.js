import React, { useState } from 'react';

// --- NEW MUI IMPORTS ---
import { Button, TextField, Box, Typography, Paper, Grid } from '@mui/material';

function InvoiceForm({ onInvoiceCreated }) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const newInvoice = { clientName, clientEmail, description, amount };
    const token = localStorage.getItem('token'); 

    fetch('http://localhost:5000/api/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token 
      },
      body: JSON.stringify(newInvoice),
    })
      .then(res => res.json())
      .then(data => {
        if(data._id) { 
          onInvoiceCreated(); 
        } else {
          console.error("Error creating invoice:", data.message);
        }
        
        // Clear the form
        setClientName('');
        setClientEmail('');
        setDescription('');
        setAmount('');
      })
      .catch(err => console.error("Fetch error:", err));
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        padding: 3, 
        marginBottom: 4 // Add space below the form
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        Create New Invoice
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        {/* Use Grid for layout */}
        <Grid container spacing={2}>
          {/* --- UPDATED: Removed 'item' prop --- */}
          <Grid xs={12} sm={6}>
            <TextField
              label="Client Name"
              variant="outlined"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              fullWidth
            />
          </Grid>
          {/* --- UPDATED: Removed 'item' prop --- */}
          <Grid xs={12} sm={6}>
            <TextField
              label="Client Email"
              type="email"
              variant="outlined"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              required
              fullWidth
            />
          </Grid>
          {/* --- UPDATED: Removed 'item' prop --- */}
          <Grid xs={12}>
            <TextField
              label="Description"
              variant="outlined"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              fullWidth
            />
          </Grid>
          {/* --- UPDATED: Removed 'item' prop --- */}
          <Grid xs={12} sm={6}>
            <TextField
              label="Amount ($)"
              type="number"
              variant="outlined"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              fullWidth
            />
          </Grid>
          {/* --- UPDATED: Removed 'item' prop --- */}
          <Grid xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
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
        </Grid>
      </Box>
    </Paper>
  );
}

export default InvoiceForm;