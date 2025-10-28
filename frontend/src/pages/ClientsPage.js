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
  CircularProgress,
  Alert // <-- Alert is now imported
} from '@mui/material';

function ClientsPage() {
  // State for the list of clients and loading
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true); // Start in loading state
  const [error, setError] = useState('');     // State for fetch errors

  // State for the form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState(''); // State for form submission errors

  const token = localStorage.getItem('token'); // Get token once

  // --- 1. Get all clients with error handling ---
  const getClients = () => {
    setLoading(true); // Set loading before fetch
    setError('');     // Clear previous errors
    // Prevent fetch if token is missing
    if (!token) {
        setClients([]);
        setLoading(false);
        setError('Not logged in.'); // Set an error if not logged in
        return;
    }
    fetch('http://localhost:5000/api/clients', {
      headers: { 'x-auth-token': token }
    })
      .then(res => {
        if (!res.ok) {
          // Handle non-OK responses (like 401 Unauthorized)
          return res.json().then(errData => {
            throw new Error(errData.message || `HTTP error! status: ${res.status}`);
          });
        }
        return res.json();
      })
      .then(data => {
        // Success! Ensure data is an array.
        setClients(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Error fetching clients:", err.message);
        setError(`Failed to load clients: ${err.message}`); // Set fetch error state
        setClients([]); // Set clients to an empty array on error
      })
      .finally(() => {
        setLoading(false); // Set loading to false after fetch completes (success or fail)
      });
  };

  // Run getClients once when the page loads
  useEffect(() => {
    getClients();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures it runs only once on mount

  // --- 2. Handle form submission to create a client ---
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(''); // Clear previous form errors
    const newClient = { name, email, phone };

    fetch('http://localhost:5000/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(newClient)
    })
      .then(res => {
          if (!res.ok) { // Check if response is not OK
              return res.json().then(errData => { // Try to parse error message
                  throw new Error(errData.message || `HTTP error! status: ${res.status}`);
              });
          }
          return res.json();
      })
      .then(data => {
        if (data._id) {
          // Add new client to the list and clear form
          getClients(); // Simple way to refresh
          setName('');
          setEmail('');
          setPhone('');
        } else {
            // Should be caught by the !res.ok check, but as a fallback
            setFormError('Failed to create client. Unexpected response.');
        }
      })
      .catch(err => {
          console.error("Error creating client:", err.message);
          setFormError(`Failed to create client: ${err.message}`); // Show error on form
      });
  };

  // --- 3. Handle deleting a client ---
  const handleDelete = (id) => {
    fetch(`http://localhost:5000/api/clients/${id}`, {
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
        getClients(); // Refresh the list
      })
      .catch(err => {
          console.error("Error deleting client:", err.message);
          setError(`Failed to delete client: ${err.message}`); // Show error related to list
      });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Manage Clients
      </Typography>

      {/* --- Client Creation Form --- */}
      <Paper elevation={3} sx={{ padding: 3, marginBottom: 4 }}>
        <Typography variant="h5" gutterBottom>Add New Client</Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Client Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Client Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone (Optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button type="submit" variant="contained" size="large" fullWidth>
                Add Client
              </Button>
            </Grid>
             {/* Display form submission errors */}
             {formError && <Grid item xs={12}><Alert severity="error">{formError}</Alert></Grid>}
          </Grid>
        </Box>
      </Paper>

      {/* --- Client List --- */}
      <Typography variant="h5" gutterBottom>My Clients</Typography>

      {/* Display loading indicator */}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}

      {/* Display fetch error message */}
      {error && !loading && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      {/* Display client list or 'no clients' message */}
      {!loading && !error && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {clients.length === 0 ? (
            <Typography>No clients found. Add one above!</Typography>
          ) : (
            clients.map(client => (
              <Card key={client._id} elevation={2}>
                <CardContent>
                  <Typography variant="h6">{client.name}</Typography>
                  <Typography variant="body2" color="textSecondary">{client.email}</Typography>
                  {client.phone && <Typography variant="body2" color="textSecondary">{client.phone}</Typography>}
                </CardContent>
                <CardActions>
                  {/* We can add an "Edit" button here later */}
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleDelete(client._id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            ))
          )}
        </Box>
      )}
    </Box>
  );
}

export default ClientsPage;