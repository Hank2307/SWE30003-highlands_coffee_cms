// routes/branchRoutes.js
const express = require('express');
const router = express.Router();

function createBranchRoutes(branchService) {
  
  // GET /branches - View all branches
  router.get('/', async (req, res) => {
    try {
      const branches = await branchService.getAllBranches();
      res.json({
        success: true,
        branches: branches.map(b => b.toJSON())
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /branches/:id - Get specific branch
  router.get('/:id', async (req, res) => {
    try {
      const branch = await branchService.getBranchById(req.params.id);
      res.json({
        success: true,
        branch: branch.toJSON()
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  });

  // POST /branches - Create new branch
  router.post('/', async (req, res) => {
    try {
      const { name, address, phone } = req.body;

      if (!name || !address) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name or address'
        });
      }

      const branch = await branchService.createBranch(name, address, phone);
      res.status(201).json({
        success: true,
        branch: branch.toJSON(),
        message: 'Branch created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // PUT /branches/:id - Update branch
  router.put('/:id', async (req, res) => {
    try {
      const { name, address, phone } = req.body;

      if (!name || !address) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name or address'
        });
      }

      const branch = await branchService.updateBranch(
        req.params.id,
        name,
        address,
        phone
      );
      
      res.json({
        success: true,
        branch: branch.toJSON(),
        message: 'Branch updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // DELETE /branches/:id - Delete branch
  router.delete('/:id', async (req, res) => {
    try {
      const result = await branchService.deleteBranch(req.params.id);
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

module.exports = createBranchRoutes;