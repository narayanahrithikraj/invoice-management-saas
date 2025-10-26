const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Subscription = require('../models/Subscription');

// Apply auth middleware to all routes
router.use(authMiddleware);

// 1. GET all subscriptions for the logged-in user
// (Endpoint: GET /api/subscriptions)
router.get('/', async (req, res) => {
  try {
    // Populate client data to show client name in the list
    const subscriptions = await Subscription.find({ user: req.user.id })
      .populate('client', 'name') // 'name' specifies we only need the client's name
      .sort({ nextDueDate: 1 }); // Sort by next due date
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. CREATE a new subscription
// (Endpoint: POST /api/subscriptions)
router.post('/', async (req, res) => {
  const { client, amount, description, frequency, nextDueDate } = req.body;

  try {
    const newSubscription = new Subscription({
      user: req.user.id,
      client,
      amount,
      description,
      frequency,
      nextDueDate
    });

    const savedSubscription = await newSubscription.save();
    res.status(201).json(savedSubscription);
  } catch (err) {
    console.log("!!! BACKEND SUB SAVE ERROR:", err);
    res.status(400).json({ message: err.message });
  }
});

// 3. DELETE a subscription
// (Endpoint: DELETE /api/subscriptions/:id)
router.delete('/:id', async (req, res) => {
  try {
    const deletedSub = await Subscription.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id // Ensure user owns this subscription
    });

    if (!deletedSub) {
      return res.status(404).json({ message: 'Subscription not found or user not authorized' });
    }
    
    res.json({ message: 'Subscription deleted successfully' });
  } catch (err) {
    console.log("!!! BACKEND SUB DELETE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;