// package.json dependencies needed:
// npm install express mysql2 cors helmet compression morgan winston
// npm install --save-dev nodemon

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 3000;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console()
  ]
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Database Configuration for Distributed Setup
const DB_CONFIG = {
  // Region 1: North (Stores 1-7)
  north: {
    master: {
      host: process.env.DB_NORTH_MASTER_HOST || 'localhost',
      port: process.env.DB_NORTH_MASTER_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: 'sales_north',
      connectionLimit: 20,
      acquireTimeout: 60000,
      timeout: 60000,
    },
    slave: {
      host: process.env.DB_NORTH_SLAVE_HOST || 'localhost',
      port: process.env.DB_NORTH_SLAVE_PORT || 3307,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: 'sales_north',
      connectionLimit: 15,
      acquireTimeout: 60000,
      timeout: 60000,
    }
  },
  // Region 2: South (Stores 8-14)
  south: {
    master: {
      host: process.env.DB_SOUTH_MASTER_HOST || 'localhost',
      port: process.env.DB_SOUTH_MASTER_PORT || 3308,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: 'sales_south',
      connectionLimit: 20,
      acquireTimeout: 60000,
      timeout: 60000,
    },
    slave: {
      host: process.env.DB_SOUTH_SLAVE_HOST || 'localhost',
      port: process.env.DB_SOUTH_SLAVE_PORT || 3309,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: 'sales_south',
      connectionLimit: 15,
      acquireTimeout: 60000,
      timeout: 60000,
    }
  },
  // Region 3: East (Stores 15-20)
  east: {
    master: {
      host: process.env.DB_EAST_MASTER_HOST || 'localhost',
      port: process.env.DB_EAST_MASTER_PORT || 3310,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: 'sales_east',
      connectionLimit: 20,
      acquireTimeout: 60000,
      timeout: 60000,
    },
    slave: {
      host: process.env.DB_EAST_SLAVE_HOST || 'localhost',
      port: process.env.DB_EAST_SLAVE_PORT || 3311,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: 'sales_east',
      connectionLimit: 15,
      acquireTimeout: 60000,
      timeout: 60000,
    }
  }
};

// Store to Region Mapping
const STORE_REGIONS = {
  1: 'north', 2: 'north', 3: 'north', 4: 'north', 5: 'north', 6: 'north', 7: 'north',
  8: 'south', 9: 'south', 10: 'south', 11: 'south', 12: 'south', 13: 'south', 14: 'south',
  15: 'east', 16: 'east', 17: 'east', 18: 'east', 19: 'east', 20: 'east'
};

// Database Connection Pools
const connectionPools = {};

// Initialize connection pools for each region
Object.keys(DB_CONFIG).forEach(region => {
  connectionPools[region] = {
    master: mysql.createPool(DB_CONFIG[region].master),
    slave: mysql.createPool(DB_CONFIG[region].slave)
  };
});

// Database Helper Functions
class DatabaseManager {
  static getRegionForStore(storeId) {
    return STORE_REGIONS[storeId] || 'north';
  }

  static async executeQuery(region, query, params = [], useReadReplica = false) {
    try {
      const pool = useReadReplica ? 
        connectionPools[region].slave : 
        connectionPools[region].master;
      
      const [results] = await pool.execute(query, params);
      return results;
    } catch (error) {
      logger.error(`Database query error in region ${region}:`, error);
      throw error;
    }
  }

