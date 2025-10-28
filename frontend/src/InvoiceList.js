import React, { useState, useEffect } from 'react'; // Correct React import
import { Card, CardContent, CardActions, Typography, Button, Box, Chip } from '@mui/material';

// Import jsPDF for PDF generation
import jsPDF from 'jspdf';

function InvoiceList({ invoices, onListChange }) {
  const [razorpayKeyId, setRazorpayKeyId] = useState(''); // State to hold key

  // Fetch Razorpay Key ID when component mounts
  useEffect(() => {
    const fetchKeyId = async () => {
      try {
        // This endpoint is public, so no token is needed
        const res = await fetch('http://localhost:5000/api/payments/get-key-id');
        if (!res.ok) throw new Error('Failed to fetch key');
        const data = await res.json();
        setRazorpayKeyId(data.keyId);
      } catch (err) {
        console.error('Failed to fetch Razorpay key:', err);
        // Handle error appropriately in UI if needed (e.g., disable Pay Now button)
      }
    };
    fetchKeyId();
  }, []); // Empty dependency array means run once on mount


  // --- Function to handle initiating Razorpay payment ---
  const handlePayment = async (invoice) => {
    const token = localStorage.getItem('token');
    if (!razorpayKeyId) {
      alert('Payment system is not ready. Please try again.');
      return;
    }
    if (!token) {
        alert('Authentication error. Please log in again.');
        return;
    }

    try {
      // 1. Create the order on your backend
      const orderRes = await fetch('http://localhost:5000/api/payments/create-order', {
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
        key: razorpayKeyId,                 // Your public Key ID from backend
        amount: orderData.amount,           // Amount in paise from backend order
        currency: orderData.currency,       // Currency (INR) from backend order
        name: 'My Invoice App',             // Your business name
        description: `Payment for Invoice #${invoice._id.slice(-6)}`, // Short description
        order_id: orderData.id,             // The order_id obtained from your backend
        handler: async function (response) { // This function runs after payment attempt
          console.log('Razorpay Response:', response);
          try {
            // 3. Send payment details to backend for verification
            const verificationRes = await fetch('http://localhost:5000/api/payments/verify-payment', {
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
              onListChange(); // Refresh the invoice list to show "Paid" status
            } else {
              alert(verificationData.message || 'Payment verification failed. Please contact support.');
            }
          } catch (verifyErr) {
            console.error('Verification API call failed:', verifyErr);
            alert('Payment verification failed after successful payment. Please contact support.');
          }
        },
        prefill: { // Pre-fill customer details if available
          name: invoice.clientName,
          email: invoice.clientEmail
          // contact: invoice.clientPhone // Add if you have client phone
        },
        notes: {
          invoice_id: invoice._id // Add custom notes if needed
        },
        theme: {
          color: '#3f51b5' // Match MUI primary color (optional)
        }
      };

      // 4. Open the Razorpay payment modal
      const rzp = new window.Razorpay(options);
      rzp.open();

      // Handle payment failure (optional)
      rzp.on('payment.failed', function (response) {
          console.error('Razorpay Payment Failed:', response.error);
          alert(`Payment Failed: ${response.error.description} (Code: ${response.error.code})`);
      });

    } catch (err) {
      console.error('Payment initiation failed:', err);
      alert(`Payment initiation failed: ${err.message}`);
    }
  };

  // --- Function to generate and download PDF (Using "INR" Prefix & Spacing Fix) ---
  const handleDownloadPDF = (invoice) => {
    const doc = new jsPDF();

    // --- PDF Content ---
    doc.setFontSize(22);
    doc.text('Invoice', 20, 20);

    doc.setFontSize(14);
    doc.text('From:', 20, 35);
    doc.setFontSize(12);
    doc.text('Your Company Inc.', 20, 42);

    doc.setFontSize(14);
    doc.text('To:', 110, 35);
    doc.setFontSize(12);
    doc.text(invoice.clientName, 110, 42);
    doc.text(invoice.clientEmail, 110, 49);

    doc.setFontSize(12);
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, 65);
    doc.text(`Invoice ID: ${invoice._id}`, 20, 72);
    // Add dates if available
    // doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 110, 65);
    // doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 110, 72);

    doc.setLineWidth(0.5);
    doc.line(20, 80, 190, 80); // Line separator

    doc.setFontSize(14);
    doc.text('Description', 20, 90);
    doc.text('Amount', 185, 90, { align: 'right'}); // Adjusted amount header position
    doc.setFontSize(12);

    doc.text(invoice.description, 20, 98, { maxWidth: 140 });
    doc.text(`INR ${invoice.amount.toFixed(2)}`, 185, 98, { align: 'right'}); // Adjusted amount position & use INR

    doc.line(20, 115, 190, 115); // Line separator

    // --- TOTAL SECTION (SPACING FIXED) ---
    doc.setFontSize(16);
    doc.text('Total:', 125, 125); // Moved "Total:" slightly left
    doc.text(`INR ${invoice.amount.toFixed(2)}`, 185, 125, { align: 'right'}); // Moved Amount slightly right & use INR
    // --- END FIX ---

    doc.save(`invoice-${invoice._id.slice(-6)}.pdf`);
  };

  // --- Function to mark an invoice as paid manually ---
  const handleMarkAsPaid = (id) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`http://localhost:5000/api/invoices/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
    })
    .then(res => {
        if (!res.ok) {
           return res.json().then(errData => { throw new Error(errData.message || 'Failed to mark as paid')});
        }
        return res.json();
    })
    .then(data => {
      console.log('Invoice updated (marked as paid):', data);
      onListChange();
    })
    .catch(err => {
        console.error('Error marking invoice as paid:', err);
        alert(`Error: ${err.message}`);
    });
  };

  // --- Function to delete an invoice ---
  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) {
        return;
    }
    const token = localStorage.getItem('token');
     if (!token) return;

    fetch(`http://localhost:5000/api/invoices/${id}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token
      }
    })
    .then(res => {
        if (!res.ok) {
           return res.json().then(errData => { throw new Error(errData.message || 'Failed to delete')});
        }
        return res.json();
    })
    .then(data => {
      console.log(data.message);
      onListChange();
    })
    .catch(err => {
        console.error('Error deleting invoice:', err);
        alert(`Error: ${err.message}`);
    });
  };

  // --- Render the component ---
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        All Invoices
      </Typography>
      {invoices.length === 0 ? (
        <Typography>No invoices found. Add one above!</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {invoices.map(invoice => (
            <Card key={invoice._id} elevation={2} sx={{ display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography variant="h6" component="div">
                      {invoice.clientName || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {invoice.clientEmail || 'No Email'}
                    </Typography>
                  </Box>
                  <Chip
                    label={invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    color={invoice.status === 'pending' ? 'warning' : 'success'}
                    size="small"
                    sx={{ fontWeight: 'medium' }}
                  />
                </Box>
                <Typography sx={{ mt: 2, mb: 1, fontStyle: 'italic' }} color="textSecondary">
                  {invoice.description}
                </Typography>
                <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mt: 1 }}>
                  ₹{invoice.amount.toFixed(2)} {/* Use ₹ for display on webpage */}
                </Typography>
                 <Typography variant="caption" display="block" color="textSecondary" sx={{mt: 1}}>
                    Created: {new Date(invoice.createdAt).toLocaleDateString()}
                 </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', borderTop: '1px solid #eee', p: 2 }}>
                {invoice.status === 'pending' && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => handlePayment(invoice)}
                      sx={{ mr: 1 }}
                      disabled={!razorpayKeyId} // Disable if key not loaded
                    >
                      Pay Now (₹)
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handleMarkAsPaid(invoice._id)}
                      sx={{ mr: 1 }}
                    >
                      Mark as Paid
                    </Button>
                  </>
                )}
                <Button
                  size="small"
                  variant="outlined" // Changed variant for visual difference
                  color="secondary"
                  onClick={() => handleDownloadPDF(invoice)}
                >
                  Download PDF
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => handleDelete(invoice._id)}
                  sx={{ ml: 1 }} // Add margin-left
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default InvoiceList;