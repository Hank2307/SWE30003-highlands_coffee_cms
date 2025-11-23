// models/OrderItem.js
class OrderItem {
    constructor(id, orderId, menuItemId, quantity, unitPrice, menuItemName = null) {
      this.id = id;
      this.orderId = orderId;
      this.menuItemId = menuItemId;
      this.quantity = quantity;
      this.unitPrice = unitPrice;
      this.menuItemName = menuItemName;
      this.subtotal = quantity * unitPrice;
    }
  
    static fromDatabase(row) {
      return new OrderItem(
        row.id,
        row.order_id,
        row.menu_item_id,
        row.quantity,
        row.unit_price,
        row.menu_item_name || null
      );
    }
  
    calculateSubtotal() {
      return this.quantity * this.unitPrice;
    }
  
    toJSON() {
      return {
        id: this.id,
        orderId: this.orderId,
        menuItemId: this.menuItemId,
        menuItemName: this.menuItemName,
        quantity: this.quantity,
        unitPrice: this.unitPrice,
        subtotal: this.subtotal
      };
    }
  }
  
  module.exports = OrderItem;