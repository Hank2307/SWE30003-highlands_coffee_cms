// services/OrderService.js
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const MenuItem = require('../models/MenuItem');

class OrderService {
  constructor(dbManager, paymentService, inventoryService, loyaltyService, notificationService) {
    this.db = dbManager;
    this.paymentService = paymentService;
    this.inventoryService = inventoryService;
    this.loyaltyService = loyaltyService;
    this.notificationService = notificationService;
  }

  async createOrder(orderData) {
    try {
      const { customerId, branchId, items, paymentType, paymentDetails, loyaltyPointsToRedeem } = orderData;

      // Validate inputs
      if (!customerId || !branchId || !items || items.length === 0) {
        throw new Error('Missing required order information');
      }

      // Build order items and calculate total
      const orderItems = [];
      let subtotal = 0;

      for (const item of items) {
        if (!item.menuItemId || !item.quantity || item.quantity <= 0) {
          throw new Error('Invalid item data');
        }

        // Check stock availability
        const stockCheck = await this.inventoryService.checkStock(
          item.menuItemId,
          branchId,
          item.quantity
        );

        if (!stockCheck.available) {
          const menuItem = await this.db.get('SELECT name FROM menu_items WHERE id = ?', [item.menuItemId]);
          throw new Error(
            `Insufficient stock for ${menuItem.name}. Available: ${stockCheck.currentStock}, Requested: ${item.quantity}`
          );
        }

        // Get menu item details
        const menuItem = await this.db.get('SELECT * FROM menu_items WHERE id = ?', [item.menuItemId]);
        if (!menuItem) {
          throw new Error(`Menu item with ID ${item.menuItemId} not found`);
        }

        const orderItem = new OrderItem(
          null, // id will be set after insert
          null, // orderId will be set after order creation
          item.menuItemId,
          item.quantity,
          menuItem.price,
          menuItem.name
        );

        orderItems.push(orderItem);
        subtotal += orderItem.subtotal;
      }

      let totalAmount = subtotal;
      let loyaltyDiscount = 0;

      // Apply loyalty points if requested
      if (loyaltyPointsToRedeem && loyaltyPointsToRedeem > 0) {
        const redemptionResult = await this.loyaltyService.redeemPoints(
          customerId,
          loyaltyPointsToRedeem
        );
        loyaltyDiscount = redemptionResult.discountAmount;
        totalAmount = Math.max(0, subtotal - loyaltyDiscount);
      }

      // Create order in database
      const orderResult = await this.db.run(
        `INSERT INTO orders 
         (customer_id, branch_id, total_amount, payment_type, payment_status, order_status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [customerId, branchId, totalAmount, paymentType, 'pending', 'pending']
      );

      const orderId = orderResult.lastID;

      // Create order object
      const order = new Order(
        orderId,
        customerId,
        branchId,
        totalAmount,
        paymentType,
        'pending',
        'pending'
      );

      // Insert order items
      for (const orderItem of orderItems) {
        orderItem.orderId = orderId;
        const itemResult = await this.db.run(
          `INSERT INTO order_items 
           (order_id, menu_item_id, quantity, unit_price, subtotal) 
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, orderItem.menuItemId, orderItem.quantity, orderItem.unitPrice, orderItem.subtotal]
        );
        orderItem.id = itemResult.lastID;
        order.addOrderItem(orderItem);
      }

      // Process payment
      const paymentResult = await this.paymentService.processPayment(
        order,
        paymentType,
        paymentDetails
      );

      if (!paymentResult.success) {
        // Update order status to failed
        await this.db.run(
          'UPDATE orders SET payment_status = ?, order_status = ? WHERE id = ?',
          ['failed', 'cancelled', orderId]
        );
        throw new Error(`Payment failed: ${paymentResult.message}`);
      }

      // Payment successful - update inventory
      await this.inventoryService.updateStock(orderItems, branchId);

      // Add loyalty points (if not already redeemed)
      const loyaltyResult = await this.loyaltyService.addPoints(customerId, totalAmount);

