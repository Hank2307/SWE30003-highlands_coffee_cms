// models/Branch.js
class Branch {
    constructor(id, name, address, phone) {
      this.id = id;
      this.name = name;
      this.address = address;
      this.phone = phone;
    }
  
    static fromDatabase(row) {
      return new Branch(
        row.id,
        row.name,
        row.address,
        row.phone
      );
    }
  
    toJSON() {
      return {
        id: this.id,
        name: this.name,
        address: this.address,
        phone: this.phone
      };
    }
  }
  
  module.exports = Branch;