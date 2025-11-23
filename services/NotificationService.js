// services/NotificationService.js
class NotificationService {
    constructor() {
      this.notifications = [];
    }
  
    createOrderConfirmation(order, customerName, branchName) {
      const message = {
        type: 'order_confirmation',
        title: 'Order Confirmed',
        message: `Order #${order.id} has been confirmed for ${customerName} at ${branchName}. Total: ${this.formatCurrency(order.totalAmount)}`,
        orderId: order.id,
        timestamp: new Date().toISOString()
      };
      
      this.notifications.push(message);
      console.log(`[NOTIFICATION] ${message.message}`);
      return message;
    }
  
    createPaymentConfirmation(paymentResult, orderId, amount) {
      const message = {
        type: 'payment_confirmation',
        title: 'Payment Successful',
        message: `Payment of ${this.formatCurrency(amount)} for Order #${orderId} was successful via ${paymentResult.details?.transactionId || 'cash'}`,
        orderId: orderId,
        timestamp: new Date().toISOString()
      };
      
      this.notifications.push(message);
      console.log(`[NOTIFICATION] ${message.message}`);
      return message;
    }
  
    createLoyaltyUpdate(customerId, pointsAdded, newBalance) {
      const message = {
        type: 'loyalty_update',
        title: 'Loyalty Points Updated',
        message: `You earned ${pointsAdded} points! New balance: ${newBalance} points`,
        customerId: customerId,
        pointsAdded: pointsAdded,
        newBalance: newBalance,
        timestamp: new Date().toISOString()
      };
      
      this.notifications.push(message);
      console.log(`[NOTIFICATION] ${message.message}`);
      return message;
    }
  
    createLowStockAlert(menuItemName, branchName, currentStock, threshold) {
      const message = {
        type: 'low_stock_alert',
        title: 'Low Stock Alert',
        message: `⚠️ Low stock alert: ${menuItemName} at ${branchName} has only ${currentStock} units left (threshold: ${threshold})`,
        menuItemName: menuItemName,
        branchName: branchName,
        currentStock: currentStock,
        threshold: threshold,
        timestamp: new Date().toISOString()
      };
      
      this.notifications.push(message);
      console.log(`[NOTIFICATION] ${message.message}`);
      return message;
    }
  
    createInventoryUpdate(menuItemName, branchName, quantityDeducted, newStock) {
      const message = {
        type: 'inventory_update',
        title: 'Inventory Updated',
        message: `${menuItemName} at ${branchName}: ${quantityDeducted} units deducted. New stock: ${newStock}`,
        menuItemName: menuItemName,
        branchName: branchName,
        quantityDeducted: quantityDeducted,
        newStock: newStock,
        timestamp: new Date().toISOString()
      };
      
      this.notifications.push(message);
      console.log(`[NOTIFICATION] ${message.message}`);
      return message;
    }
  
    createErrorNotification(errorType, errorMessage) {
      const message = {
        type: 'error',
        title: 'Error',
        message: errorMessage,
        errorType: errorType,
        timestamp: new Date().toISOString()
      };
      
      this.notifications.push(message);
      console.error(`[ERROR NOTIFICATION] ${message.message}`);
      return message;
    }
  
    formatCurrency(amount) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    }
  
    getRecentNotifications(limit = 10) {
      return this.notifications.slice(-limit).reverse();
    }
  
    clearNotifications() {
      this.notifications = [];
    }
  }
  
  module.exports = NotificationService;