const jwt = require('jsonwebtoken');
const { centralPool } = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists in central DB
    const [user] = await centralPool.query(
      'SELECT id, store_id, role FROM users WHERE id = ?',
      [decoded.userId]
    );
    
    if (!user || user.length === 0) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    req.user = {
      id: user[0].id,
      storeId: user[0].store_id,
      role: user[0].role
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};