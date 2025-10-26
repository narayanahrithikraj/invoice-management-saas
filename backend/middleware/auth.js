const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET; // Read directly from env

// Add check to ensure secret is loaded
if (!JWT_SECRET) {
  console.error("FATAL ERROR in middleware: JWT_SECRET environment variable is not defined!");
  // Optionally, throw an error or exit in a real app, but log for now
}

function authMiddleware(req, res, next) {
  // 1. Get the token from the request header
  const token = req.header('x-auth-token');

  // --- ADD LOGGING ---
  console.log("\n--- Auth Middleware Check ---");
  console.log("Incoming Request Path:", req.originalUrl);
  console.log("Token from header:", token);
  console.log("Secret being used for verify:", JWT_SECRET);
  // --- END LOGGING ---


  // 2. Check if no token
  if (!token) {
    console.log("Middleware Result: No token provided.");
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // 3. Verify the token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // --- ADD LOGGING ---
    console.log("Middleware Result: Token VERIFIED successfully.");
    console.log("Decoded Payload:", decoded);
    // --- END LOGGING ---

    req.user = decoded.user;
    next();
  } catch (err) {
    // --- ADD LOGGING ---
    console.error("Middleware Result: Token VERIFICATION FAILED.");
    console.error("Verification Error:", err.name, "-", err.message); // Log specific error
    // --- END LOGGING ---
    res.status(401).json({ message: 'Token is not valid' }); // Keep generic message for user
  }
}

module.exports = authMiddleware;