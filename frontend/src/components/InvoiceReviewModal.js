import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Grid, Typography, Box, Alert, CircularProgress // Added CircularProgress
} from '@mui/material';

function InvoiceReviewModal({ open, onClose, extractedText, onSave }) {
    // State for the form fields
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [invoiceId, setInvoiceId] = useState('');

    // State for parsing status
    const [isParsing, setIsParsing] = useState(false); // Loading state for AI parsing
    const [parseError, setParseError] = useState('');

    // --- UPDATED useEffect to call AI parsing ---
    useEffect(() => {
        // Function to parse text using the backend AI endpoint
        const parseTextWithAI = async (text) => {
            setIsParsing(true);
            setParseError('');
            // Clear fields before parsing
            setClientName(''); setClientEmail(''); setDescription('');
            setAmount(''); setInvoiceDate(''); setDueDate(''); setInvoiceId('');
            console.log("Sending text to backend for AI parsing...");

            const token = localStorage.getItem('token'); // Need token for API call
             if (!token) {
                setParseError("Authentication error. Cannot parse text.");
                setIsParsing(false);
                return;
             }

            try {
                const response = await fetch('http://localhost:5000/api/invoices/parse-text', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify({ text: text })
                });

                const data = await response.json();

                if (response.ok && data.parsedData) {
                    console.log("AI Parsing Successful. Parsed Data:", data.parsedData);
                    // --- Pre-fill form fields with parsed data ---
                    setClientName(data.parsedData.clientName || '');
                    setClientEmail(data.parsedData.clientEmail || '');
                    setDescription(data.parsedData.description || '');
                    // Ensure amount is a number or empty string
                    setAmount(data.parsedData.totalAmount !== null && data.parsedData.totalAmount !== undefined ? String(data.parsedData.totalAmount) : '');
                    setInvoiceDate(data.parsedData.invoiceDate || '');
                    setDueDate(data.parsedData.dueDate || '');
                    setInvoiceId(data.parsedData.invoiceId || '');
                    setParseError(''); // Clear any previous errors on success
                } else {
                    console.error("AI Parsing failed:", data.message);
                    setParseError(data.message || 'AI parsing failed. Please review manually.');
                }
            } catch (error) {
                console.error("Error calling parsing API:", error);
                setParseError('Failed to connect to parsing service. Please review manually.');
            } finally {
                setIsParsing(false);
            }
        };

        // Only run parsing if the modal is open and has text
        if (open && extractedText) {
            parseTextWithAI(extractedText);
        } else {
            // Reset fields if modal closes or text is empty
            setClientName(''); setClientEmail(''); setDescription('');
            setAmount(''); setInvoiceDate(''); setDueDate(''); setInvoiceId('');
            setIsParsing(false); setParseError('');
        }
    }, [open, extractedText]); // Re-run effect if modal opens or text changes

    // Function to handle saving the verified/edited data
    const handleSave = () => {
        // Basic validation (optional, can add more)
        if (!clientName || !description || !amount) {
            alert('Please ensure Client Name, Description, and Amount are filled.');
            return;
        }
        const verifiedInvoiceData = {
            clientName,
            clientEmail,
            description,
            amount: parseFloat(amount) || 0, // Convert amount back to number
            invoiceId, // Include if needed by backend model/logic
            invoiceDate, // Include if needed
            dueDate, // Include if needed
            status: 'pending'
        };
        onSave(verifiedInvoiceData);
        onClose(); // Close modal after triggering save
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle>Review Extracted Invoice Data</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    {/* Column 1: Extracted Text */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>Extracted Text</Typography>
                        <TextField
                            multiline
                            rows={20} // Increased rows
                            fullWidth
                            variant="outlined"
                            value={extractedText || "Loading text..."}
                            InputProps={{ readOnly: true }}
                            sx={{ backgroundColor: '#f9f9f9' }} // Subtle background
                        />
                    </Grid>

                    {/* Column 2: Verification Form */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>Verify Details</Typography>
                        {isParsing && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <CircularProgress size={20} sx={{ mr: 1 }} />
                                <Typography variant="body2">AI is parsing the text...</Typography>
                            </Box>
                        )}
                        {parseError && <Alert severity="warning" sx={{ mb: 2 }}>{parseError}</Alert>}
                        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Readonly prevents editing while parsing */}
                            <TextField label="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} fullWidth required disabled={isParsing} />
                            <TextField label="Client Email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} fullWidth disabled={isParsing} />
                            <TextField label="Invoice ID/Number" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} fullWidth disabled={isParsing} />
                            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth required disabled={isParsing} />
                            <TextField label="Amount (₹)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} fullWidth required disabled={isParsing} InputProps={{ inputProps: { step: "0.01" } }} />
                            <TextField label="Invoice Date (YYYY-MM-DD)" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} fullWidth disabled={isParsing} helperText="Enter date as found or format YYYY-MM-DD"/>
                            <TextField label="Due Date (YYYY-MM-DD)" value={dueDate} onChange={(e) => setDueDate(e.target.value)} fullWidth disabled={isParsing} helperText="Enter date as found or format YYYY-MM-DD"/>
                            {/* Add more fields if needed */}
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}> {/* Added padding */}
                <Button onClick={onClose} disabled={isParsing}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" color="primary" disabled={isParsing}>
                    Save Verified Invoice
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default InvoiceReviewModal;