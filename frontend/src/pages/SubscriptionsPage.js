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
  FormControl,
  Alert, // Import Alert
  CircularProgress // Import CircularProgress
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns'; // To format dates

function SubscriptionsPage() {
  // --- State ---
  const [subscriptions, setSubscriptions] = useState([]);
  const [clients, setClients] = useState([]); // For the dropdown
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [error, setError] = useState(''); // For fetch errors

  // --- Form State ---
  const [selectedClient, setSelectedClient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDueDate, setNextDueDate] = useState(new Date()); // Initialize with current date
  const [formError, setFormError] = useState(''); // For form submission errors
  const [formLoading, setFormLoading] = useState(false); // For form submission loading

  const token = localStorage.getItem('token'); // Get token once

  // --- 1. Fetch both clients and subscriptions on load ---
  const fetchData = () => {
    setLoadingClients(true);
    setLoadingSubs(true);
    setError('');
    if (!token) {
      setError("Not logged in.");
      setLoadingClients(false); setLoadingSubs(false);
      setClients([]); setSubscriptions([]);
      return;
    }
    console.log("SubscriptionsPage: Fetching data...");

    // Fetch clients
    fetch(`${process.env.REACT_APP_API_URL}/api/clients`, {
      headers: { 'x-auth-token': token }
    })
      .then(res => {
        console.log("SubscriptionsPage: Client fetch response status:", res.status);
        if (!res.ok) { throw new Error('Failed to fetch clients'); }
        return res.json();
      })
      .then(data => {
        console.log("SubscriptionsPage: Clients data received:", data);
        setClients(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("SubscriptionsPage: Error fetching clients:", err);
        setError(prev => prev + ' Failed to load clients.'); // Append error
        setClients([]);
      })
      .finally(() => setLoadingClients(false));

    // Fetch subscriptions
    fetch(`${process.env.REACT_APP_API_URL}/api/subscriptions`, {
      headers: { 'x-auth-token': token }
    })
      .then(res => {
        console.log("SubscriptionsPage: Subscription fetch response status:", res.status);
        if (!res.ok) { throw new Error('Failed to fetch subscriptions'); }
        return res.json();
      })
      .then(data => {
        console.log("SubscriptionsPage: Subscriptions data received:", data);
        setSubscriptions(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("SubscriptionsPage: Error fetching subscriptions:", err);
        setError(prev => prev + ' Failed to load subscriptions.'); // Append error
        setSubscriptions([]);
      })
      .finally(() => setLoadingSubs(false));
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on load

  // --- 2. Handle form submission ---
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true); // Start loading

    // Basic validation
    if (!selectedClient || !amount || !description || !nextDueDate) {
        setFormError('Please fill in all required fields.');
        setFormLoading(false);
        return;
    }
     const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        setFormError('Please enter a valid positive amount.');
        setFormLoading(false);
        return;
    }

    const newSubscription = {
      client: selectedClient,
      amount: numericAmount,
      description,
      frequency,
      nextDueDate // Should be a valid Date object
    };

    fetch(`${process.env.REACT_APP_API_URL}/api/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(newSubscription)
    })
      .then(res => {
          if (!res.ok) {
              return res.json().then(errData => {
                  throw new Error(errData.message || `HTTP error! status: ${res.status}`);
              });
          }
          return res.json();
      })
      .then(data => {
        if (data._id) {
          fetchData(); // Refresh both lists
          // Clear form
          setSelectedClient('');
          setAmount('');
          setDescription('');
          setFrequency('monthly');
          setNextDueDate(new Date());
        } else {
            setFormError('Failed to create subscription: Unexpected response.');
        }
      })
      .catch(err => {
          console.error("Error creating subscription:", err);
          setFormError(`Failed to create subscription: ${err.message}`);
      })
      .finally(() => {
          setFormLoading(false); // Stop loading
      });
  };

  // --- 3. Handle deleting a subscription ---
  const handleDelete = (id) => {
     if (!window.confirm('Are you sure you want to delete this subscription? This cannot be undone.')) {
        return;
    }
    fetch(`${process.env.REACT_APP_API_URL}/api/subscriptions/${id}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token }
    })
      .then(res => {
          if (!res.ok) {
              return res.json().then(errData => {
                  throw new Error(errData.message || `HTTP error! status: ${res.status}`);
              });
          }
          return res.json();
      })
      .then(data => {
        console.log(data.message);
        fetchData(); // Refresh the list
      })
      .catch(err => {
          console.error("Error deleting subscription:", err);
          setError(`Failed to delete subscription: ${err.message}`); // Show error related to list
      });
  };

  return (
    // LocalizationProvider needed for DatePicker
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Manage Subscriptions
        </Typography>

        {/* --- Subscription Creation Form --- */}
        <Paper elevation={2} variant="outlined" sx={{ padding: 3, marginBottom: 4, borderRadius: 2, borderColor: 'divider' }}>
          <Typography variant="h5" gutterBottom>Add New Subscription</Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!selectedClient && clients.length === 0 && !loadingClients}>
                  <InputLabel id="client-select-label">Client</InputLabel>
                  <Select
                    labelId="client-select-label"
                    value={selectedClient}
                    label="Client"
                    onChange={(e) => setSelectedClient(e.target.value)}
                    disabled={loadingClients || clients.length === 0}
                  >
                    {loadingClients ? (
                       <MenuItem disabled><em>Loading clients...</em></MenuItem>
                    ) : clients.length === 0 ? (
                       <MenuItem disabled><em>No clients found. Add one on the Clients page.</em></MenuItem>
                    ) : (
                       clients.map(client => (
                          <MenuItem key={client._id} value={client._id}>
                            {client.name} ({client.email})
                          </MenuItem>
                       ))
                    )}
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
                  InputProps={{ inputProps: { step: "0.01", min: "0.01" } }} // Min amount > 0
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description (e.g., Monthly Hosting Fee)"
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
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                  disablePast // Prevent selecting past dates for the first invoice
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={formLoading || loadingClients || clients.length === 0} // Disable if loading or no clients
                >
                    {formLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Subscription'}
                </Button>
              </Grid>
              {/* Display form submission errors */}
              {formError && <Grid item xs={12}><Alert severity="error">{formError}</Alert></Grid>}
            </Grid>
          </Box>
        </Paper>

        {/* --- Subscription List --- */}
        <Typography variant="h5" gutterBottom>My Subscriptions</Typography>

         {/* Display loading indicator */}
        {loadingSubs && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}

        {/* Display fetch error message */}
        {error && !loadingSubs && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}


        {!loadingSubs && !error && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {subscriptions.length === 0 ? (
                <Typography>No active subscriptions found. Add one above!</Typography>
            ) : (
                subscriptions.map(sub => (
                <Card key={sub._id} elevation={2} variant="outlined" sx={{ borderColor: 'divider', borderRadius: 2 }}>
                    <CardContent>
                    <Typography variant="h6" component="div">
                        {sub.description}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                        Client: {sub.client ? sub.client.name : <i>Client Deleted</i>}
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 1.5, fontWeight: 'medium' }}>
                        ₹{sub.amount.toFixed(2)} / {sub.frequency}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Next Bill Date: {format(new Date(sub.nextDueDate), 'dd MMM, yyyy')}
                    </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', borderTop: '1px solid #eee', p: 2 }}>
                    {/* Optional: Add an Edit button here later */}
                    <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDelete(sub._id)}
                    >
                        Delete Subscription
                    </Button>
                    </CardActions>
                </Card>
                ))
            )}
            </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
}

export default SubscriptionsPage;