// models/Order.js
class Order {
    constructor(id, customerId, branchId, totalAmount, paymentType, paymentStatus = 'pending', orderStatus = 'pending') {
      this.id = id;
      this.customerId = customerId;
      this.branchId = branchId;
      this.totalAmount = totalAmount;
      this.paymentType = paymentType;
      this.paymentStatus = paymentStatus;
      this.orderStatus = orderStatus;
      this.orderItems = [];
      this.createdAt = new Date();
    }
  
    static fromDatabase(row) {
      return new Order(
        row.id,
        row.customer_id,
        row.branch_id,
        row.total_amount,
        row.payment_type,
        row.payment_status,
        row.order_status
      );
    }
  
    addOrderItem(orderItem) {
      this.orderItems.push(orderItem);
    }
  
    calculateTotal() {
      return this.orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    }
  
    toJSON() {
      return {
        id: this.id,
        customerId: this.customerId,
        branchId: this.branchId,
        totalAmount: this.totalAmount,
        paymentType: this.paymentType,
        paymentStatus: this.paymentStatus,
        orderStatus: this.orderStatus,
        orderItems: this.orderItems.map(item => item.toJSON()),
        createdAt: this.createdAt
      };
    }
  }
  
  module.exports = Order;