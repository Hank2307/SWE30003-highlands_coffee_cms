// services/PaymentService.js
const { CashPayment, CardPayment, EWalletPayment, QRPayment } = require('../models/Payment');

class PaymentService {
  constructor(dbManager) {
    this.db = dbManager;
  }

  async processPayment(order, paymentType, paymentDetails = {}) {
    try {
      let paymentStrategy;

      // Select payment strategy based on type
      switch (paymentType.toLowerCase()) {
        case 'cash':
          paymentStrategy = new CashPayment(
            order.totalAmount,
            paymentDetails.receivedAmount
          );
          break;

        case 'card':
          paymentStrategy = new CardPayment(
            order.totalAmount,
            paymentDetails.cardNumber,
            paymentDetails.cardHolder,
            paymentDetails.cvv
          );
          break;

        case 'ewallet':
          paymentStrategy = new EWalletPayment(
            order.totalAmount,
            paymentDetails.walletType || 'Momo',
            paymentDetails.phoneNumber
          );
          break;

        case 'qr':
          paymentStrategy = new QRPayment(
            order.totalAmount,
            paymentDetails.qrCode || this.generateQRCode()
          );
          break;

        default:
          throw new Error(`Unsupported payment type: ${paymentType}`);
      }

      // Process payment using the selected strategy
      const result = await paymentStrategy.process();

      if (result.success) {
        // Log payment transaction
        await this.logPaymentTransaction(
          order.id,
          paymentType,
          order.totalAmount,
          'completed',
          result.details
        );

        // Update order payment status
        await this.db.run(
          'UPDATE orders SET payment_status = ?, payment_type = ? WHERE id = ?',
          ['completed', paymentType, order.id]
        );
      } else {
        // Log failed payment
        await this.logPaymentTransaction(
          order.id,
          paymentType,
          order.totalAmount,
          'failed',
          result
        );
      }

      return result;
    } catch (error) {
      console.error('Error processing payment:', error);
      
      // Log error
      if (order.id) {
        await this.logPaymentTransaction(
          order.id,
          paymentType,
          order.totalAmount,
          'error',
          { error: error.message }
        );
      }

      throw error;
    }
  }

  async logPaymentTransaction(orderId, paymentType, amount, status, details) {
    try {
      const result = await this.db.run(
        `INSERT INTO payment_transactions 
         (order_id, payment_type, amount, status, transaction_details) 
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, paymentType, amount, status, JSON.stringify(details)]
      );

      return result.lastID;
    } catch (error) {
      console.error('Error logging payment transaction:', error);
      // Don't throw - logging failure shouldn't break payment flow
      return null;
    }
  }

  async getPaymentTransaction(transactionId) {
    try {
      const row = await this.db.get(
        'SELECT * FROM payment_transactions WHERE id = ?',
        [transactionId]
      );

      if (!row) {
        throw new Error('Transaction not found');
      }

      return {
        ...row,
        transaction_details: JSON.parse(row.transaction_details)
      };
    } catch (error) {
      console.error('Error fetching payment transaction:', error);
      throw error;
    }
  }

  async getPaymentsByOrder(orderId) {
    try {
      const rows = await this.db.all(
        'SELECT * FROM payment_transactions WHERE order_id = ? ORDER BY created_at DESC',
        [orderId]
      );

      return rows.map(row => ({
        ...row,
        transaction_details: JSON.parse(row.transaction_details)
      }));
    } catch (error) {
      console.error('Error fetching payments for order:', error);
      throw error;
    }
  }

  async getAllPayments() {
    try {
      const rows = await this.db.all(
        `SELECT 
          pt.*,
          o.customer_id,
          c.name as customer_name
         FROM payment_transactions pt
         JOIN orders o ON pt.order_id = o.id
         JOIN customers c ON o.customer_id = c.id
         ORDER BY pt.created_at DESC`
      );

      return rows.map(row => ({
        ...row,
        transaction_details: JSON.parse(row.transaction_details)
      }));
    } catch (error) {
      console.error('Error fetching all payments:', error);
      throw error;
    }
  }

  async getPaymentStatistics() {
    try {
      const stats = await this.db.get(
        `SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_transactions,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_transactions,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
          AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as average_transaction
         FROM payment_transactions`
      );

      // Get breakdown by payment type
      const typeBreakdown = await this.db.all(
        `SELECT 
          payment_type,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as revenue
         FROM payment_transactions
         GROUP BY payment_type`
      );

      return {
        ...stats,
        paymentTypeBreakdown: typeBreakdown
      };
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      throw error;
    }
  }

  generateQRCode() {
    // Generate a simple QR code string (in real system, this would be actual QR generation)
    return `QR-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  validatePaymentDetails(paymentType, paymentDetails) {
    switch (paymentType.toLowerCase()) {
      case 'cash':
        if (!paymentDetails.receivedAmount || paymentDetails.receivedAmount <= 0) {
          throw new Error('Invalid received amount for cash payment');
        }
        break;

      case 'card':
        if (!paymentDetails.cardNumber || !paymentDetails.cardHolder || !paymentDetails.cvv) {
          throw new Error('Missing card payment details');
        }
        break;

      case 'ewallet':
        if (!paymentDetails.phoneNumber) {
          throw new Error('Phone number required for e-wallet payment');
        }
        break;

      case 'qr':
        // QR code can be auto-generated if not provided
        break;

      default:
        throw new Error(`Unknown payment type: ${paymentType}`);
    }

    return true;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }
}

module.exports = PaymentService;