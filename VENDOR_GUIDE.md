# Vendor Access Guide

What a **vendor** can do on ZyroMart, listed per API endpoint.
Vendors are sellers who were either (a) approved after applying via `POST /vendors/apply` or (b) created directly by an admin via `POST /vendors/admin/create`.

Token role for these routes: `vendor`.

---

## At a glance — 16 vendor endpoints

| Scope | Endpoint | Method | What it does |
|---|---|---|---|
| **Shop profile** | `/vendors/me` | GET | View own vendor profile (shop name, status, commission, address) |
| | `/vendors/me` | PATCH | Update shop name, description, logo, banner, address, contact |
| **Products — own** | `/products/vendor/me` | GET | Paginated list of own products (all statuses: draft/pending/approved/rejected/archived) |
| | `/products` | POST | Create a new product (status: `pending`, awaits admin approval) |
| | `/products/:id` | PATCH | Edit an own product (resets status → `pending`, re-approval required) |
| | `/products/:id` | DELETE | Soft-delete an own product |
| **Variants** | `/variants/product/:productId` | GET | List active variants for any product (public data) |
| | `/variants` | POST | Create a single variant for an own product |
| | `/variants/bulk` | POST | Bulk-generate all variant combinations from a product's `variantOptions` |
| | `/variants/:id` | PATCH | Update price/stock/SKU of an own variant (does NOT reset product status) |
| | `/variants/:id` | DELETE | Deactivate a variant (`isActive: false`) |
| **Orders — fulfilment** | `/orders/vendor/me` | GET | Paginated list of orders containing any of the vendor's items |
| | `/orders/:id` | GET | View a specific order; **other vendors' items are stripped from the response** |
| | `/orders/:id/status` | PATCH | Update fulfilment status: `paid → processing → shipped → delivered` (or `cancelled`) |
| **Customer** | all public endpoints | — | Vendors are also customers: cart / orders / reviews / questions |

---

## Permission map

### Products
- ✅ CRUD on **own** products only (ownership enforced server-side via `vendor` ref)
- ❌ Cannot see/edit other vendors' products (except through the public read endpoints)
- ❌ Cannot self-approve — every edit resets status to `pending` (admin approves)

### Variants
- ✅ CRUD on variants of **own products** only
- ✅ Stock/price edits on variants do **not** trigger product re-approval — this is the fast path for day-to-day inventory management
- ❌ Cannot change a variant's `optionsHash` to collide with another vendor's product

### Orders
- ✅ See every order that contains at least one of their items
- ✅ Update fulfilment (`processing`, `shipped`, `delivered`, `cancelled`) on orders they have items in
- ❌ Cannot view items belonging to other vendors (service strips them)
- ❌ Cannot see customer payment details — order read returns only what's allowed

### Vendor profile
- ✅ Update shop name, description, logo, banner, address, contact
- ❌ Cannot change `status`, `commissionRate`, `rating`, or `totalSales` (admin-only)
- ❌ Cannot change the owning `user` field

### Admin-only (denied to vendors)
- Creating categories
- Approving/rejecting other vendors
- Approving/rejecting products (their own included — admin reviews)
- Listing all orders
- Changing commission rates

---

## Typical vendor workflows

### 1. Onboarding
```
POST /auth/login                    → token
GET  /vendors/me                    → check status; if 'approved' proceed, else wait
```

### 2. Launch a new product
```
POST /products                      → product { _id, status: 'pending' }
POST /variants/bulk                 → auto-generate SKUs from variantOptions
# wait for admin approval
GET  /products/vendor/me?status=approved
```

### 3. Day-to-day stock management (no re-approval)
```
GET   /variants/product/:productId
PATCH /variants/:variantId          → { stock, price }
# product status unchanged — updates are live immediately
```

### 4. Fulfil an order
```
GET   /orders/vendor/me?status=paid
PATCH /orders/:id/status            → { status: 'processing' }
PATCH /orders/:id/status            → { status: 'shipped', note: 'Tracking ...' }
PATCH /orders/:id/status            → { status: 'delivered' }
```

### 5. Update shop profile
```
PATCH /vendors/me                   → { description, logo, banner, ... }
```

---

## Frontend entry point

After a vendor logs in, the client redirects them to **`/vendor`** (the Vendor Dashboard).
They can jump back to the storefront at any time via the header "Go to Website" button.
Admins are not auto-redirected here — they go to `/admin` instead.

The dashboard has:
- **Overview** — stock value, order counts, revenue, low-stock alerts
- **My Products** — list, create, edit, soft-delete; drill into a product to manage its variants
- **Orders** — view orders that include your items and update their status
- **Shop Settings** — edit vendor profile
