const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const passport = require('passport');
const crypto = require('crypto'); // Needed for password reset tokens
const { sendPasswordResetEmail } = require('../config/email-setup'); // Needed for sending emails
const twilio = require('twilio'); // Needed for phone OTP

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345'; // Use env variable

// Initialize Twilio client using environment variables
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;


// --- Email/Password Routes ---

// REGISTER (Email/Password)
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, mobileNumber, gender } = req.body;

        // Basic validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required.' });
        }
        // Check if email or username already exists
        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            return res.status(400).json({ message: 'Email already in use.' });
        }
        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            return res.status(400).json({ message: 'Username already taken.' });
        }

        const newUser = new User({
            username,
            email,
            password, // Hashing happens in pre-save hook
            mobileNumber,
            gender
            // role defaults to 'user' from the model
        });

        const savedUser = await newUser.save();
        res.status(201).json({
            message: 'User created successfully',
            userId: savedUser._id,
            username: savedUser.username
        });
    } catch (err) {
        console.error("!!! BACKEND REGISTER ERROR:", err);
        // Provide more specific error messages if possible (e.g., validation error)
        if (err.name === 'ValidationError') {
             return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// LOGIN (Email/Password)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        // Check if user registered via Google or Phone (no password)
        if (!user.password) {
             // Try to determine the signup method for a better message
            if (user.mobileNumber && user.isPhoneVerified) {
                return res.status(400).json({ message: 'Account registered with Phone OTP. Please use Phone Sign-In.' });
            } else {
                 return res.status(400).json({ message: 'Account registered with Google. Please use Google Sign-In.' });
            }
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        // Create JWT payload
        const payload = { user: { id: user.id } };
        // Sign token
        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' }, // Token expires in 1 hour
            (err, token) => {
                if (err) throw err;
                console.log("LOGIN: Using JWT_SECRET:", JWT_SECRET);
                console.log("LOGIN: Generated Token:", token);
                res.json({ token, role: user.role, username: user.username }); // Send token, role, and username
            }
        );
    } catch (err) {
        console.error("!!! BACKEND LOGIN ERROR:", err);
        res.status(500).json({ message: 'Server error during login.' });
    }
});


// --- Google OAuth Routes ---

// INITIATE Google OAuth flow (Redirects user to Google)
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'] // Request profile and email access
    })
);

// Google OAuth CALLBACK (Google redirects back here after user approves)
router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: 'http://localhost:3000/login?error=google_failed', // Redirect to frontend login on failure
        session: false // We are using JWT, not sessions
    }),
    // This function runs only if Google authentication was successful
    (req, res) => {
        // Passport attaches the authenticated user to req.user
        if (!req.user) {
             console.error("User not found after Google auth");
             return res.redirect('http://localhost:3000/login?error=auth_failed');
        }

        // Generate JWT for the user
        const payload = {
            user: {
                id: req.user.id
            }
        };
        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) {
                    console.error("Error signing JWT after Google auth:", err);
                    return res.redirect('http://localhost:3000/login?error=token_failed');
                }

                console.log("GOOGLE CB: Using JWT_SECRET:", JWT_SECRET); 
                console.log("GOOGLE CB: Generated Token:", token); 
                // Redirect back to the frontend's callback page with token, role, and username
                console.log("[Google Callback] Authentication successful. Redirecting frontend.");
                res.redirect(`http://localhost:3000/auth/callback?token=${token}&role=${req.user.role}&username=${encodeURIComponent(req.user.username)}`);
            }
        );
    }
);

// --- Forgot/Reset Password Routes ---

// FORGOT PASSWORD - Generate token & send email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists for security
      console.log(`Password reset attempt for non-existent email: ${email}`);
      return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // 1. Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto // Store a hash, not the raw token
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // 2. Set token and expiry on user model (expires in 1 hour)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save(); // <-- Save the user

    // --- ADD LOGGING START ---
    console.log("--- Forgot Password - After Save ---");
    console.log("User Email:", user.email);
    console.log("Saved Hashed Token:", user.resetPasswordToken); // Check if hash is saved
    console.log("Saved Expiry Time:", user.resetPasswordExpires); // Check if expiry is saved
    // --- ADD LOGGING END ---

    // 3. Create reset link (Point to your frontend reset page)
    const resetLink = `http://localhost:3000/reset-password/${resetToken}`; // Send raw token in link

    // 4. Send the email
    const emailSent = await sendPasswordResetEmail(user.email, resetLink);

    if (emailSent) {
      res.status(200).json({ message: 'Password reset link sent to your email.' });
    } else {
      // If email fails, reset the token fields to allow retry
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save(); // Save again to clear
      res.status(500).json({ message: 'Failed to send password reset email. Please try again later.' });
    }

  } catch (err) {
    console.error("!!! FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// RESET PASSWORD - Verify token & update password
router.post('/reset-password/:token', async (req, res) => {
  const { newPassword } = req.body;
  const { token } = req.params; // Raw token from URL

  if (!newPassword || !token) {
     return res.status(400).json({ message: 'New password and token are required.' });
  }

  try {
    // --- ADD LOGGING START ---
    console.log("--- Reset Password Attempt ---");
    console.log("Raw Token from URL:", token);

    // 1. Hash the token from the URL to match the stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    console.log("Hashed Token for Query:", hashedToken);
    console.log("Current Time (for expiry check):", Date.now());
    // --- ADD LOGGING END ---

    // 2. Find user by the hashed token & check expiry
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() } // Check if token hasn't expired
    });

    // --- ADD LOGGING ---
    console.log("User found:", user ? user.email : "No user found with this token/expiry");
    if (user && user.resetPasswordExpires) { // Check if expiry exists before getTime
        console.log("Token Expiry Time:", user.resetPasswordExpires.getTime());
    }
    // --- ADD LOGGING ---

    if (!user) {
      // This is where the error is likely happening
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    // 3. Token is valid! Update the password
    // (Password hashing happens automatically via the pre-save hook)
    user.password = newPassword;
    user.resetPasswordToken = undefined; // Clear the token fields
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });

  } catch (err) {
     console.error("!!! RESET PASSWORD ERROR:", err);
     if (err.name === 'ValidationError') { // Handle password validation errors if any
         return res.status(400).json({ message: err.message });
     }
    res.status(500).json({ message: 'Server error. Failed to reset password.' });
  }
});


