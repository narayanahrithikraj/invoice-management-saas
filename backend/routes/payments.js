const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Razorpay = require('razorpay'); 
const Invoice = require('../models/Invoice');
const crypto = require('crypto'); // <-- We need this for verification

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// GET RAZORPAY KEY ID
router.get('/get-key-id', (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

// Apply auth middleware to all routes below this
router.use(authMiddleware);

// --- 1. CREATE A NEW ORDER ---
router.post('/create-order', async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const invoice = await Invoice.findOne({ _id: invoiceId, user: req.user.id });
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Invoice is already paid' });
    }
    const amountInPaise = Math.round(invoice.amount * 100); 
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: invoice._id.toString(), // <-- We set the receipt to our invoice ID
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- 2. VERIFY THE PAYMENT ---
// (Endpoint: POST /api/payments/verify-payment)
router.post('/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // 1. Create the signature to compare
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // 2. Compare the signatures
    if (expectedSignature === razorpay_signature) {
      // --- PAYMENT IS VALID ---
      
      // 3. Get the order details to find our invoice ID (which we stored in 'receipt')
      const order = await razorpay.orders.fetch(razorpay_order_id);
      const invoiceId = order.receipt; 

      // 4. Update the invoice in our database
      await Invoice.findByIdAndUpdate(invoiceId, { status: 'paid' });
      
      res.json({ success: true, message: 'Payment verified and invoice updated.' });
      
    } else {
      // --- PAYMENT IS INVALID ---
      res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;