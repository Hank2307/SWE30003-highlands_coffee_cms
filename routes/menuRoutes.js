// routes/menuRoutes.js
const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

function createMenuRoutes(dbManager) {
  
  // GET /menu - View all menu items
  router.get('/', async (req, res) => {
    try {
      const rows = await dbManager.all('SELECT * FROM menu_items ORDER BY category, name');
      const menuItems = rows.map(row => MenuItem.fromDatabase(row));
      
      res.json({
        success: true,
        menuItems: menuItems.map(m => m.toJSON())
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /menu/category/:category - Get menu items by category
  router.get('/category/:category', async (req, res) => {
    try {
      const rows = await dbManager.all(
        'SELECT * FROM menu_items WHERE category = ? ORDER BY name',
        [req.params.category]
      );
      
      const menuItems = rows.map(row => MenuItem.fromDatabase(row));
      
      res.json({
        success: true,
        category: req.params.category,
        menuItems: menuItems.map(m => m.toJSON())
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /menu/:id - Get specific menu item
  router.get('/:id', async (req, res) => {
    try {
      const row = await dbManager.get('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
      
      if (!row) {
        return res.status(404).json({
          success: false,
          error: 'Menu item not found'
        });
      }

      const menuItem = MenuItem.fromDatabase(row);
      res.json({
        success: true,
        menuItem: menuItem.toJSON()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // POST /menu - Create new menu item
  router.post('/', async (req, res) => {
    try {
      const { name, description, price, category } = req.body;

      if (!name || !price || !category) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, price, or category'
        });
      }

      if (price <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Price must be greater than 0'
        });
      }

      const result = await dbManager.run(
        'INSERT INTO menu_items (name, description, price, category) VALUES (?, ?, ?, ?)',
        [name, description, price, category]
      );

      const menuItem = new MenuItem(result.lastID, name, description, price, category, true);
      
      res.status(201).json({
        success: true,
        menuItem: menuItem.toJSON(),
        message: 'Menu item created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // PUT /menu/:id - Update menu item
  router.put('/:id', async (req, res) => {
    try {
      const { name, description, price, category, available } = req.body;

      if (!name || !price || !category) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, price, or category'
        });
      }

      if (price <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Price must be greater than 0'
        });
      }

      const result = await dbManager.run(
        'UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, available = ? WHERE id = ?',
        [name, description, price, category, available ? 1 : 0, req.params.id]
      );

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Menu item not found'
        });
      }

      const menuItem = new MenuItem(
        parseInt(req.params.id),
        name,
        description,
        price,
        category,
        available
      );
      
      res.json({
        success: true,
        menuItem: menuItem.toJSON(),
        message: 'Menu item updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // DELETE /menu/:id - Delete menu item
  router.delete('/:id', async (req, res) => {
    try {
      const result = await dbManager.run('DELETE FROM menu_items WHERE id = ?', [req.params.id]);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Menu item not found'
        });
      }

      res.json({
        success: true,
        message: 'Menu item deleted successfully'
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

module.exports = createMenuRoutes;