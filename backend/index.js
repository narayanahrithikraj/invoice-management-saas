require('dotenv').config(); // Should be at the very top
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport'); // <-- NEW: Import passport
require('./config/passport-setup'); // <-- NEW: Run your passport config

const { startSubscriptionJob } = require('./cron/subscriptionJob');

// Import our routes
const invoiceRoutes = require('./routes/invoices');
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const subscriptionRoutes = require('./routes/subscriptions'); // <-- NEW

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize()); // <-- NEW: Initialize passport

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Atlas connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

// --- API Routes ---
app.use('/api/invoices', invoiceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes); // <-- NEW

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  startSubscriptionJob();
});