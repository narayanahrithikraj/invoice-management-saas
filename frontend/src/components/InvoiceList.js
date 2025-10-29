import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardActions, Typography, Button, Box, Chip, Alert } from '@mui/material'; // Added Alert
import jsPDF from 'jspdf';

function InvoiceList({ invoices, onListChange }) {
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [paymentError, setPaymentError] = useState(''); // State for payment errors

  // Fetch Razorpay Key ID when component mounts
  useEffect(() => {
    const fetchKeyId = async () => {
      try {
        // Use environment variable for API URL
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/get-key-id`);
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
    if (!razorpayKeyId) {
      setPaymentError('Payment system is not ready. Please try again.');
      return;
    }
    if (!token) {
        setPaymentError('Authentication error. Please log in again.');
        return;
    }

    try {
      // 1. Create the order on your backend
      // Use environment variable for API URL
      const orderRes = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ invoiceId: invoice._id })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.message || 'Failed to create payment order.');
      }

      // 2. Configure Razorpay checkout options
      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'My Invoice App',
        description: `Payment for Invoice #${invoice._id.slice(-6)}`,
        order_id: orderData.id,
        handler: async function (response) {
          console.log('Razorpay Response:', response);
          try {
            // 3. Send payment details to backend for verification
            // Use environment variable for API URL
            const verificationRes = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            });

            const verificationData = await verificationRes.json();

            if (verificationData.success) {
              alert('Payment verified successfully and invoice updated!');
              onListChange(); // Refresh list
            } else {
               setPaymentError(verificationData.message || 'Payment verification failed.'); // Show specific error
            }
          } catch (verifyErr) {
            console.error('Verification API call failed:', verifyErr);
            setPaymentError('Payment verification failed after payment. Contact support.'); // Show error
          }
        },
        prefill: { name: invoice.clientName, email: invoice.clientEmail },
        notes: { invoice_id: invoice._id },
        theme: { color: '#3f51b5' }
      };

      // 4. Open the Razorpay payment modal
      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on('payment.failed', function (response) {
          console.error('Razorpay Payment Failed:', response.error);
          setPaymentError(`Payment Failed: ${response.error.description}`); // Show detailed error
      });

    } catch (err) {
      console.error('Payment initiation failed:', err);
      setPaymentError(`Payment initiation failed: ${err.message}`); // Show initiation error
    }
  };

  // Function to generate and download PDF
  const handleDownloadPDF = (invoice) => {
    // ... (Your PDF generation code using ₹ or INR) ...
     const doc = new jsPDF();
     doc.setFontSize(22); doc.text('Invoice', 20, 20);
     doc.setFontSize(14); doc.text('From:', 20, 35); doc.setFontSize(12); doc.text('Your Company Inc.', 20, 42);
     doc.setFontSize(14); doc.text('To:', 110, 35); doc.setFontSize(12); doc.text(invoice.clientName, 110, 42); doc.text(invoice.clientEmail, 110, 49);
     doc.setFontSize(12); doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, 65); doc.text(`Invoice ID: ${invoice._id}`, 20, 72);
     doc.setLineWidth(0.5); doc.line(20, 80, 190, 80);
     doc.setFontSize(14); doc.text('Description', 20, 90); doc.text('Amount', 185, 90, { align: 'right'});
     doc.setFontSize(12); doc.text(invoice.description, 20, 98, { maxWidth: 140 });
     doc.text(`₹${invoice.amount.toFixed(2)}`, 185, 98, { align: 'right'}); // Use ₹
     doc.line(20, 115, 190, 115);
     doc.setFontSize(16); doc.text('Total:', 150, 125, { align: 'right'});
     doc.text(`₹${invoice.amount.toFixed(2)}`, 185, 125, { align: 'right'}); // Use ₹
     doc.save(`invoice-${invoice._id.slice(-6)}.pdf`);
  };

  // Function to mark an invoice as paid manually
  const handleMarkAsPaid = (id) => {
    const token = localStorage.getItem('token'); if (!token) return;
    // Use environment variable for API URL
    fetch(`${process.env.REACT_APP_API_URL}/api/invoices/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
    })
    .then(res => { if (!res.ok) { return res.json().then(err => Promise.reject(err)); } return res.json(); })
    .then(data => { console.log('Marked as paid:', data); onListChange(); })
    .catch(err => { console.error('Error marking as paid:', err); alert(`Error: ${err.message || 'Could not mark as paid'}`); });
  };

  // Function to delete an invoice
  const handleDelete = (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    const token = localStorage.getItem('token'); if (!token) return;
    // Use environment variable for API URL
    fetch(`${process.env.REACT_APP_API_URL}/api/invoices/${id}`, {
      method: 'DELETE', headers: { 'x-auth-token': token }
    })
    .then(res => { if (!res.ok) { return res.json().then(err => Promise.reject(err)); } return res.json(); })
    .then(data => { console.log(data.message); onListChange(); })
    .catch(err => { console.error('Error deleting:', err); alert(`Error: ${err.message || 'Could not delete invoice'}`); });
  };

  // Render the component
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>All Invoices</Typography>
      {/* Display general payment system error if key failed to load */}
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