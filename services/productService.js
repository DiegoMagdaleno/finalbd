const { getStoreConnection } = require('../config/db');

async function getProductsByStore(storeId) {
  const db = await getStoreConnection(storeId);
  const [products] = await db.query(
    'SELECT id, name, price, stock, category FROM products'
  );
  return products;
}

module.exports = {
  getProductsByStore
};