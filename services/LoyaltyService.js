// services/LoyaltyService.js
const LoyaltyAccount = require('../models/LoyaltyAccount');

class LoyaltyService {
  constructor(dbManager) {
    this.db = dbManager;
  }

  async getLoyaltyAccount(customerId) {
    try {
      const row = await this.db.get(
        'SELECT * FROM loyalty_accounts WHERE customer_id = ?',
        [customerId]
      );

      if (!row) {
        // Create new loyalty account if doesn't exist
        return await this.createLoyaltyAccount(customerId);
      }

      return LoyaltyAccount.fromDatabase(row);
    } catch (error) {
      console.error('Error fetching loyalty account:', error);
      throw new Error('Failed to fetch loyalty account');
    }
  }

  async createLoyaltyAccount(customerId) {
    try {
      const result = await this.db.run(
        'INSERT INTO loyalty_accounts (customer_id, points, tier) VALUES (?, ?, ?)',
        [customerId, 0, 'Bronze']
      );

      return new LoyaltyAccount(result.lastID, customerId, 0, 'Bronze');
    } catch (error) {
      console.error('Error creating loyalty account:', error);
      throw new Error('Failed to create loyalty account');
    }
  }

  async addPoints(customerId, orderAmount) {
    try {
      const loyaltyAccount = await this.getLoyaltyAccount(customerId);
      
      // Add points (1 point per 10,000 VND)
      const pointsToAdd = loyaltyAccount.addPoints(orderAmount);
      
      // Update in database
      await this.db.run(
        `UPDATE loyalty_accounts 
         SET points = ?, tier = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE customer_id = ?`,
        [loyaltyAccount.points, loyaltyAccount.tier, customerId]
      );

      return {
        success: true,
        pointsAdded: pointsToAdd,
        newBalance: loyaltyAccount.points,
        tier: loyaltyAccount.tier
      };
    } catch (error) {
      console.error('Error adding loyalty points:', error);
      throw error;
    }
  }

  async redeemPoints(customerId, pointsToRedeem) {
    try {
      const loyaltyAccount = await this.getLoyaltyAccount(customerId);
      
      if (pointsToRedeem > loyaltyAccount.points) {
        throw new Error(`Insufficient points. Available: ${loyaltyAccount.points}, Requested: ${pointsToRedeem}`);
      }

      // Redeem points (each point = 1,000 VND discount)
      const discountAmount = loyaltyAccount.redeemPoints(pointsToRedeem);
      
      // Update in database
      await this.db.run(
        `UPDATE loyalty_accounts 
         SET points = ?, tier = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE customer_id = ?`,
        [loyaltyAccount.points, loyaltyAccount.tier, customerId]
      );

      return {
        success: true,
        pointsRedeemed: pointsToRedeem,
        discountAmount: discountAmount,
        newBalance: loyaltyAccount.points,
        tier: loyaltyAccount.tier
      };
    } catch (error) {
      console.error('Error redeeming loyalty points:', error);
      throw error;
    }
  }

  async checkPointsBalance(customerId) {
    try {
      const loyaltyAccount = await this.getLoyaltyAccount(customerId);
      return {
        customerId: customerId,
        points: loyaltyAccount.points,
        tier: loyaltyAccount.tier,
        discountValue: loyaltyAccount.points * 1000 // VND
      };
    } catch (error) {
      console.error('Error checking points balance:', error);
      throw error;
    }
  }

  async getAllLoyaltyAccounts() {
    try {
      const query = `
        SELECT 
          la.*,
          c.name as customer_name,
          c.email as customer_email
        FROM loyalty_accounts la
        JOIN customers c ON la.customer_id = c.id
        ORDER BY la.points DESC
      `;
      
      const rows = await this.db.all(query);
      return rows;
    } catch (error) {
      console.error('Error fetching all loyalty accounts:', error);
      throw new Error('Failed to fetch loyalty accounts');
    }
  }

  async getTopLoyaltyMembers(limit = 10) {
    try {
      const query = `
        SELECT 
          la.*,
          c.name as customer_name,
          c.email as customer_email
        FROM loyalty_accounts la
        JOIN customers c ON la.customer_id = c.id
        ORDER BY la.points DESC
        LIMIT ?
      `;
      
      const rows = await this.db.all(query, [limit]);
      return rows;
    } catch (error) {
      console.error('Error fetching top loyalty members:', error);
      throw new Error('Failed to fetch top loyalty members');
    }
  }

  async updateTier(customerId) {
    try {
      const loyaltyAccount = await this.getLoyaltyAccount(customerId);
      loyaltyAccount.updateTier();
      
      await this.db.run(
        'UPDATE loyalty_accounts SET tier = ?, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?',
        [loyaltyAccount.tier, customerId]
      );

      return {
        success: true,
        tier: loyaltyAccount.tier
      };
    } catch (error) {
      console.error('Error updating tier:', error);
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

module.exports = LoyaltyService;