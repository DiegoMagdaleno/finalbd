require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const reportRoutes = require('./routes/reports');

const app = express();

const corsOptions = {
  // El origen de tu frontend. CAMBIAR EN PRODUCCION
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos permitidos
  allowedHeaders: 'Content-Type,Authorization', // Encabezados permitidos
  credentials: true
};

app.use(cors(corsOptions)); // <-- Usar CORS con las opciones

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});