  static async executeTransaction(region, queries) {
    const connection = await connectionPools[region].master.getConnection();
    try {
      await connection.beginTransaction();
      
      const results = [];
      for (const { query, params } of queries) {
        const [result] = await connection.execute(query, params);
        results.push(result);
      }
      
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      logger.error(`Transaction error in region ${region}:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async distributedQuery(query, params = [], useReadReplica = true) {
    const promises = Object.keys(connectionPools).map(region =>
      this.executeQuery(region, query, params, useReadReplica)
        .then(results => ({ region, results }))
        .catch(error => ({ region, error }))
    );

    return await Promise.all(promises);
  }
}

// Routes

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    regions: Object.keys(connectionPools).length
  });
});

// Get all stores
app.get('/api/stores', async (req, res) => {
  try {
    const stores = [];
    for (let i = 1; i <= 20; i++) {
      const region = DatabaseManager.getRegionForStore(i);
      stores.push({
        id: i,
        name: `Store ${i}`,
        region: region,
        address: `Address for Store ${i}`,
        phone: `555-010${i.toString().padStart(2, '0')}`,
        status: 'active'
      });
    }
    res.json(stores);
  } catch (error) {
    logger.error('Error fetching stores:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get store by ID
app.get('/api/stores/:id', async (req, res) => {
  try {
    const storeId = parseInt(req.params.id);
    const region = DatabaseManager.getRegionForStore(storeId);
    
    const query = 'SELECT * FROM stores WHERE store_id = ?';
    const results = await DatabaseManager.executeQuery(region, query, [storeId], true);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    res.json(results[0]);
  } catch (error) {
    logger.error('Error fetching store:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new sale transaction
app.post('/api/sales', async (req, res) => {
  try {
    const { store_id, customer_id, items, payment_method, total_amount } = req.body;
    
    if (!store_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid sale data' });
    }

    const region = DatabaseManager.getRegionForStore(store_id);
    const saleDate = new Date();
    
    // Prepare transaction queries
    const queries = [];
    
    // Insert sale record
    queries.push({
      query: `INSERT INTO sales (store_id, customer_id, sale_date, payment_method, total_amount, status) 
               VALUES (?, ?, ?, ?, ?, 'completed')`,
      params: [store_id, customer_id || null, saleDate, payment_method || 'cash', total_amount]
    });

    // Execute transaction
    const results = await DatabaseManager.executeTransaction(region, queries);
    const saleId = results[0].insertId;

    // Insert sale items (separate queries for simplicity)
    for (const item of items) {
      await DatabaseManager.executeQuery(region, 
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) 
         VALUES (?, ?, ?, ?, ?)`,
        [saleId, item.product_id, item.quantity, item.unit_price, item.total_price]
      );
    }

    logger.info(`Sale created: ID ${saleId}, Store ${store_id}, Region ${region}`);
    
    res.status(201).json({ 
      sale_id: saleId, 
      store_id, 
      region,
      message: 'Sale completed successfully' 
    });
  } catch (error) {
    logger.error('Error creating sale:', error);
    res.status(500).json({ error: 'Failed to process sale' });
  }
});

