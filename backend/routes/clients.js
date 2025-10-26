const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Client = require('../models/Client');

// Apply auth middleware to all client routes
router.use(authMiddleware);

// 1. GET all clients for the logged-in user
// (Endpoint: GET /api/clients)
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find({ user: req.user.id });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. CREATE a new client
// (Endpoint: POST /api/clients)
router.post('/', async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    const newClient = new Client({
      name,
      email,
      phone,
      user: req.user.id // Link to the logged-in user
    });

    const savedClient = await newClient.save();
    res.status(201).json(savedClient);
  } catch (err) {
    console.log("!!! BACKEND CLIENT SAVE ERROR:", err);
    res.status(400).json({ message: err.message });
  }
});

// 3. DELETE a client
// (Endpoint: DELETE /api/clients/:id)
router.delete('/:id', async (req, res) => {
  try {
    const deletedClient = await Client.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id // Ensure user owns this client
    });

    if (!deletedClient) {
      return res.status(404).json({ message: 'Client not found or user not authorized' });
    }
    
    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    console.log("!!! BACKEND CLIENT DELETE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// Note: We can add an UPDATE (PUT/PATCH) route later if needed.
// This is enough for now.

module.exports = router;