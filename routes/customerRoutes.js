// routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

function createCustomerRoutes(dbManager) {
  
  // GET /customers - View all customers
  router.get('/', async (req, res) => {
    try {
      const rows = await dbManager.all('SELECT * FROM customers ORDER BY name');
      const customers = rows.map(row => Customer.fromDatabase(row));
      
      res.json({
        success: true,
        customers: customers.map(c => c.toJSON())
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /customers/:id - Get specific customer
  router.get('/:id', async (req, res) => {
    try {
      const row = await dbManager.get('SELECT * FROM customers WHERE id = ?', [req.params.id]);
      
      if (!row) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      const customer = Customer.fromDatabase(row);
      res.json({
        success: true,
        customer: customer.toJSON()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // POST /customers - Create new customer
  router.post('/', async (req, res) => {
    try {
      const { name, email, phone } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Name is required'
        });
      }

      const result = await dbManager.run(
        'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
        [name, email, phone]
      );

      // Create loyalty account for new customer
      await dbManager.run(
        'INSERT INTO loyalty_accounts (customer_id, points, tier) VALUES (?, ?, ?)',
        [result.lastID, 0, 'Bronze']
      );

      const customer = new Customer(result.lastID, name, email, phone);
      
      res.status(201).json({
        success: true,
        customer: customer.toJSON(),
        message: 'Customer created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // PUT /customers/:id - Update customer
  router.put('/:id', async (req, res) => {
    try {
      const { name, email, phone } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Name is required'
        });
      }

      const result = await dbManager.run(
        'UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?',
        [name, email, phone, req.params.id]
      );

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      const customer = new Customer(parseInt(req.params.id), name, email, phone);
      
      res.json({
        success: true,
        customer: customer.toJSON(),
        message: 'Customer updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // DELETE /customers/:id - Delete customer
  router.delete('/:id', async (req, res) => {
    try {
      const result = await dbManager.run('DELETE FROM customers WHERE id = ?', [req.params.id]);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      res.json({
        success: true,
        message: 'Customer deleted successfully'
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

module.exports = createCustomerRoutes;