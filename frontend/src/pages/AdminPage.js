import React, { useState, useEffect } from 'react';
import { Typography, Box, Paper, Grid, Alert, CardActionArea } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// --- StatCard component ---
function StatCard({ title, value, color, isCurrency = false, linkTo = null }) {
  let displayValue = value;
  if (typeof value === 'number') {
    displayValue = isCurrency ? `₹${value.toFixed(2)}` : value.toString();
  }

  const cardContent = (
    <Box sx={{ padding: { xs: 2, sm: 2 }, textAlign: 'center' }}>
      <Typography variant="caption" color={color || 'textSecondary'} gutterBottom sx={{ fontWeight: 'medium', display: 'block' }}>
        {title}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        {displayValue}
      </Typography>
    </Box>
  );

  return (
    <Paper
      elevation={1}
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 2,
        borderColor: 'divider' // Use theme's divider color for border
      }}
    >
      {linkTo ? (
        <CardActionArea component={RouterLink} to={linkTo} sx={{ height: '100%', borderRadius: 2 }}>
          {cardContent}
        </CardActionArea>
      ) : (
        cardContent
      )}
    </Paper>
  );
}
// --- END StatCard ---


function AdminPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- Fetch Data Logic ---
    const fetchData = async () => {
      setLoading(true); setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication error. Please log in again.');
        setLoading(false); return;
      }
      try {
        const response = await fetch('http://localhost:5000/api/admin/dashboard-data', { headers: { 'x-auth-token': token } });
        const responseData = await response.json();
        if (response.ok) {
          setData(responseData);
        } else {
          setError(responseData.message || 'Failed to fetch admin data.');
        }
      } catch (err) {
        setError('An error occurred while fetching data.');
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>

      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
        Admin Dashboard
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: 'lg' }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><Typography>Loading dashboard data...</Typography></Box>
      ) : data ? (
        // --- Main Grid Container ---
        <Grid
          container
          spacing={3}
          sx={{
            maxWidth: 'lg',
            width: '100%',
            justifyContent: 'center'
          }}
        >

          {/* 1. Line Chart (Left Side) */}
          <Grid item xs={12} sm={7} md={6} lg={5}>
             {/* --- ADJUSTED HEIGHT --- */}
            <Paper elevation={1} variant="outlined" sx={{ padding: { xs: 1, sm: 2 }, height: 350, borderRadius: 2, borderColor: 'divider' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ pl: 2, pt:1, fontWeight: 'medium' }}>
                Monthly Paid Revenue
              </Typography>
               {/* --- ADJUSTED HEIGHT --- */}
              <ResponsiveContainer width="100%" height={300}> {/* Set specific pixel height */}
                <LineChart data={data.monthlyRevenue} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis tickFormatter={(value) => `₹${value}`} width={50} fontSize={10}/>
                  <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                  <Legend wrapperStyle={{ fontSize: '10px' }}/>
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 6 }} dot={{r: 3}}/>
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* 2. Stat Cards Section (Right Side - 2x2 Grid) */}
          <Grid item xs={12} sm={5} md={6} lg={5}>
            <Grid container spacing={3} sx={{ height: '100%' }}>
              <Grid item xs={6}> {/* Top-left card */}
                <StatCard title="Total Revenue" value={data.totalRevenue} color="success.main" isCurrency={true} />
              </Grid>
              <Grid item xs={6}> {/* Top-right card */}
                <StatCard title="Total Clients" value={data.totalClients} linkTo="/clients" />
              </Grid>
              <Grid item xs={6}> {/* Bottom-left card */}
                <StatCard title="Pending Revenue" value={data.pendingRevenue} color="warning.main" isCurrency={true} />
              </Grid>
              <Grid item xs={6}> {/* Bottom-right card */}
                <StatCard title="Total Users" value={data.totalUsers} linkTo="#" />
              </Grid>
            </Grid>
          </Grid>

        </Grid>
      ) : (
        !error && <Typography sx={{ textAlign: 'center', mt: 4 }}>No dashboard data available.</Typography>
      )}
    </Box>
  );
}

export default AdminPage;