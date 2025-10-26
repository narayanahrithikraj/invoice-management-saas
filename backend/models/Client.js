const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClientSchema = new Schema({
  // Link to the user who created this client
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: false // Phone is optional
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Client', ClientSchema);