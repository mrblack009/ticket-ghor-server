# TicketGhor (Server-Side) - Ticket Booking REST API

This repository houses the production-ready Express.js REST API for **TicketGhor**, an Online Ticket Booking Platform. Built using Node.js and the native MongoDB driver, this server securely drives content, manages user registration data, validates ticket states, and generates inventory balances cleanly.

## Project Links
* **Live Production API Server:** `https://ticket-ghor-server.onrender.com/`
* **Client-Side Repository:** `https://github.com/mrblack009/ticket-ghor-server.git`

## Key Backend Architecture & Features
* **Role Management Endpoints:** Dedicated request handling routes serving explicit views for Users, Vendors, and Administrators.
* **Inventory Control & Automatic Rollbacks:** Built-in ticket restock workflow; if a vendor rejects a pending book request, the system triggers an atomic `$inc` update to restore the main ticket quantity instantly.
* **Fraud Vendor Mitigation:** Integrated multi-collection isolation query. Flagging a Vendor as fraud automatically cascades an update setting all their hosted tickets to a `hidden` state.
* **Revenue Accumulation Pipeline:** Leverages array `.reduce` configurations to compute instant financial overviews (listings, units sold, gross incomes) directly from the database entries.
* **Input Parameters Verification:** Strict verification parameters checking incoming hashes via `ObjectId.isValid` guards to defend the database layer from empty or broken request crashes.

## Used npm Packages
* `express` - Standard minimalist web routing framework
* `mongodb` - Official MongoDB native driver for database cluster connections
* `cors` - Middleware setting cross-origin resource sharing access rules
* `dotenv` - Environmental file configuration injector

## Environment Configuration (`.env`)
Create a `.env` file in your backend server root directory and include the following credentials:
```env
PORT=5000
DB_USER=your_mongodb_cluster_username
DB_PASS=your_mongodb_cluster_password
