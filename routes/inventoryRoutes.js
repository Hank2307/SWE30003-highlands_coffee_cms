// routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();

function createInventoryRoutes(inventoryService, branchService) {
  
  // GET /inventory - View all inventory
  router.get('/', async (req, res) => {
    try {
      const inventory = await inventoryService.getAllInventory();
      res.json({
        success: true,
        inventory: inventory
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /inventory/branch/:branchId - Get inventory for specific branch
  router.get('/branch/:branchId', async (req, res) => {
    try {
      const inventory = await inventoryService.getInventoryByBranch(req.params.branchId);
      const branch = await branchService.getBranchById(req.params.branchId);
      
      res.json({
        success: true,
        branch: branch.toJSON(),
        inventory: inventory
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /inventory/low-stock - Get low stock items
  router.get('/low-stock', async (req, res) => {
    try {
      const lowStockItems = await inventoryService.getLowStockItems();
      res.json({
        success: true,
        lowStockItems: lowStockItems,
        count: lowStockItems.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // POST /inventory/restock - Restock an item
  router.post('/restock', async (req, res) => {
    try {
      const { menuItemId, branchId, quantity } = req.body;

      if (!menuItemId || !branchId || !quantity) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: menuItemId, branchId, or quantity'
        });
      }

      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantity must be greater than 0'
        });
      }

      const result = await inventoryService.restockItem(
        parseInt(menuItemId),
        parseInt(branchId),
        parseInt(quantity)
      );

      res.json({
        success: true,
        message: `Successfully restocked ${result.menuItemName} at ${result.branchName}`,
        ...result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // PUT /inventory/threshold - Update stock threshold
  router.put('/threshold', async (req, res) => {
    try {
      const { menuItemId, branchId, threshold } = req.body;

      if (!menuItemId || !branchId || threshold === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: menuItemId, branchId, or threshold'
        });
      }

      if (threshold < 0) {
        return res.status(400).json({
          success: false,
          error: 'Threshold must be 0 or greater'
        });
      }

      const result = await inventoryService.updateStockThreshold(
        parseInt(menuItemId),
        parseInt(branchId),
        parseInt(threshold)
      );

      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // POST /inventory/check-stock - Check stock availability
  router.post('/check-stock', async (req, res) => {
    try {
      const { menuItemId, branchId, quantity } = req.body;

      if (!menuItemId || !branchId || !quantity) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: menuItemId, branchId, or quantity'
        });
      }

      const result = await inventoryService.checkStock(
        parseInt(menuItemId),
        parseInt(branchId),
        parseInt(quantity)
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}

module.exports = createInventoryRoutes;