// models/Customer.js
class Customer {
    constructor(id, name, email, phone) {
      this.id = id;
      this.name = name;
      this.email = email;
      this.phone = phone;
    }
  
    static fromDatabase(row) {
      return new Customer(
        row.id,
        row.name,
        row.email,
        row.phone
      );
    }
  
    toJSON() {
      return {
        id: this.id,
        name: this.name,
        email: this.email,
        phone: this.phone
      };
    }
  }
  
  module.exports = Customer;