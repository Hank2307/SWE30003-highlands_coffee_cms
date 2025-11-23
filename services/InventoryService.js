// services/InventoryService.js
const MenuItem = require('../models/MenuItem');

class InventoryService {
  constructor(dbManager, notificationService, branchService) {
    this.db = dbManager;
    this.notificationService = notificationService;
    this.branchService = branchService;
  }

  async getInventoryByBranch(branchId) {
    try {
      const query = `
        SELECT 
          i.id,
          i.menu_item_id,
          i.branch_id,
          i.quantity,
          i.low_stock_threshold,
          m.name as menu_item_name,
          m.price,
          m.category
        FROM inventory i
        JOIN menu_items m ON i.menu_item_id = m.id
        WHERE i.branch_id = ?
        ORDER BY m.category, m.name
      `;
      
      const rows = await this.db.all(query, [branchId]);
      return rows;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw new Error('Failed to fetch inventory');
    }
  }

  async getAllInventory() {
    try {
      const query = `
        SELECT 
          i.id,
          i.menu_item_id,
          i.branch_id,
          i.quantity,
          i.low_stock_threshold,
          m.name as menu_item_name,
          m.price,
          m.category,
          b.name as branch_name
        FROM inventory i
        JOIN menu_items m ON i.menu_item_id = m.id
        JOIN branches b ON i.branch_id = b.id
        ORDER BY b.name, m.category, m.name
      `;
      
      const rows = await this.db.all(query);
      return rows;
    } catch (error) {
      console.error('Error fetching all inventory:', error);
      throw new Error('Failed to fetch inventory');
    }
  }

  async checkStock(menuItemId, branchId, requiredQuantity) {
    try {
      const row = await this.db.get(
        'SELECT quantity FROM inventory WHERE menu_item_id = ? AND branch_id = ?',
        [menuItemId, branchId]
      );

      if (!row) {
        return { available: false, currentStock: 0 };
      }

      return {
        available: row.quantity >= requiredQuantity,
        currentStock: row.quantity
      };
    } catch (error) {
      console.error('Error checking stock:', error);
      throw new Error('Failed to check stock');
    }
  }

  async updateStock(orderItems, branchId) {
    try {
      const updates = [];
      const notifications = [];

      for (const item of orderItems) {
        // Check current stock
        const stockCheck = await this.checkStock(item.menuItemId, branchId, item.quantity);
        
        if (!stockCheck.available) {
          throw new Error(`Insufficient stock for item ID ${item.menuItemId}. Available: ${stockCheck.currentStock}, Required: ${item.quantity}`);
        }

        // Deduct stock
        const result = await this.db.run(
          `UPDATE inventory 
           SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP 
           WHERE menu_item_id = ? AND branch_id = ?`,
          [item.quantity, item.menuItemId, branchId]
        );

        if (result.changes > 0) {
          const newStock = stockCheck.currentStock - item.quantity;
          updates.push({
            menuItemId: item.menuItemId,
            quantityDeducted: item.quantity,
            newStock: newStock
          });

          // Get item and branch details for notification
          const menuItem = await this.db.get('SELECT name FROM menu_items WHERE id = ?', [item.menuItemId]);
          const branch = await this.branchService.getBranchById(branchId);

          // Create inventory update notification
          this.notificationService.createInventoryUpdate(
            menuItem.name,
            branch.name,
            item.quantity,
            newStock
          );

          // Check for low stock and create alert if needed
          await this.checkLowStock(item.menuItemId, branchId, newStock);
        }
      }

      return {
        success: true,
        updates: updates
      };
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  async checkLowStock(menuItemId, branchId, currentStock = null) {
    try {
      const query = `
        SELECT 
          i.quantity,
          i.low_stock_threshold,
          m.name as menu_item_name,
          b.name as branch_name
        FROM inventory i
        JOIN menu_items m ON i.menu_item_id = m.id
        JOIN branches b ON i.branch_id = b.id
        WHERE i.menu_item_id = ? AND i.branch_id = ?
      `;
      
      const row = await this.db.get(query, [menuItemId, branchId]);
      
      if (!row) return null;

      const stock = currentStock !== null ? currentStock : row.quantity;

      if (stock <= row.low_stock_threshold) {
        return this.notificationService.createLowStockAlert(
          row.menu_item_name,
          row.branch_name,
          stock,
          row.low_stock_threshold
        );
      }

      return null;
    } catch (error) {
      console.error('Error checking low stock:', error);
      return null;
    }
  }

  async getLowStockItems() {
    try {
      const query = `
        SELECT 
          i.id,
          i.menu_item_id,
          i.branch_id,
          i.quantity,
          i.low_stock_threshold,
          m.name as menu_item_name,
          b.name as branch_name
        FROM inventory i
        JOIN menu_items m ON i.menu_item_id = m.id
        JOIN branches b ON i.branch_id = b.id
        WHERE i.quantity <= i.low_stock_threshold
        ORDER BY i.quantity ASC
      `;
      
      const rows = await this.db.all(query);
      return rows;
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw new Error('Failed to fetch low stock items');
    }
  }

  async restockItem(menuItemId, branchId, quantity) {
    try {
      const result = await this.db.run(
        `UPDATE inventory 
         SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP 
         WHERE menu_item_id = ? AND branch_id = ?`,
        [quantity, menuItemId, branchId]
      );

      if (result.changes === 0) {
        throw new Error('Inventory item not found');
      }

      // Get updated stock
      const updated = await this.db.get(
        `SELECT i.quantity, m.name as menu_item_name, b.name as branch_name
         FROM inventory i
         JOIN menu_items m ON i.menu_item_id = m.id
         JOIN branches b ON i.branch_id = b.id
         WHERE i.menu_item_id = ? AND i.branch_id = ?`,
        [menuItemId, branchId]
      );

      return {
        success: true,
        menuItemName: updated.menu_item_name,
        branchName: updated.branch_name,
        quantityAdded: quantity,
        newStock: updated.quantity
      };
    } catch (error) {
      console.error('Error restocking item:', error);
      throw error;
    }
  }

  async updateStockThreshold(menuItemId, branchId, newThreshold) {
    try {
      const result = await this.db.run(
        'UPDATE inventory SET low_stock_threshold = ? WHERE menu_item_id = ? AND branch_id = ?',
        [newThreshold, menuItemId, branchId]
      );

      if (result.changes === 0) {
        throw new Error('Inventory item not found');
      }

      return { success: true, message: 'Stock threshold updated' };
    } catch (error) {
      console.error('Error updating stock threshold:', error);
      throw error;
    }
  }
}

module.exports = InventoryService;