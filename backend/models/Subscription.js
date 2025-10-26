const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubscriptionSchema = new Schema({
  // Link to the user who created this subscription
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Link to the client this subscription is for
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  // The invoice details
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  // The schedule
  frequency: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  nextDueDate: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);