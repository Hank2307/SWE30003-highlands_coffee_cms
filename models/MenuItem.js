// models/MenuItem.js
class MenuItem {
    constructor(id, name, description, price, category, available = true) {
      this.id = id;
      this.name = name;
      this.description = description;
      this.price = price;
      this.category = category;
      this.available = available;
    }
  
    static fromDatabase(row) {
      return new MenuItem(
        row.id,
        row.name,
        row.description,
        row.price,
        row.category,
        row.available === 1
      );
    }
  
    toJSON() {
      return {
        id: this.id,
        name: this.name,
        description: this.description,
        price: this.price,
        category: this.category,
        available: this.available
      };
    }
  }
  
  module.exports = MenuItem;