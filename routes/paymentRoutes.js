// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();

function createPaymentRoutes(paymentService) {
  
  // GET /payments - View all payments
  router.get('/', async (req, res) => {
    try {
      const payments = await paymentService.getAllPayments();
      res.json({
        success: true,
        payments: payments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /payments/transaction/:id - Get specific transaction
  router.get('/transaction/:id', async (req, res) => {
    try {
      const transaction = await paymentService.getPaymentTransaction(req.params.id);
      res.json({
        success: true,
        transaction: transaction
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /payments/order/:orderId - Get payments for specific order
  router.get('/order/:orderId', async (req, res) => {
    try {
      const payments = await paymentService.getPaymentsByOrder(req.params.orderId);
      res.json({
        success: true,
        payments: payments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /payments/statistics - Get payment statistics
  router.get('/statistics', async (req, res) => {
    try {
      const stats = await paymentService.getPaymentStatistics();
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

module.exports = createPaymentRoutes;