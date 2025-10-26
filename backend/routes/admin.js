const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client'); // <-- Import Client model

// Protect all admin routes
router.use(authMiddleware); 
router.use(adminMiddleware); 

// 1. GET Admin Dashboard Stats (Simple)
router.get('/stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const invoiceCount = await Invoice.countDocuments();
    
    res.json({
      message: 'Welcome, Admin!',
      totalUsers: userCount,
      totalInvoices: invoiceCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. GET Full Dashboard Data (for graphs)
// (Endpoint: GET /api/admin/dashboard-data)
router.get('/dashboard-data', async (req, res) => {
  try {
    // 1. Get total counts
    const totalUsers = await User.countDocuments();
    const totalClients = await Client.countDocuments();

    // 2. Calculate Revenue (Total, Pending, Paid)
    const revenueStats = await Invoice.aggregate([
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    let totalRevenue = 0;
    let pendingRevenue = 0;
    let paidRevenue = 0;

    revenueStats.forEach(stat => {
      totalRevenue += stat.totalAmount;
      if (stat._id === 'pending') {
        pendingRevenue = stat.totalAmount;
      } else if (stat._id === 'paid') {
        paidRevenue = stat.totalAmount;
      }
    });

    // 3. Get Revenue by Month (for line chart)
    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          status: 'paid' // Only count paid invoices
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" }, 
            month: { $month: "$createdAt" } 
          },
          revenue: { $sum: "$amount" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      },
      {
        $project: {
          _id: 0,
          name: { 
            $concat: [ 
              { $toString: "$_id.year" }, "-", 
              { $toString: "$_id.month" } 
            ] 
          },
          revenue: "$revenue"
        }
      }
    ]);

    // Send all data
    res.json({
      totalUsers,
      totalClients,
      totalRevenue,
      pendingRevenue,
      paidRevenue,
      monthlyRevenue // This will be an array like [{ name: "2025-10", revenue: 500 }]
    });

  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;