// routes/orderRoutes.js
const express = require('express');
const router = express.Router();

function createOrderRoutes(orderService, inventoryService, branchService, loyaltyService) {
  
  // GET /orders - View all orders
  router.get('/', async (req, res) => {
    try {
      const orders = await orderService.getAllOrders();
      res.json({
        success: true,
        orders: orders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /orders/new - Show create order form data
  router.get('/new', async (req, res) => {
    try {
      const branches = await branchService.getAllBranches();
      const customers = await orderService.db.all('SELECT * FROM customers');
      
      // Get menu items with stock info for first branch (or selected branch)
      const branchId = req.query.branchId || (branches.length > 0 ? branches[0].id : null);
      let menuItems = [];
      
      if (branchId) {
        const inventory = await inventoryService.getInventoryByBranch(branchId);
        menuItems = inventory.filter(item => item.quantity > 0);
      }

      res.json({
        success: true,
        branches: branches.map(b => b.toJSON()),
        customers: customers,
        menuItems: menuItems
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // POST /orders/create - Create new order
  router.post('/create', async (req, res) => {
    try {
      const { customerId, branchId, items, paymentType, paymentDetails, loyaltyPointsToRedeem } = req.body;

      // Validate required fields
      if (!customerId || !branchId || !paymentType) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: customerId, branchId, or paymentType'
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Order must contain at least one item'
        });
      }

      // Parse items if they come as strings
      const parsedItems = items.map(item => ({
        menuItemId: parseInt(item.menuItemId),
        quantity: parseInt(item.quantity)
      }));

      // Create order
      const result = await orderService.createOrder({
        customerId: parseInt(customerId),
        branchId: parseInt(branchId),
        items: parsedItems,
        paymentType: paymentType,
        paymentDetails: paymentDetails || {},
        loyaltyPointsToRedeem: loyaltyPointsToRedeem ? parseInt(loyaltyPointsToRedeem) : 0
      });

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /orders/:id - Get specific order
  router.get('/:id', async (req, res) => {
    try {
      const order = await orderService.getOrderById(req.params.id);
      res.json({
        success: true,
        order: order.toJSON()
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  });

  // PUT /orders/:id/status - Update order status
  router.put('/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required'
        });
      }

      const result = await orderService.updateOrderStatus(req.params.id, status);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // DELETE /orders/:id - Cancel order
  router.delete('/:id', async (req, res) => {
    try {
      const result = await orderService.cancelOrder(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /orders/customer/:customerId - Get orders by customer
  router.get('/customer/:customerId', async (req, res) => {
    try {
      const orders = await orderService.getOrdersByCustomer(req.params.customerId);
      res.json({
        success: true,
        orders: orders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /orders/branch/:branchId - Get orders by branch
  router.get('/branch/:branchId', async (req, res) => {
    try {
      const orders = await orderService.getOrdersByBranch(req.params.branchId);
      res.json({
        success: true,
        orders: orders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /orders/stats - Get order statistics
  router.get('/statistics/summary', async (req, res) => {
    try {
      const stats = await orderService.getOrderStatistics();
      res.json({
        success: true,
        statistics: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}

module.exports = createOrderRoutes;