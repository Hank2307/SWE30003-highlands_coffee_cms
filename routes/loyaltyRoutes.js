// routes/loyaltyRoutes.js
const express = require('express');
const router = express.Router();

function createLoyaltyRoutes(loyaltyService) {
  
  // GET /loyalty - View all loyalty accounts
  router.get('/', async (req, res) => {
    try {
      const accounts = await loyaltyService.getAllLoyaltyAccounts();
      res.json({
        success: true,
        accounts: accounts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /loyalty/customer/:customerId - Get loyalty account for customer
  router.get('/customer/:customerId', async (req, res) => {
    try {
      const account = await loyaltyService.getLoyaltyAccount(req.params.customerId);
      const balance = await loyaltyService.checkPointsBalance(req.params.customerId);
      
      res.json({
        success: true,
        account: account.toJSON(),
        balance: balance
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /loyalty/top - Get top loyalty members
  router.get('/top', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const topMembers = await loyaltyService.getTopLoyaltyMembers(limit);
      
      res.json({
        success: true,
        topMembers: topMembers,
        count: topMembers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // POST /loyalty/redeem - Redeem loyalty points
  router.post('/redeem', async (req, res) => {
    try {
      const { customerId, points } = req.body;

      if (!customerId || !points) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: customerId or points'
        });
      }

      if (points <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Points must be greater than 0'
        });
      }

      const result = await loyaltyService.redeemPoints(
        parseInt(customerId),
        parseInt(points)
      );

      res.json({
        ...result,
        message: `Successfully redeemed ${points} points for ${loyaltyService.formatCurrency(result.discountAmount)} discount`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // POST /loyalty/add-points - Manually add points (admin function)
  router.post('/add-points', async (req, res) => {
    try {
      const { customerId, amount } = req.body;

      if (!customerId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: customerId or amount'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be greater than 0'
        });
      }

      const result = await loyaltyService.addPoints(
        parseInt(customerId),
        parseFloat(amount)
      );

      res.json({
        ...result,
        message: `Successfully added ${result.pointsAdded} points`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /loyalty/check-balance/:customerId - Check points balance
  router.get('/check-balance/:customerId', async (req, res) => {
    try {
      const balance = await loyaltyService.checkPointsBalance(req.params.customerId);
      res.json({
        success: true,
        ...balance
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  });

  // PUT /loyalty/update-tier/:customerId - Update tier
  router.put('/update-tier/:customerId', async (req, res) => {
    try {
      const result = await loyaltyService.updateTier(req.params.customerId);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}

module.exports = createLoyaltyRoutes;