      // Update order status to confirmed
      await this.db.run(
        'UPDATE orders SET payment_status = ?, order_status = ? WHERE id = ?',
        ['completed', 'confirmed', orderId]
      );

      // Get customer and branch details for notification
      const customer = await this.db.get('SELECT name FROM customers WHERE id = ?', [customerId]);
      const branch = await this.db.get('SELECT name FROM branches WHERE id = ?', [branchId]);

      // Create order confirmation notification
      this.notificationService.createOrderConfirmation(order, customer.name, branch.name);
      this.notificationService.createPaymentConfirmation(paymentResult, orderId, totalAmount);
      this.notificationService.createLoyaltyUpdate(
        customerId,
        loyaltyResult.pointsAdded,
        loyaltyResult.newBalance
      );

      return {
        success: true,
        order: order,
        payment: paymentResult,
        loyalty: loyaltyResult,
        loyaltyDiscount: loyaltyDiscount,
        message: 'Order created successfully'
      };
    } catch (error) {
      console.error('Error creating order:', error);
      this.notificationService.createErrorNotification('order_creation', error.message);
      throw error;
    }
  }

  async getOrderById(orderId) {
    try {
      const orderRow = await this.db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
      
      if (!orderRow) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      const order = Order.fromDatabase(orderRow);

      // Get order items
      const itemRows = await this.db.all(
        `SELECT 
          oi.*,
          m.name as menu_item_name
         FROM order_items oi
         JOIN menu_items m ON oi.menu_item_id = m.id
         WHERE oi.order_id = ?`,
        [orderId]
      );

      for (const itemRow of itemRows) {
        const orderItem = OrderItem.fromDatabase(itemRow);
        order.addOrderItem(orderItem);
      }

      return order;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  async getAllOrders() {
    try {
      const query = `
        SELECT 
          o.*,
          c.name as customer_name,
          b.name as branch_name
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        JOIN branches b ON o.branch_id = b.id
        ORDER BY o.created_at DESC
      `;
      
      const rows = await this.db.all(query);
      return rows;
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw new Error('Failed to fetch orders');
    }
  }

  async getOrdersByCustomer(customerId) {
    try {
      const query = `
        SELECT 
          o.*,
          b.name as branch_name
        FROM orders o
        JOIN branches b ON o.branch_id = b.id
        WHERE o.customer_id = ?
        ORDER BY o.created_at DESC
      `;
      
      const rows = await this.db.all(query, [customerId]);
      return rows;
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      throw error;
    }
  }

  async getOrdersByBranch(branchId) {
    try {
      const query = `
        SELECT 
          o.*,
          c.name as customer_name
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.branch_id = ?
        ORDER BY o.created_at DESC
      `;
      
      const rows = await this.db.all(query, [branchId]);
      return rows;
    } catch (error) {
      console.error('Error fetching branch orders:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId, newStatus) {
    try {
      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
      
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid order status: ${newStatus}`);
      }

      const result = await this.db.run(
        'UPDATE orders SET order_status = ? WHERE id = ?',
        [newStatus, orderId]
      );

      if (result.changes === 0) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      return { success: true, message: `Order status updated to ${newStatus}` };
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  async cancelOrder(orderId) {
    try {
      const order = await this.getOrderById(orderId);

      if (order.orderStatus === 'completed') {
        throw new Error('Cannot cancel completed order');
      }

      // Update order status
      await this.db.run(
        'UPDATE orders SET order_status = ?, payment_status = ? WHERE id = ?',
        ['cancelled', 'refunded', orderId]
      );

      // Optionally: restore inventory (if order was confirmed)
      // This is a business decision - implement if needed

      return { success: true, message: 'Order cancelled successfully' };
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  async getOrderStatistics() {
    try {
      const stats = await this.db.get(
        `SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN order_status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
          SUM(CASE WHEN payment_status = 'completed' THEN total_amount ELSE 0 END) as total_revenue,
          AVG(CASE WHEN payment_status = 'completed' THEN total_amount ELSE NULL END) as average_order_value
         FROM orders`
      );

      return stats;
    } catch (error) {
      console.error('Error fetching order statistics:', error);
      throw error;
    }
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }
}

module.exports = OrderService;