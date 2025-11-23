# HC-CMS - Highlands Coffee Management System

A full-stack café management system built with Node.js, Express, and SQLite.

## Features

- 📋 **Order Management** - Create, view, update, and cancel orders
- 📦 **Inventory Management** - Track stock levels, restock items, low-stock alerts
- 💳 **Payment Processing** - Multiple payment methods (Cash, Card, E-Wallet, QR)
- 🎁 **Loyalty Program** - Points system with Bronze, Silver, and Gold tiers
- 👥 **Customer Management** - CRUD operations and customer history
- 📊 **Dashboard** - Real-time statistics and insights

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Design Patterns**: Strategy, Singleton, MVC, Repository

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Hank2307/SWE30003-highlands_coffee_cms
cd hc-cms
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm run dev
```

4. Open your browser:
```
http://localhost:3000
```

## Project Structure
```
hc-cms/
├── config/          # Database configuration
├── models/          # Domain models
├── services/        # Business logic services
├── routes/          # Express routes
├── public/          # Static files (HTML, CSS, JS)
├── server.js        # Main entry point
└── package.json     # Dependencies
```

## API Endpoints

- `GET /api/orders` - Get all orders
- `POST /api/orders/create` - Create new order
- `GET /api/inventory` - Get inventory
- `POST /api/inventory/restock` - Restock items
- `GET /api/loyalty` - Get loyalty accounts
- `POST /api/loyalty/redeem` - Redeem points
- `GET /api/customers` - Get customers
- `GET /api/branches` - Get branches

