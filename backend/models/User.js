const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true, // Required for email/password signup
    unique: true,   // Ensure usernames are unique
    trim: true      // Remove leading/trailing whitespace
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: false // Not required if signing up with Google or Phone OTP
  },
  // --- Phone Fields ---
  mobileNumber: {
    type: String,
    required: false, // Optional
    trim: true,
    unique: true,   // Ensure phone numbers are unique
    sparse: true    // Allows multiple users to have 'null' phone number (if not provided)
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  // --- END Phone Fields ---
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'], // Allowed values
    required: false // Optional
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Optional: You might add googleId if you want to track Google signups
  // googleId: { type: String }
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

// Pre-save hook for password hashing (only if password is provided/modified)
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new) AND it exists
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10); // Generate salt
    this.password = await bcrypt.hash(this.password, salt); // Hash password
    next(); // Continue saving
  } catch (err) {
    next(err); // Pass error to the next middleware/save operation
  }
});

module.exports = mongoose.model('User', UserSchema);