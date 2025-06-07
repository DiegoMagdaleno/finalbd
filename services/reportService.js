const { getStoreConnection } = require('../config/db');

async function generateSalesReport(storeIds, startDate, endDate) {
  const report = {};
  
  for (const storeId of storeIds) {
    try {
      const db = await getStoreConnection(storeId);
      
      // Daily sales summary
      const [dailySales] = await db.query(
        `SELECT 
          DATE(timestamp) AS date,
          SUM(amount) AS total_sales,
          COUNT(id) AS transactions,
          SUM(quantity) AS items_sold
        FROM sales
        WHERE timestamp BETWEEN ? AND ?
        GROUP BY DATE(timestamp)
        ORDER BY date ASC`,
        [startDate, endDate]
      );
      
      // Top products
      const [topProducts] = await db.query(
        `SELECT 
          p.name,
          SUM(s.quantity) AS total_quantity,
          SUM(s.amount) AS total_amount
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE s.timestamp BETWEEN ? AND ?
        GROUP BY p.id
        ORDER BY total_quantity DESC
        LIMIT 10`,
        [startDate, endDate]
      );
      
      report[storeId] = {
        dailySales,
        topProducts
      };
    } catch (error) {
      report[storeId] = { error: error.message };
    }
  }
  
  return report;
}

module.exports = {
  generateSalesReport
};