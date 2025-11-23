// services/BranchService.js
const Branch = require('../models/Branch');

class BranchService {
  constructor(dbManager) {
    this.db = dbManager;
  }

  async getAllBranches() {
    try {
      const rows = await this.db.all('SELECT * FROM branches ORDER BY name');
      return rows.map(row => Branch.fromDatabase(row));
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw new Error('Failed to fetch branches');
    }
  }

  async getBranchById(branchId) {
    try {
      const row = await this.db.get('SELECT * FROM branches WHERE id = ?', [branchId]);
      if (!row) {
        throw new Error(`Branch with ID ${branchId} not found`);
      }
      return Branch.fromDatabase(row);
    } catch (error) {
      console.error('Error fetching branch:', error);
      throw error;
    }
  }

  async createBranch(name, address, phone) {
    try {
      const result = await this.db.run(
        'INSERT INTO branches (name, address, phone) VALUES (?, ?, ?)',
        [name, address, phone]
      );
      
      return await this.getBranchById(result.lastID);
    } catch (error) {
      console.error('Error creating branch:', error);
      throw new Error('Failed to create branch');
    }
  }

  async updateBranch(branchId, name, address, phone) {
    try {
      const result = await this.db.run(
        'UPDATE branches SET name = ?, address = ?, phone = ? WHERE id = ?',
        [name, address, phone, branchId]
      );

      if (result.changes === 0) {
        throw new Error(`Branch with ID ${branchId} not found`);
      }

      return await this.getBranchById(branchId);
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  }

  async deleteBranch(branchId) {
    try {
      const result = await this.db.run('DELETE FROM branches WHERE id = ?', [branchId]);
      
      if (result.changes === 0) {
        throw new Error(`Branch with ID ${branchId} not found`);
      }

      return { success: true, message: 'Branch deleted successfully' };
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw new Error('Failed to delete branch');
    }
  }
}

module.exports = BranchService;