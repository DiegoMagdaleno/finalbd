module.exports = (req, res, next) => {
  if (!req.user || !req.user.storeId) {
    return res.status(403).json({ error: 'Store assignment required' });
  }
  
  req.storeId = req.user.storeId;
  next();
};