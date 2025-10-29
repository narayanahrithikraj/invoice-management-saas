require('dotenv').config(); // Load environment variables first
const express = require('express');
const cors = require('cors'); // Import cors
const mongoose = require('mongoose');
const passport = require('passport'); // Import passport
require('./config/passport-setup'); // Initialize passport configuration

const { startSubscriptionJob } = require('./cron/subscriptionJob');

// Import routes
const invoiceRoutes = require('./routes/invoices');
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const subscriptionRoutes = require('./routes/subscriptions');

const app = express();
// Use dynamic port from environment or default to 5000
const port = process.env.PORT || 5000;

// --- Middleware ---

// --- UPDATED CORS Configuration ---
// Define allowed origins
const allowedOrigins = [
    'http://localhost:3000', // Allow local development frontend
    'https://saasinvoicemanagement.vercel.app' // Allow your deployed Vercel frontend
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) OR
    // Allow requests from whitelisted origins
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`); // Log blocked origins
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200 // For compatibility with older browsers
};

app.use(cors(corsOptions)); // Use configured CORS options
// --- END CORS Update ---

app.use(express.json()); // Parse JSON request bodies
app.use(passport.initialize()); // Initialize passport middleware


// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Atlas connected successfully'))
  .catch(err => {
      console.error('MongoDB connection error:', err.message); // Log only the error message
      // Log full error object for detailed debugging if needed, but message is often sufficient
      // console.error('MongoDB full connection error object:', err);
  });

// --- API Routes ---
app.use('/api/invoices', invoiceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Optional: Basic root route for testing deployment
app.get('/', (req, res) => {
    res.send('Invoice Management Backend is running!');
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`); // Use the actual port variable
  startSubscriptionJob(); // Start the recurring invoice job
});