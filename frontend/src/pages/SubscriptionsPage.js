import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns'; // To format dates

function SubscriptionsPage() {
  // --- State ---
  const [subscriptions, setSubscriptions] = useState([]);
  const [clients, setClients] = useState([]); // For the dropdown

  // --- Form State ---
  const [selectedClient, setSelectedClient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDueDate, setNextDueDate] = useState(new Date());

  const token = localStorage.getItem('token'); // Get token once

  // --- 1. Fetch both clients and subscriptions on load ---
  const fetchData = () => {
    // Fetch clients
    fetch('http://localhost:5000/api/clients', {
      headers: { 'x-auth-token': token }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClients(data);
        }
      })
      .catch(err => console.error("Error fetching clients:", err));

    // Fetch subscriptions
    fetch('http://localhost:5000/api/subscriptions', {
      headers: { 'x-auth-token': token }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSubscriptions(data);
        }
      })
      .catch(err => console.error("Error fetching subscriptions:", err));
  };

  useEffect(() => {
    fetchData();
  }, []); // Empty array means run once on load

  // --- 2. Handle form submission ---
  const handleSubmit = (e) => {
    e.preventDefault();
    const newSubscription = {
      client: selectedClient,
      amount,
      description,
      frequency,
      nextDueDate
    };

    fetch('http://localhost:5000/api/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(newSubscription)
    })
      .then(res => res.json())
      .then(data => {
        if (data._id) {
          fetchData(); // Refresh both lists
          // Clear form
          setSelectedClient('');
          setAmount('');
          setDescription('');
          setFrequency('monthly');
          setNextDueDate(new Date());
        }
      })
      .catch(err => console.error("Error creating subscription:", err));
  };

  // --- 3. Handle deleting a subscription ---
  const handleDelete = (id) => {
    fetch(`http://localhost:5000/api/subscriptions/${id}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token }
    })
      .then(res => res.json())
      .then(data => {
        console.log(data.message);
        fetchData(); // Refresh the list
      })
      .catch(err => console.error("Error deleting subscription:", err));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Manage Subscriptions
        </Typography>

        {/* --- Subscription Creation Form --- */}
        <Paper elevation={3} sx={{ padding: 3, marginBottom: 4 }}>
          <Typography variant="h5" gutterBottom>Add New Subscription</Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="client-select-label">Client</InputLabel>
                  <Select
                    labelId="client-select-label"
                    value={selectedClient}
                    label="Client"
                    onChange={(e) => setSelectedClient(e.target.value)}
                  >
                    {clients.map(client => (
                      <MenuItem key={client._id} value={client._id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Amount (₹)"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description (e.g., Monthly Hosting)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="frequency-select-label">Frequency</InputLabel>
                  <Select
                    labelId="frequency-select-label"
                    value={frequency}
                    label="Frequency"
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="First Invoice Date"
                  value={nextDueDate}
                  onChange={(newValue) => setNextDueDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" size="large" fullWidth>
                  Create Subscription
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* --- Subscription List --- */}
        <Typography variant="h5" gutterBottom>My Subscriptions</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {subscriptions.length === 0 ? (
            <Typography>No subscriptions found. Add one above!</Typography>
          ) : (
            subscriptions.map(sub => (
              <Card key={sub._id} elevation={2}>
                <CardContent>
                  <Typography variant="h6">{sub.description}</Typography>
                  <Typography variant="body1">
                    Client: {sub.client ? sub.client.name : 'Client Deleted'}
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    ₹{sub.amount} / {sub.frequency}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Next Bill Date: {format(new Date(sub.nextDueDate), 'dd MMM, yyyy')}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleDelete(sub._id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            ))
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
}

export default SubscriptionsPage;