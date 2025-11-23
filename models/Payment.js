// models/Payment.js

// Abstract Payment class
class Payment {
    constructor(amount) {
      if (this.constructor === Payment) {
        throw new Error("Abstract class 'Payment' cannot be instantiated directly");
      }
      this.amount = amount;
      this.status = 'pending';
      this.transactionDetails = {};
    }
  
    process() {
      throw new Error("Method 'process()' must be implemented");
    }
  
    getType() {
      throw new Error("Method 'getType()' must be implemented");
    }
  }
  
  // Cash Payment Strategy
  class CashPayment extends Payment {
    constructor(amount, receivedAmount = null) {
      super(amount);
      this.receivedAmount = receivedAmount || amount;
    }
  
    process() {
      if (this.receivedAmount < this.amount) {
        this.status = 'failed';
        this.transactionDetails = { 
          error: 'Insufficient cash', 
          received: this.receivedAmount,
          required: this.amount 
        };
        return { success: false, message: 'Insufficient cash provided' };
      }
  
      const change = this.receivedAmount - this.amount;
      this.status = 'completed';
      this.transactionDetails = {
        received: this.receivedAmount,
        change: change,
        timestamp: new Date().toISOString()
      };
  
      return { 
        success: true, 
        message: 'Cash payment successful',
        change: change,
        details: this.transactionDetails
      };
    }
  
    getType() {
      return 'cash';
    }
  }
  
  // Card Payment Strategy
  class CardPayment extends Payment {
    constructor(amount, cardNumber, cardHolder, cvv) {
      super(amount);
      this.cardNumber = cardNumber;
      this.cardHolder = cardHolder;
      this.cvv = cvv;
    }
  
    process() {
      // Simulate card validation
      if (!this.cardNumber || this.cardNumber.length < 13) {
        this.status = 'failed';
        this.transactionDetails = { error: 'Invalid card number' };
        return { success: false, message: 'Invalid card number' };
      }
  
      if (!this.cvv || this.cvv.length < 3) {
        this.status = 'failed';
        this.transactionDetails = { error: 'Invalid CVV' };
        return { success: false, message: 'Invalid CVV' };
      }
  
      // Simulate successful processing
      this.status = 'completed';
      const transactionId = 'CARD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      this.transactionDetails = {
        transactionId: transactionId,
        cardLastFour: this.cardNumber.slice(-4),
        cardHolder: this.cardHolder,
        timestamp: new Date().toISOString()
      };
  
      return { 
        success: true, 
        message: 'Card payment successful',
        transactionId: transactionId,
        details: this.transactionDetails
      };
    }
  
    getType() {
      return 'card';
    }
  }
  
  // E-Wallet Payment Strategy
  class EWalletPayment extends Payment {
    constructor(amount, walletType, phoneNumber) {
      super(amount);
      this.walletType = walletType; // e.g., 'Momo', 'ZaloPay', 'ViettelPay'
      this.phoneNumber = phoneNumber;
    }
  
    process() {
      // Simulate phone validation
      if (!this.phoneNumber || this.phoneNumber.length < 10) {
        this.status = 'failed';
        this.transactionDetails = { error: 'Invalid phone number' };
        return { success: false, message: 'Invalid phone number for e-wallet' };
      }
  
      // Simulate successful processing
      this.status = 'completed';
      const transactionId = `${this.walletType.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      this.transactionDetails = {
        transactionId: transactionId,
        walletType: this.walletType,
        phoneNumber: this.phoneNumber,
        timestamp: new Date().toISOString()
      };
  
      return { 
        success: true, 
        message: `${this.walletType} payment successful`,
        transactionId: transactionId,
        details: this.transactionDetails
      };
    }
  
    getType() {
      return 'ewallet';
    }
  }
  
  // QR Payment Strategy
  class QRPayment extends Payment {
    constructor(amount, qrCode) {
      super(amount);
      this.qrCode = qrCode;
    }
  
    process() {
      // Simulate QR code validation
      if (!this.qrCode || this.qrCode.length < 10) {
        this.status = 'failed';
        this.transactionDetails = { error: 'Invalid QR code' };
        return { success: false, message: 'Invalid QR code' };
      }
  
      // Simulate successful processing
      this.status = 'completed';
      const transactionId = 'QR-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      this.transactionDetails = {
        transactionId: transactionId,
        qrCode: this.qrCode.substring(0, 10) + '...',
        timestamp: new Date().toISOString()
      };
  
      return { 
        success: true, 
        message: 'QR payment successful',
        transactionId: transactionId,
        details: this.transactionDetails
      };
    }
  
    getType() {
      return 'qr';
    }
  }
  
  module.exports = {
    Payment,
    CashPayment,
    CardPayment,
    EWalletPayment,
    QRPayment
  };