const User = require('../models/User');

const adminMiddleware = async (req, res, next) => {
  try {
    // We assume 'authMiddleware' has already run and added 'req.user.id'
    
    // 1. Find the user in the database
    const user = await User.findById(req.user.id);

    // 2. Check if user exists and if their role is 'admin'
    if (user && user.role === 'admin') {
      next(); // User is an admin, proceed to the route
    } else {
      res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
  } catch (err) {
    console.error('Error in admin middleware:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = adminMiddleware;