const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const shard = require('../middleware/shard');
const productService = require('../services/productService');

// Get products for current store
router.get('/', auth, shard, async (req, res) => {
  try {
    const products = await productService.getProductsByStore(req.storeId);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;