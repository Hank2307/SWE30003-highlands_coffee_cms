// config/DatabaseManager.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseManager {
  constructor() {
    if (DatabaseManager.instance) {
      return DatabaseManager.instance;
    }
    
    this.db = null;
    DatabaseManager.instance = this;
  }

  static getInstance(dbPath = 'hc_cms.db') {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
      DatabaseManager.instance.connect(dbPath);
    }
    return DatabaseManager.instance;
  }

  connect(dbPath) {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error connecting to database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database:', dbPath);
          resolve(this.db);
        }
      });
    });
  }

  async initializeSchema() {
    const schema = `
      -- Branches table
      CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Customers table
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Loyalty accounts table
      CREATE TABLE IF NOT EXISTS loyalty_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        points INTEGER DEFAULT 0,
        tier TEXT DEFAULT 'Bronze',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      -- Menu items table
      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT,
        available INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Inventory table
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        menu_item_id INTEGER NOT NULL,
        branch_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 10,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
        FOREIGN KEY (branch_id) REFERENCES branches(id),
        UNIQUE(menu_item_id, branch_id)
      );

      -- Orders table
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        branch_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        payment_type TEXT NOT NULL,
        payment_status TEXT DEFAULT 'pending',
        order_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (branch_id) REFERENCES branches(id)
      );

      -- Order items table
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        menu_item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
      );

      -- Payment transactions table
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        payment_type TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL,
        transaction_details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );
    `;

    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) {
          console.error('Error initializing schema:', err);
          reject(err);
        } else {
          console.log('Database schema initialized successfully');
          resolve();
        }
      });
    });
  }

  async seedInitialData() {
    try {
      // Check if data already exists
      const existingBranches = await this.get('SELECT COUNT(*) as count FROM branches');
      
      if (existingBranches.count > 0) {
        console.log('Initial data already exists, skipping seed...');
        return;
      }

      console.log('Seeding initial data for the first time...');

      // Insert sample branches
      const branches = [
        { name: 'Highlands Coffee - District 1', address: '123 Nguyen Hue St, District 1', phone: '0281234567' },
        { name: 'Highlands Coffee - District 3', address: '456 Le Van Sy St, District 3', phone: '0281234568' },
        { name: 'Highlands Coffee - Tan Binh', address: '789 Hoang Van Thu St, Tan Binh', phone: '0281234569' }
      ];

      // Insert sample menu items
      const menuItems = [
        { name: 'Phin Sua Da', description: 'Traditional Vietnamese Iced Coffee', price: 45000, category: 'Coffee' },
        { name: 'Bac Xiu', description: 'Milk Coffee', price: 42000, category: 'Coffee' },
        { name: 'Cappuccino', description: 'Italian Classic', price: 55000, category: 'Coffee' },
        { name: 'Tra Xanh', description: 'Green Tea', price: 38000, category: 'Tea' },
        { name: 'Tra Dao', description: 'Peach Tea', price: 50000, category: 'Tea' },
        { name: 'Banh Mi', description: 'Vietnamese Sandwich', price: 35000, category: 'Food' }
      ];

      // Insert sample customers
      const customers = [
        { name: 'Nguyen Van A', email: 'nguyenvana@example.com', phone: '0901234567' },
        { name: 'Tran Thi B', email: 'tranthib@example.com', phone: '0901234568' }
      ];

      // Insert branches
      const branchIds = [];
      for (const branch of branches) {
        const result = await this.run(
          'INSERT INTO branches (name, address, phone) VALUES (?, ?, ?)',
          [branch.name, branch.address, branch.phone]
        );
        branchIds.push(result.lastID);
      }

      // Insert menu items
      const menuItemIds = [];
      for (const item of menuItems) {
        const result = await this.run(
          'INSERT INTO menu_items (name, description, price, category) VALUES (?, ?, ?, ?)',
          [item.name, item.description, item.price, item.category]
        );
        menuItemIds.push(result.lastID);
      }

      // Insert customers with loyalty accounts
      for (const customer of customers) {
        const result = await this.run(
          'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
          [customer.name, customer.email, customer.phone]
        );
        
        // Create loyalty account for new customer
        await this.run(
          'INSERT INTO loyalty_accounts (customer_id, points) VALUES (?, ?)',
          [result.lastID, 0]
        );
      }

      // Insert inventory for each branch and menu item
      for (const branchId of branchIds) {
        for (const menuItemId of menuItemIds) {
          await this.run(
            'INSERT INTO inventory (menu_item_id, branch_id, quantity, low_stock_threshold) VALUES (?, ?, ?, ?)',
            [menuItemId, branchId, 50, 10]
          );
        }
      }

      console.log('✓ Initial data seeded successfully');
    } catch (err) {
      console.error('Error seeding data:', err);
      throw err;
    }
  }

  // Helper method to run queries
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Helper method to get single row
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Helper method to get all rows
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = DatabaseManager;