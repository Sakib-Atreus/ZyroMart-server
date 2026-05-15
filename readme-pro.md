# ZyroMart — Backend API

A production-ready, multi-vendor e-commerce REST API built with **Node.js**, **Express**, and **TypeScript**. Supports role-based access control, dual payment gateways, real-time chat, and a fully modular architecture.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Scripts](#scripts)

---

## Overview

ZyroMart's backend powers a full-featured multi-vendor marketplace. It handles authentication, product catalog management, order processing, multi-gateway payments (Stripe and SSL Commerce), vendor lifecycle management, analytics dashboards, and in-app messaging — all exposed through a versioned REST API at `/api/v1`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js 4.x |
| Language | TypeScript 5.x |
| Database | MongoDB + Mongoose ODM |
| Authentication | JSON Web Tokens (JWT) |
| Validation | Zod |
| Password Hashing | bcrypt |
| Payment – International | Stripe (with webhook support) |
| Payment – Local (BD) | SSLCommerz (IPN-based) |
| Caching | Redis via ioredis (optional) |
| Security | Helmet, CORS, express-rate-limit |
| PDF Generation | PDFKit |
| Code Quality | ESLint, Prettier |

---

## Architecture

The server follows a **feature-module architecture**. Each business domain lives in its own self-contained folder under `src/modules/` with its own model, interface, service, controller, route, and validation files. A single route aggregator at `src/routes/index.ts` registers all modules.

```
Request → Express App → Rate Limiter → Auth Middleware
       → Route → Validate (Zod) → Controller → Service → MongoDB
       → Global Error Handler → Response
```

**Design decisions:**
- Stateless authentication via short-lived JWTs
- Role-based access control (RBAC) with three roles: `admin`, `vendor`, `user`
- Order snapshots: product name, price, and vendor details are captured at purchase time so historical orders remain accurate even after catalog changes
- Webhook-driven payment confirmation for Stripe; server-to-server IPN for SSLCommerz
- Admin user is seeded automatically on first server start

---

## Features

### Authentication & Users
- JWT-based signup, login, and logout
- Password change with current-password verification
- Role-based protected routes (`admin`, `vendor`, `user`)
- Rate limiting on all auth endpoints (100 requests / 15 min per IP)

### Product Catalog
- Full CRUD for products with slug-based lookup
- Nested category support with parent-child relationships
- Product variants (size, color, etc.) with individual SKUs, stock levels, and pricing
- Bulk variant operations
- Featured product endpoints: new arrivals, top-selling, online-exclusive, similar products
- Tag-based search and advanced filtering middleware

### Vendor Management
- Vendor application and approval workflow
- Vendor-scoped product and order access (vendors see only their own data)
- Shop settings management
- Admin can approve, suspend, or reject vendors

### Cart & Wishlist
- Persistent server-side cart with variant-level line items
- Wishlist with add/remove/clear operations

### Orders & Payments
- Order creation with full item snapshots
- Order status lifecycle with history tracking
- Cancellation support
- **Stripe**: Checkout session creation + webhook signature verification
- **SSLCommerz**: Payment session creation + IPN server-to-server callback

### Reviews & Q&A
- Product reviews with star ratings
- Product Q&A with vendor-authored answers

### Analytics
- Platform-wide analytics dashboard (admin)
- Vendor-specific analytics (revenue, orders, top products)

### Messaging
- Vendor-to-admin and customer-to-vendor chat
- Conversation listing and message history

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Redis (optional — for caching)
- A Stripe account (for international payments)
- An SSLCommerz account (for local Bangladeshi payments)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ZyroMart-server

# Install dependencies
npm install

# Copy environment file and fill in your values
cp .env.example .env
```

### Running the Server

```bash
# Development (with hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The server starts on the port defined in your `.env` (default: `5000`).

On first startup, the admin user defined in `ADMIN_EMAIL` / `ADMIN_PASSWORD` is automatically seeded into the database.

---

## Environment Variables

Create a `.env` file at the project root with the following:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_URL=mongodb://localhost:27017/zyromart

# Admin Seed
ADMIN_EMAIL=admin@zyromart.com
ADMIN_PASSWORD=your_secure_password

# Auth
BCRYPT_SALT_ROUNDS=12
JWT_ACCESS_SECRET=your_jwt_secret
JWT_ACCESS_EXPIRES_IN=7d

# Stripe (International Payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SSLCommerz (Bangladeshi Payments)
SSLC_STORE_ID=your_store_id
SSLC_STORE_PASSWORD=your_store_password
SSLC_IS_LIVE=false

# URLs
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Currency
DEFAULT_CURRENCY=BDT
```

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/signup` | Register a new user | Public |
| POST | `/auth/login` | Login and receive JWT | Public |
| POST | `/auth/logout` | Invalidate session | User |
| PATCH | `/auth/change-password` | Update password | User |

### Users

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/users/me` | Get current user profile | User |
| PATCH | `/users/me` | Update profile | User |
| GET | `/users` | List all users | Admin |
| GET | `/users/dashboard` | User dashboard data | User |

### Categories

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/categories` | List all categories | Public |
| GET | `/categories/featured` | Get featured categories | Public |
| GET | `/categories/:slug` | Get single category | Public |
| POST | `/categories` | Create category | Admin |
| PATCH | `/categories/:id` | Update category | Admin |
| DELETE | `/categories/:id` | Delete category | Admin |

### Products

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/products` | List / search / filter products | Public |
| GET | `/products/:slug` | Get product by slug | Public |
| GET | `/products/featured/new-arrivals` | New arrival products | Public |
| GET | `/products/featured/top-selling` | Top-selling products | Public |
| GET | `/products/featured/online-exclusive` | Online exclusive deals | Public |
| GET | `/products/:id/similar` | Similar products | Public |
| POST | `/products` | Create product | Vendor / Admin |
| PATCH | `/products/:id` | Update product | Vendor / Admin |
| DELETE | `/products/:id` | Delete product | Vendor / Admin |
| PATCH | `/products/:id/status` | Change product status | Admin |
| GET | `/products/vendor/me` | Vendor's own products | Vendor |

### Variants

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/variants/:productId` | Get variants for a product | Public |
| POST | `/variants` | Create variant | Vendor / Admin |
| POST | `/variants/bulk` | Bulk create variants | Vendor / Admin |
| PATCH | `/variants/:id` | Update variant | Vendor / Admin |
| DELETE | `/variants/:id` | Delete variant | Vendor / Admin |

### Cart

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/cart` | Get current user's cart | User |
| POST | `/cart` | Add item to cart | User |
| PATCH | `/cart/:variantId` | Update item quantity | User |
| DELETE | `/cart/:variantId` | Remove item from cart | User |
| DELETE | `/cart` | Clear cart | User |

### Orders

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/orders` | List all orders | Admin |
| GET | `/orders/mine` | Current user's orders | User |
| GET | `/orders/vendor` | Vendor's orders | Vendor |
| GET | `/orders/:id` | Get order details | User / Admin |
| POST | `/orders` | Place new order | User |
| PATCH | `/orders/:id/cancel` | Cancel order | User |
| PATCH | `/orders/:id/status` | Update order status | Admin / Vendor |

### Payments

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/payments/stripe/checkout` | Create Stripe checkout session | User |
| POST | `/payments/stripe/webhook` | Stripe payment webhook | Public (signed) |
| POST | `/payments/sslc/checkout` | Create SSLCommerz session | User |
| POST | `/payments/sslc/ipn` | SSLCommerz IPN callback | Public |

### Reviews

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/reviews/:productId` | List reviews for a product | Public |
| GET | `/reviews/:productId/mine` | Current user's review | User |
| POST | `/reviews` | Create review | User |
| PATCH | `/reviews/:id` | Update review | User |
| DELETE | `/reviews/:id` | Delete review | User / Admin |

### Questions

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/questions/:productId` | List Q&A for a product | Public |
| POST | `/questions` | Ask a question | User |
| PATCH | `/questions/:id/answer` | Answer a question | Vendor |
| DELETE | `/questions/:id` | Delete question | User / Admin |

### Wishlist

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/wishlist` | Get wishlist | User |
| POST | `/wishlist` | Add product to wishlist | User |
| DELETE | `/wishlist/:productId` | Remove from wishlist | User |
| DELETE | `/wishlist` | Clear wishlist | User |

### Vendors

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/vendors` | List vendors | Public |
| POST | `/vendors/apply` | Apply to become a vendor | User |
| GET | `/vendors/me` | Get own vendor profile | Vendor |
| PATCH | `/vendors/me` | Update shop settings | Vendor |
| GET | `/vendors/admin` | Admin: list all vendor applications | Admin |
| POST | `/vendors/admin` | Admin: create vendor directly | Admin |
| PATCH | `/vendors/:id/status` | Approve / suspend vendor | Admin |

### Analytics

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/analytics/platform` | Platform-wide metrics | Admin |
| GET | `/analytics/vendor` | Vendor-specific metrics | Vendor |

### Chat

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/chat/mine` | Get own conversation | User / Vendor |
| GET | `/chat` | List all conversations | Admin |
| GET | `/chat/:conversationId/messages` | Get messages | User / Admin |
| POST | `/chat/send` | Send a message | User / Vendor |
| POST | `/chat/admin/send` | Admin reply | Admin |

---

## Project Structure

```
ZyroMart-server/
├── src/
│   ├── server.ts              # Entry point (DB connect, admin seed, listen)
│   ├── app.ts                 # Express app (middleware setup)
│   ├── config/
│   │   └── index.ts           # Environment variable config
│   ├── routes/
│   │   └── index.ts           # Aggregated route registration
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification + role check
│   │   ├── validateRequest.ts # Zod validation middleware
│   │   ├── filterProductMiddleware.ts
│   │   ├── globalErrorHandler.ts
│   │   └── notFoundRoute.ts
│   └── modules/
│       ├── auth/
│       ├── users/
│       ├── categories/
│       ├── vendors/
│       ├── products/
│       ├── variants/
│       ├── carts/
│       ├── orders/
│       ├── payments/
│       ├── reviews/
│       ├── questions/
│       ├── wishlists/
│       ├── analytics/
│       └── chat/
├── .env.example
├── tsconfig.json
├── package.json
└── .eslintrc.json
```

Each module contains:

```
{module}/
├── {module}.model.ts       # Mongoose schema & model
├── {module}.interface.ts   # TypeScript types & interfaces
├── {module}.service.ts     # Business logic
├── {module}.controller.ts  # HTTP request handlers
├── {module}.route.ts       # Express router
└── {module}.validation.ts  # Zod schemas
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run start:dev` | Start development server with hot reload |
| `npm run start:prod` | Start production server |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run prettier` | Check code formatting |
| `npm run prettier:fix` | Auto-format code |
| `npm run seed` | Run primary database seeder |
| `npm run seed2` | Run secondary seeder |
| `npm run seed3` | Run tertiary seeder |

---

## Contributing

Contributions are welcome from authorized collaborators. Please follow the process below to keep the codebase clean and consistent.

### Branching Strategy

```
main          — production-ready code only
develop       — integration branch for completed features
feature/*     — new features (branched from develop)
fix/*         — bug fixes (branched from develop)
hotfix/*      — critical production fixes (branched from main)
```

### Workflow

1. **Fork or branch** — create a branch from `develop` using the naming convention above.
2. **Write your code** — follow the existing module structure; each new domain should have its own folder under `src/modules/` with model, interface, service, controller, route, and validation files.
3. **Lint and format** — run `npm run lint:fix` and `npm run prettier:fix` before committing.
4. **Test your changes** — manually verify affected endpoints using a REST client (Postman, Insomnia, or similar). Include seed data if your changes require new database state.
5. **Commit clearly** — use short, imperative commit messages:
   - `feat: add vendor suspension endpoint`
   - `fix: correct order snapshot price on variant update`
   - `refactor: extract payment webhook logic into service`
6. **Open a pull request** — target the `develop` branch. Describe what changed and why, and list any environment variable additions.
7. **Review** — at least one maintainer approval is required before merging.

### Code Standards

- All new code must be written in TypeScript with proper types — avoid `any`.
- Validate all incoming request bodies with a Zod schema and the `validateRequest` middleware.
- Protect routes with the `auth` middleware and specify the required role(s).
- Business logic belongs in the service layer, not the controller.
- Do not commit `.env` files, secrets, or generated `dist/` output.

---

## Contact

For questions about this project, integration support, or business enquiries, please reach out through the following channel.

| Type | Details |
|---|---|
| **Email** | [your-email@example.com](mailto:your-email@example.com) |

> For bug reports or feature requests related to the codebase, open an issue in the project repository with a clear description, steps to reproduce (if a bug), and any relevant logs or screenshots.

Response time is typically within 1–2 business days.

---

## License

This project is proprietary. All rights reserved. Unauthorized copying, distribution, or modification of this software is strictly prohibited.
