  const mysql = require('mysql2/promise');
  const shardMap = require('./shardMap');

  // Central DB configuration
  const centralDbConfig = {
    host: process.env.CENTRAL_DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.CENTRAL_DB_NAME,
    waitForConnections: true,
    port: process.env.CENTRAL_DB_PORT || 3306,
    connectionLimit: 10
  };

  // Create central DB pool
  const centralPool = mysql.createPool(centralDbConfig);

  // Get store-specific connection
  async function getStoreConnection(storeId) {
    const config = shardMap[storeId];
    if (!config) {
      throw new Error(`Shard configuration not found for store ${storeId}`);
    }
    
    const poolConfig = {
      host: config.host,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: config.database,
      connectionLimit: 10
    };

    if (config.port) {
      poolConfig.port = config.port;
    }

    return mysql.createPool(poolConfig);
  }

  module.exports = {
    centralPool,
    getStoreConnection
  };