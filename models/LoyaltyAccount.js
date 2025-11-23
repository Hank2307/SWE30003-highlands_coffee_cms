// models/LoyaltyAccount.js
class LoyaltyAccount {
    constructor(id, customerId, points, tier) {
      this.id = id;
      this.customerId = customerId;
      this.points = points || 0;
      this.tier = tier || 'Bronze';
    }
  
    static fromDatabase(row) {
      return new LoyaltyAccount(
        row.id,
        row.customer_id,
        row.points,
        row.tier
      );
    }
  
    addPoints(amount) {
      // Add 1 point per 10,000 VND spent
      const pointsToAdd = Math.floor(amount / 10000);
      this.points += pointsToAdd;
      this.updateTier();
      return pointsToAdd;
    }
  
    redeemPoints(pointsToRedeem) {
      if (pointsToRedeem > this.points) {
        throw new Error('Insufficient loyalty points');
      }
      this.points -= pointsToRedeem;
      this.updateTier();
      // Each point = 1,000 VND discount
      return pointsToRedeem * 1000;
    }
  
    updateTier() {
      if (this.points >= 500) {
        this.tier = 'Gold';
      } else if (this.points >= 200) {
        this.tier = 'Silver';
      } else {
        this.tier = 'Bronze';
      }
    }
  
    toJSON() {
      return {
        id: this.id,
        customerId: this.customerId,
        points: this.points,
        tier: this.tier
      };
    }
  }
  
  module.exports = LoyaltyAccount;