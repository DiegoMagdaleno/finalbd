const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const shard = require('../middleware/shard');
const salesService = require('../services/salesService');

// Record new sale
router.post('/', auth, shard, async (req, res) => {
  try {
    const sale = await salesService.recordSale(
      req.storeId,
      req.user.id,
      req.body.items
    );
    res.status(201).json(sale);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get recent sales for current store
router.get('/', auth, shard, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const sales = await salesService.getRecentSales(req.storeId, limit);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;