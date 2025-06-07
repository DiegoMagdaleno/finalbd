const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const reportService = require('../services/reportService');

// Manager role check middleware
const requireManager = (req, res, next) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
};

// Generate sales report for multiple stores
router.get('/sales', auth, requireManager, async (req, res) => {
  try {
    const storeIds = req.query.storeIds.split(',').map(id => parseInt(id));
    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);
    
    if (storeIds.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 stores per report' });
    }

    const report = await reportService.generateSalesReport(
      storeIds,
      startDate,
      endDate
    );

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;