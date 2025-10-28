import React, { useState, useEffect } from 'react';
import {
  Typography, Paper, Box, Grid, TextField, Button,
  Card, CardContent, CardActions, CircularProgress, Alert
} from '@mui/material';

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');
  const token = localStorage.getItem('token');

  const getClients = () => {
    setLoading(true); setError('');
    if (!token) { setClients([]); setLoading(false); setError('Not logged in.'); return; }
    // Use environment variable for API URL
    fetch(`${process.env.REACT_APP_API_URL}/api/clients`, {
      headers: { 'x-auth-token': token }
    })
      .then(res => {
        if (!res.ok) { return res.json().then(errData => { throw new Error(errData.message || `HTTP error! status: ${res.status}`); }); }
        return res.json();
      })
      .then(data => setClients(Array.isArray(data) ? data : []))
      .catch(err => { console.error("Error fetching clients:", err.message); setError(`Failed to load clients: ${err.message}`); setClients([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { getClients(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    const newClient = { name, email, phone };
    // Use environment variable for API URL
    fetch(`${process.env.REACT_APP_API_URL}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(newClient)
    })
      .then(res => {
          if (!res.ok) { return res.json().then(errData => { throw new Error(errData.message || `HTTP error! status: ${res.status}`); }); }
          return res.json();
      })
      .then(data => {
        if (data._id) { getClients(); setName(''); setEmail(''); setPhone(''); }
        else { setFormError('Failed to create client. Unexpected response.'); }
      })
      .catch(err => { console.error("Error creating client:", err.message); setFormError(`Failed to create client: ${err.message}`); });
  };

  const handleDelete = (id) => {
     // Use environment variable for API URL
    fetch(`${process.env.REACT_APP_API_URL}/api/clients/${id}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token }
    })
      .then(res => {
          if (!res.ok) { return res.json().then(errData => { throw new Error(errData.message || `HTTP error! status: ${res.status}`); }); }
          return res.json();
      })
      .then(data => { console.log(data.message); getClients(); })
      .catch(err => { console.error("Error deleting client:", err.message); setError(`Failed to delete client: ${err.message}`); });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Manage Clients</Typography>
      <Paper elevation={3} sx={{ padding: 3, marginBottom: 4 }}>
        <Typography variant="h5" gutterBottom>Add New Client</Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField label="Client Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Client Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Phone (Optional)" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth /></Grid>
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}><Button type="submit" variant="contained" size="large" fullWidth>Add Client</Button></Grid>
            {formError && <Grid item xs={12}><Alert severity="error">{formError}</Alert></Grid>}
          </Grid>
        </Box>
      </Paper>

      <Typography variant="h5" gutterBottom>My Clients</Typography>
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
      {error && !loading && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
      {!loading && !error && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {clients.length === 0 ? (<Typography>No clients found. Add one above!</Typography>) : (
            clients.map(client => (
              <Card key={client._id} elevation={2}>
                <CardContent>
                  <Typography variant="h6">{client.name}</Typography>
                  <Typography variant="body2" color="textSecondary">{client.email}</Typography>
                  {client.phone && <Typography variant="body2" color="textSecondary">{client.phone}</Typography>}
                </CardContent>
                <CardActions>
                  <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(client._id)}>Delete</Button>
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