// server.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Import DatabaseManager
const DatabaseManager = require('./config/DatabaseManager');

// Import Services
const NotificationService = require('./services/NotificationService');
const BranchService = require('./services/BranchService');
const InventoryService = require('./services/InventoryService');
const LoyaltyService = require('./services/LoyaltyService');
const PaymentService = require('./services/PaymentService');
const OrderService = require('./services/OrderService');

// Import Routes
const createOrderRoutes = require('./routes/orderRoutes');
const createInventoryRoutes = require('./routes/inventoryRoutes');
const createLoyaltyRoutes = require('./routes/loyaltyRoutes');
const createBranchRoutes = require('./routes/branchRoutes');
const createPaymentRoutes = require('./routes/paymentRoutes');
const createCustomerRoutes = require('./routes/customerRoutes');
const createMenuRoutes = require('./routes/menuRoutes');

// Configuration
const PORT = process.env.PORT || 3000;
const DB_PATH = 'hc_cms.db';

// Initialize Express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// CORS middleware (for development)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Bootstrap function
async function bootstrap() {
  try {
    console.log('========================================');
    console.log('HC-CMS - Highlands Coffee Management System');
    console.log('========================================\n');

    // Step 1: Initialize Database
    console.log('📦 Initializing database...');
    const dbManager = DatabaseManager.getInstance(DB_PATH);
    await dbManager.initializeSchema();
    console.log('✓ Database schema initialized\n');

    // Step 2: Seed initial data
    console.log('🌱 Seeding initial data...');
    await dbManager.seedInitialData();
    console.log('✓ Initial data seeded\n');

    // Step 3: Create Services
    console.log('🔧 Creating services...');
    const notificationService = new NotificationService();
    const branchService = new BranchService(dbManager);
    const inventoryService = new InventoryService(dbManager, notificationService, branchService);
    const loyaltyService = new LoyaltyService(dbManager);
    const paymentService = new PaymentService(dbManager);
    const orderService = new OrderService(
      dbManager,
      paymentService,
      inventoryService,
      loyaltyService,
      notificationService
    );
    console.log('✓ Services created\n');

    // Step 4: Register Routes
    console.log('🛣️  Registering routes...');
    app.use('/api/orders', createOrderRoutes(orderService, inventoryService, branchService, loyaltyService));
    app.use('/api/inventory', createInventoryRoutes(inventoryService, branchService));
    app.use('/api/loyalty', createLoyaltyRoutes(loyaltyService));
    app.use('/api/branches', createBranchRoutes(branchService));
    app.use('/api/payments', createPaymentRoutes(paymentService));
    app.use('/api/customers', createCustomerRoutes(dbManager));
    app.use('/api/menu', createMenuRoutes(dbManager));
    console.log('✓ Routes registered\n');

    // Root route
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        message: 'HC-CMS API is running',
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path
      });
    });

    // Error handler
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
      });
    });

    // Step 5: Start Server
    app.listen(PORT, () => {
      console.log('========================================');
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log('========================================\n');
      console.log('📋 Available Endpoints:');
      console.log('   GET    http://localhost:' + PORT + '/');
      console.log('   GET    http://localhost:' + PORT + '/api/health');
      console.log('   GET    http://localhost:' + PORT + '/api/orders');
      console.log('   POST   http://localhost:' + PORT + '/api/orders/create');
      console.log('   GET    http://localhost:' + PORT + '/api/inventory');
      console.log('   GET    http://localhost:' + PORT + '/api/loyalty');
      console.log('   GET    http://localhost:' + PORT + '/api/branches');
      console.log('   GET    http://localhost:' + PORT + '/api/payments');
      console.log('   GET    http://localhost:' + PORT + '/api/customers');
      console.log('   GET    http://localhost:' + PORT + '/api/menu');
      console.log('\n========================================\n');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down gracefully...');
      await dbManager.close();
      console.log('✓ Database connection closed');
      console.log('👋 Goodbye!\n');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap();