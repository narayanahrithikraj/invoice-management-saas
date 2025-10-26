const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let currentUser = await User.findOne({ email: profile.emails[0].value });

        if (currentUser) {
          console.log('[Passport] Existing user found:', currentUser.email);
          done(null, currentUser);
        } else {
          // --- UPDATED: Handle new fields for Google sign-up ---
          console.log('[Passport] Creating new user via Google:', profile.emails[0].value);
          
          // Create a unique username (e.g., from email prefix)
          const emailPrefix = profile.emails[0].value.split('@')[0];
          let potentialUsername = emailPrefix;
          let counter = 1;
          // Ensure username is unique (append number if needed)
          while (await User.findOne({ username: potentialUsername })) {
            potentialUsername = `${emailPrefix}${counter}`;
            counter++;
          }

          const newUser = new User({
            username: potentialUsername, // Use the generated unique username
            email: profile.emails[0].value,
            password: null, // No password for Google users
            // mobileNumber and gender will be null/undefined (optional fields)
            role: 'user'
            // googleId: profile.id // If you added this field
          });
          await newUser.save();
          console.log('[Passport] New user created:', newUser.email, 'with username:', newUser.username);
          done(null, newUser);
        }
      } catch (err) {
        console.error("[Passport] Error in Google Strategy:", err);
        done(err, null);
      }
    }
  )
);