import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Grid, Typography, Box, Alert, CircularProgress
} from '@mui/material';

function InvoiceReviewModal({ open, onClose, extractedText, onSave }) {
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [invoiceId, setInvoiceId] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState('');

    useEffect(() => {
        const parseTextWithAI = async (text) => {
            setIsParsing(true); setParseError('');
            setClientName(''); setClientEmail(''); setDescription('');
            setAmount(''); setInvoiceDate(''); setDueDate(''); setInvoiceId('');
            const token = localStorage.getItem('token');
             if (!token) { setParseError("Auth error."); setIsParsing(false); return; }

            try {
                // Use environment variable for API URL
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/invoices/parse-text`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ text: text })
                });
                const data = await response.json();
                if (response.ok && data.parsedData) {
                    setClientName(data.parsedData.clientName || '');
                    setClientEmail(data.parsedData.clientEmail || '');
                    setDescription(data.parsedData.description || '');
                    setAmount(data.parsedData.totalAmount !== null && data.parsedData.totalAmount !== undefined ? String(data.parsedData.totalAmount) : '');
                    setInvoiceDate(data.parsedData.invoiceDate || '');
                    setDueDate(data.parsedData.dueDate || '');
                    setInvoiceId(data.parsedData.invoiceId || '');
                    setParseError('');
                } else { setParseError(data.message || 'AI parsing failed.'); }
            } catch (error) { setParseError('Parsing service connection failed.'); }
            finally { setIsParsing(false); }
        };

        if (open && extractedText) { parseTextWithAI(extractedText); }
        else { setIsParsing(false); setParseError(''); } // Clear on close/no text
    }, [open, extractedText]);

    const handleSave = () => {
        if (!clientName || !description || !amount) { alert('Client Name, Description, and Amount required.'); return; }
        const verifiedInvoiceData = { clientName, clientEmail, description, amount: parseFloat(amount) || 0, invoiceId, invoiceDate, dueDate, status: 'pending' };
        onSave(verifiedInvoiceData);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle>Review Extracted Invoice Data</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>Extracted Text</Typography>
                        <TextField multiline rows={20} fullWidth variant="outlined" value={extractedText || "Loading..."} InputProps={{ readOnly: true }} sx={{ backgroundColor: '#f9f9f9' }}/>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>Verify Details</Typography>
                        {isParsing && (<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}><CircularProgress size={20} sx={{ mr: 1 }} /><Typography variant="body2">AI parsing...</Typography></Box>)}
                        {parseError && <Alert severity="warning" sx={{ mb: 2 }}>{parseError}</Alert>}
                        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField label="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} fullWidth required disabled={isParsing} />
                            <TextField label="Client Email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} fullWidth disabled={isParsing} />
                            <TextField label="Invoice ID/Number" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} fullWidth disabled={isParsing} />
                            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth required disabled={isParsing} />
                            <TextField label="Amount (₹)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} fullWidth required disabled={isParsing} InputProps={{ inputProps: { step: "0.01" } }} />
                            <TextField label="Invoice Date (YYYY-MM-DD)" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} fullWidth disabled={isParsing} helperText="Format YYYY-MM-DD"/>
                            <TextField label="Due Date (YYYY-MM-DD)" value={dueDate} onChange={(e) => setDueDate(e.target.value)} fullWidth disabled={isParsing} helperText="Format YYYY-MM-DD"/>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={isParsing}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" color="primary" disabled={isParsing}>Save Verified Invoice</Button>
            </DialogActions>
        </Dialog>
    );
}
export default InvoiceReviewModal;