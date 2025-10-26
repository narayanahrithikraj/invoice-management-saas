const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the structure of an invoice
const InvoiceSchema = new Schema({
  // --- NEW: Link to the User model ---
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // This connects it to our 'User' model
    required: true
  },
  // ---
  clientName: {
    type: String,
    required: true
  },
  clientEmail: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: 'pending' // 'pending' or 'paid'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export the model
module.exports = mongoose.model('Invoice', InvoiceSchema);