// Get sales for a specific store
app.get('/api/stores/:id/sales', async (req, res) => {
  try {
    const storeId = parseInt(req.params.id);
    const { page = 1, limit = 50, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    const region = DatabaseManager.getRegionForStore(storeId);
    
    let query = `
      SELECT s.*, 
             COUNT(si.id) as item_count,
             SUM(si.quantity) as total_items
      FROM sales s
      LEFT JOIN sale_items si ON s.sale_id = si.sale_id
      WHERE s.store_id = ?
    `;
    const params = [storeId];
    
    if (date_from) {
      query += ' AND s.sale_date >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND s.sale_date <= ?';
      params.push(date_to);
    }
    
    query += ` 
      GROUP BY s.sale_id
      ORDER BY s.sale_date DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);
    
    const sales = await DatabaseManager.executeQuery(region, query, params, true);
    
    res.json({
      sales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: sales.length
      },
      store_id: storeId,
      region
    });
  } catch (error) {
    logger.error('Error fetching store sales:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate sales report for multiple stores
app.post('/api/reports/sales', async (req, res) => {
  try {
    const { store_ids, date_from, date_to, report_type = 'summary' } = req.body;
    
    if (!store_ids || !Array.isArray(store_ids) || store_ids.length === 0) {
      return res.status(400).json({ error: 'store_ids array is required' });
    }

    const reports = [];
    
    // Group stores by region for efficient querying
    const storesByRegion = {};
    store_ids.forEach(storeId => {
      const region = DatabaseManager.getRegionForStore(storeId);
      if (!storesByRegion[region]) {
        storesByRegion[region] = [];
      }
      storesByRegion[region].push(storeId);
    });

    // Query each region
    for (const [region, stores] of Object.entries(storesByRegion)) {
      let query = `
        SELECT 
          s.store_id,
          COUNT(s.sale_id) as total_sales,
          SUM(s.total_amount) as total_revenue,
          AVG(s.total_amount) as average_sale,
          SUM(si.quantity) as total_items_sold,
          DATE(s.sale_date) as sale_date
        FROM sales s
        LEFT JOIN sale_items si ON s.sale_id = si.sale_id
        WHERE s.store_id IN (${stores.map(() => '?').join(',')})
      `;
      
      const params = [...stores];
      
      if (date_from) {
        query += ' AND s.sale_date >= ?';
        params.push(date_from);
      }
      
      if (date_to) {
        query += ' AND s.sale_date <= ?';
        params.push(date_to);
      }
      
      if (report_type === 'daily') {
        query += ' GROUP BY s.store_id, DATE(s.sale_date)';
      } else {
        query += ' GROUP BY s.store_id';
      }
      
      query += ' ORDER BY s.store_id, sale_date DESC';
      
      const regionResults = await DatabaseManager.executeQuery(region, query, params, true);
      reports.push({
        region,
        stores: stores,
        data: regionResults
      });
    }

    // Aggregate results
    const aggregatedReport = {
      report_type,
      date_range: { from: date_from, to: date_to },
      stores_requested: store_ids,
      regions_queried: Object.keys(storesByRegion),
      total_stores: store_ids.length,
      reports,
      summary: {
        total_sales: 0,
        total_revenue: 0,
        total_items_sold: 0
      }
    };

    // Calculate summary
    reports.forEach(report => {
      report.data.forEach(row => {
        aggregatedReport.summary.total_sales += row.total_sales || 0;
        aggregatedReport.summary.total_revenue += parseFloat(row.total_revenue || 0);
        aggregatedReport.summary.total_items_sold += row.total_items_sold || 0;
      });
    });

    logger.info(`Sales report generated for stores: ${store_ids.join(', ')}`);
    res.json(aggregatedReport);
  } catch (error) {
    logger.error('Error generating sales report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get products (distributed across all regions)
app.get('/api/products', async (req, res) => {
  try {
    const { page = 1, limit = 100, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    
    if (search) {
      query += ' AND (name LIKE ? OR barcode LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY name LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    // Query first available region (products should be synchronized across regions)
    const region = 'north';
    const products = await DatabaseManager.executeQuery(region, query, params, true);
    
    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory for a specific store
app.get('/api/stores/:id/inventory', async (req, res) => {
  try {
    const storeId = parseInt(req.params.id);
    const region = DatabaseManager.getRegionForStore(storeId);
    
    const query = `
      SELECT 
        i.*,
        p.name as product_name,
        p.barcode,
        p.category
      FROM inventory i
      JOIN products p ON i.product_id = p.product_id
      WHERE i.store_id = ?
      ORDER BY p.name
    `;
    
    const inventory = await DatabaseManager.executeQuery(region, query, [storeId], true);
    
    res.json({
      store_id: storeId,
      region,
      inventory
    });
  } catch (error) {
    logger.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Performance monitoring endpoint
app.get('/api/performance', async (req, res) => {
  try {
    const performance = {};
    
    for (const region of Object.keys(connectionPools)) {
      const startTime = Date.now();
      await DatabaseManager.executeQuery(region, 'SELECT 1', [], true);
      const responseTime = Date.now() - startTime;
      
      performance[region] = {
        response_time_ms: responseTime,
        status: responseTime < 1000 ? 'healthy' : 'slow'
      };
    }
    
    res.json({
      timestamp: new Date().toISOString(),
      regions: performance,
      overall_status: Object.values(performance).every(p => p.status === 'healthy') ? 'healthy' : 'degraded'
    });
  } catch (error) {
    logger.error('Error checking performance:', error);
    res.status(500).json({ error: 'Performance check failed' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close all database connections
  for (const region of Object.keys(connectionPools)) {
    await connectionPools[region].master.end();
    await connectionPools[region].slave.end();
  }
  
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`Distributed Sales API server running on port ${PORT}`);
  logger.info(`Configured regions: ${Object.keys(connectionPools).join(', ')}`);
});

module.exports = app;