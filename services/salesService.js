const { getStoreConnection } = require('../config/db');

async function recordSale(storeId, userId, items) {
  const db = await getStoreConnection(storeId);
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const saleItems = [];
    let totalAmount = 0;

    for (const item of items) {
      // Update product stock
      const [updateResult] = await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.productId]
      );
      
      if (updateResult.affectedRows === 0) {
        throw new Error(`Product ${item.productId} not found or out of stock`);
      }
      
      // Record sale item
      const [saleResult] = await connection.query(
        'INSERT INTO sales (product_id, quantity, amount, user_id) VALUES (?, ?, ?, ?)',
        [item.productId, item.quantity, item.price * item.quantity, userId]
      );
      
      saleItems.push({
        id: saleResult.insertId,
        productId: item.productId,
        quantity: item.quantity,
        amount: item.price * item.quantity
      });
      
      totalAmount += item.price * item.quantity;
    }
    
    await connection.commit();
    
    return {
      storeId,
      userId,
      totalAmount,
      items: saleItems,
      timestamp: new Date()
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getRecentSales(storeId, limit = 50) {
  const db = await getStoreConnection(storeId);
  const [sales] = await db.query(
    `SELECT s.id, p.name AS product_name, s.quantity, s.amount, s.timestamp 
     FROM sales s
     JOIN products p ON s.product_id = p.id
     ORDER BY s.timestamp DESC
     LIMIT ?`,
    [limit]
  );
  return sales;
}

module.exports = {
  recordSale,
  getRecentSales
};