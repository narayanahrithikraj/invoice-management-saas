import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardActions, Typography, Button, Box, Chip, Alert } from '@mui/material';
import jsPDF from 'jspdf';

// Make sure to use the environment variable for all API calls
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function InvoiceList({ invoices, onListChange }) {
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [paymentError, setPaymentError] = useState(''); // State for payment errors

  // Fetch Razorpay Key ID when component mounts
  useEffect(() => {
    const fetchKeyId = async () => {
      try {
        const res = await fetch(`${API_URL}/api/payments/get-key-id`); // Use API_URL
        if (!res.ok) throw new Error('Failed to fetch payment key');
        const data = await res.json();
        setRazorpayKeyId(data.keyId);
      } catch (err) {
        console.error('Failed to fetch Razorpay key:', err);
        setPaymentError('Payment system unavailable.'); // Inform user
      }
    };
    fetchKeyId();
  }, []); // Empty dependency array means run once on mount


  // Function to handle initiating Razorpay payment
  const handlePayment = async (invoice) => {
    setPaymentError(''); // Clear previous errors
    const token = localStorage.getItem('token');
    if (!razorpayKeyId || !token) { alert('Payment system not ready or not logged in.'); return; }
    try {
      // 1. Create the order
      const orderRes = await fetch(`${API_URL}/api/payments/create-order`, { // Use API_URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ invoiceId: invoice._id })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || 'Failed to create order.');

      // 2. Configure Razorpay
      const options = {
        key: razorpayKeyId, amount: orderData.amount, currency: orderData.currency,
        name: 'My Invoice App', description: `Payment for Invoice #${invoice._id.slice(-6)}`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            // 3. Verify payment
            const verificationRes = await fetch(`${API_URL}/api/payments/verify-payment`, { // Use API_URL
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
              body: JSON.stringify(response)
            });
            const verificationData = await verificationRes.json();
            if (verificationData.success) { alert('Payment verified!'); onListChange(); }
            else { setPaymentError(verificationData.message || 'Verification failed.'); }
          } catch (verifyErr) { setPaymentError('Verification call failed.'); }
        },
        prefill: { name: invoice.clientName, email: invoice.clientEmail },
        theme: { color: '#3f51b5' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on('payment.failed', (response) => setPaymentError(`Payment Failed: ${response.error.description}`));
    } catch (err) { setPaymentError(`Payment initiation failed: ${err.message}`); }
  };

  // Function to generate and download PDF
  const handleDownloadPDF = (invoice) => {
     const doc = new jsPDF();
     doc.setFontSize(22); doc.text('Invoice', 20, 20);
     doc.setFontSize(14); doc.text('From:', 20, 35); doc.setFontSize(12); doc.text('Your Company Inc.', 20, 42);
     doc.setFontSize(14); doc.text('To:', 110, 35); doc.setFontSize(12); doc.text(invoice.clientName, 110, 42); doc.text(invoice.clientEmail, 110, 49);
     doc.setFontSize(12); doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, 65); doc.text(`Invoice ID: ${invoice._id}`, 20, 72);
     doc.setLineWidth(0.5); doc.line(20, 80, 190, 80);
     doc.setFontSize(14); doc.text('Description', 20, 90); doc.text('Amount', 185, 90, { align: 'right'});
     doc.setFontSize(12); doc.text(invoice.description, 20, 98, { maxWidth: 140 });
     doc.text(`₹${invoice.amount.toFixed(2)}`, 185, 98, { align: 'right'});
     doc.line(20, 115, 190, 115);
     doc.setFontSize(16); doc.text('Total:', 150, 125, { align: 'right'});
     doc.text(`₹${invoice.amount.toFixed(2)}`, 185, 125, { align: 'right'});
     doc.save(`invoice-${invoice._id.slice(-6)}.pdf`);
  };

  // Function to mark an invoice as paid manually
  const handleMarkAsPaid = (id) => {
    const token = localStorage.getItem('token'); if (!token) return;
    fetch(`${API_URL}/api/invoices/${id}`, { // Use API_URL
      method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
    })
    .then(res => res.ok ? res.json() : Promise.reject('Failed mark as paid'))
    .then(data => { console.log('Marked as paid:', data); onListChange(); })
    .catch(err => alert(`Error: ${err.message || err}`));
  };

  // Function to delete an invoice
  const handleDelete = (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    const token = localStorage.getItem('token'); if (!token) return;
    fetch(`${API_URL}/api/invoices/${id}`, { // Use API_URL
      method: 'DELETE', headers: { 'x-auth-token': token }
    })
    .then(res => res.ok ? res.json() : Promise.reject('Failed to delete'))
    .then(data => { console.log(data.message); onListChange(); })
    .catch(err => alert(`Error: ${err.message || err}`));
  };

  // Render the component
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>All Invoices</Typography>
      {paymentError && <Alert severity="error" sx={{ mb: 2 }}>{paymentError}</Alert>}
      {invoices.length === 0 ? (<Typography>No invoices found. Add one above!</Typography>) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {invoices.map(invoice => (
            <Card key={invoice._id} elevation={2} sx={{ display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography variant="h6">{invoice.clientName || 'N/A'}</Typography>
                    <Typography variant="body2" color="textSecondary">{invoice.clientEmail || 'N/A'}</Typography>
                  </Box>
                  <Chip label={invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)} color={invoice.status === 'pending' ? 'warning' : 'success'} size="small" sx={{ fontWeight: 'medium' }}/>
                </Box>
                <Typography sx={{ mt: 2, mb: 1 }} color="textSecondary">{invoice.description}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>₹{invoice.amount.toFixed(2)}</Typography>
                <Typography variant="caption" display="block" color="textSecondary" sx={{mt: 1}}>Created: {new Date(invoice.createdAt).toLocaleDateString()}</Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', borderTop: '1px solid #eee', p: 2 }}>
                {invoice.status === 'pending' && (
                  <>
                    <Button size="small" variant="contained" color="primary" onClick={() => handlePayment(invoice)} sx={{ mr: 1 }} disabled={!razorpayKeyId}>Pay Now (₹)</Button>
                    <Button size="small" variant="contained" color="success" onClick={() => handleMarkAsPaid(invoice._id)} sx={{ mr: 1 }}>Mark as Paid</Button>
                  </>
                )}
                <Button size="small" variant="outlined" color="secondary" onClick={() => handleDownloadPDF(invoice)}>Download PDF</Button>
                <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(invoice._id)} sx={{ ml: 1 }}>Delete</Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
export default InvoiceList;