// --- Phone OTP Routes ---

// SEND OTP to Phone Number
router.post('/phone/send-otp', async (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber) {
    return res.status(400).json({ message: 'Phone number is required.' });
  }

  // Basic E.164 format check (adjust country code logic as needed)
  const formattedPhoneNumber = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}`; // Assuming +91 if not provided

  try {
    console.log(`Sending OTP to: ${formattedPhoneNumber}`);
    const verification = await twilioClient.verify.v2.services(verifyServiceSid)
      .verifications
      .create({ to: formattedPhoneNumber, channel: 'sms' });

    console.log('Twilio Verification Sent Status:', verification.status);
    res.status(200).json({ message: `OTP sent successfully to ${formattedPhoneNumber}.` });

  } catch (err) {
    console.error("!!! TWILIO SEND OTP ERROR:", err);
    let errorMessage = 'Failed to send OTP. Please check the number or try again later.';
    let statusCode = err.status || 500;
    if (err.code === 60200 || err.code === 21211) {
        errorMessage = 'Invalid phone number format. Please provide a valid number including country code (e.g., +91XXXXXXXXXX).';
        statusCode = 400;
    } else if (err.code === 60203 || err.code === 21614) {
        errorMessage = 'Cannot send OTP to this number.';
         statusCode = 400;
    } else if (err.code === 60202 || err.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment.';
        statusCode = 429;
    }
    res.status(statusCode).json({ message: errorMessage, code: err.code });
  }
});

// VERIFY OTP and Login/Register User
router.post('/phone/verify-otp', async (req, res) => {
  const { mobileNumber, otpCode } = req.body;
  if (!mobileNumber || !otpCode) {
    return res.status(400).json({ message: 'Phone number and OTP code are required.' });
  }
  const formattedPhoneNumber = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}`;

  try {
    console.log(`Verifying OTP for: ${formattedPhoneNumber} with code: ${otpCode}`);
    const verificationCheck = await twilioClient.verify.v2.services(verifyServiceSid)
      .verificationChecks
      .create({ to: formattedPhoneNumber, code: otpCode });

    console.log('Twilio Verification Check Status:', verificationCheck.status);

    if (verificationCheck.status === 'approved') {
      let user = await User.findOne({ mobileNumber: formattedPhoneNumber });

      if (!user) {
        // --- Register new user via Phone ---
        let tempUsername = `user_${formattedPhoneNumber.replace(/\D/g,'')}`;
        let tempEmail = `${tempUsername}@phone.placeholder.email`;
        let counter = 1;
        while (await User.findOne({ $or: [{ username: tempUsername }, { email: tempEmail }]})) {
            tempUsername = `user_${formattedPhoneNumber.replace(/\D/g,'')}_${counter}`;
            tempEmail = `${tempUsername}@phone.placeholder.email`;
            counter++;
         }
        user = new User({
          username: tempUsername, email: tempEmail, mobileNumber: formattedPhoneNumber,
          isPhoneVerified: true, password: null, role: 'user'
        });
        await user.save();
        console.log("New user registered via phone:", user.mobileNumber);
      } else {
        // --- Log in existing user via Phone ---
        if (!user.isPhoneVerified) {
          user.isPhoneVerified = true;
          await user.save();
        }
        console.log("User logged in via phone:", user.mobileNumber);
      }

      // 3. Generate JWT
      const payload = { user: { id: user.id } };
      jwt.sign(
        payload, JWT_SECRET, { expiresIn: '1h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token, role: user.role, username: user.username });
        }
      );

    } else {
      res.status(400).json({ message: 'Invalid or expired OTP code.' });
    }
  } catch (err) {
    console.error("!!! TWILIO VERIFY OTP ERROR:", err);
    let errorMessage = 'Failed to verify OTP. Please try again later.';
    let statusCode = err.status || 500;
     if (err.code === 20404 || err.status === 404 ) {
        errorMessage = 'Invalid or expired OTP code.';
        statusCode = 400;
     } else if (err.code === 60202) {
         errorMessage = 'Too many verification attempts.';
         statusCode = 429;
     }
    res.status(statusCode).json({ message: errorMessage, code: err.code });
  }
});


module.exports = router;