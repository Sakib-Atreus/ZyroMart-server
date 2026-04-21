# ZyroMart API — Usage Guide

Base URL: `http://localhost:5000/api/v1`
Content-Type: `application/json` (except Stripe webhook, which receives `application/json` raw).

---

## 1. Conventions

### 1.1 Standard response envelope

Every endpoint (except the Stripe webhook) returns:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Human-readable status",
  "data": { ... },
  "meta": { "page": 1, "limit": 12, "total": 120, "totalPages": 10 }
}
```

`meta` is only present on list endpoints that paginate. `token` is only present on login.

### 1.2 Error response

```json
{
  "success": false,
  "message": "Validation error",
  "errorMessages": [{ "path": "email", "message": "Invalid email" }],
  "statusCode": 400
}
```

HTTP status codes you will see:
- `400` — validation / bad input
- `401` — missing or invalid token
- `403` — authenticated but not authorized for this role / resource
- `404` — resource not found
- `409` — conflict (duplicate, insufficient stock, already exists)
- `500` — server error

### 1.3 Authentication

All protected routes require:

```
Authorization: Bearer <accessToken>
```

The token is returned by `POST /auth/login` as the top-level `token` field. Store it in `localStorage` and attach it on every subsequent request.

### 1.4 Roles

| Role      | Who                                                   |
|-----------|-------------------------------------------------------|
| `user`    | Default on signup; can buy, review, ask questions    |
| `vendor`  | Approved seller; can CRUD own products + variants    |
| `admin`   | Full control; seeded at boot via `adminSeeder`       |

A `user` becomes a `vendor` after an admin approves their vendor application.

### 1.5 Pagination, search, filter, sort

List endpoints accept these query parameters:

| Param        | Example                 | Effect |
|--------------|-------------------------|--------|
| `page`       | `?page=2`               | Page number (default 1) |
| `limit`      | `?limit=24`             | Items per page (max 100, default 12) |
| `sort`       | `?sort=-createdAt`      | Mongoose sort string; `-` prefix = desc |
| `searchTerm` | `?searchTerm=honor`     | Case-insensitive OR across searchable fields |
| `fields`     | `?fields=name,price`    | Project only these fields |
| `minPrice`   | `?minPrice=5000`        | Products-only: filter by `basePrice >=` |
| `maxPrice`   | `?maxPrice=50000`       | Products-only: filter by `basePrice <=` |
| any other    | `?brand=Honor&status=approved` | Exact-match filter |

---

## 2. Auth

### 2.1 Signup

```
POST /auth/signup
```

Public. Creates a new `user`-role account.

```json
{
  "name": "Alex",
  "email": "alex@example.com",
  "phone": "+8801700000000",
  "password": "hunter22",
  "address": "Dhaka, BD"
}
```

### 2.2 Login

```
POST /auth/login
```

Public. Returns access token.

```json
{ "email": "alex@example.com", "password": "hunter22" }
```

Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User logged in successfully",
  "token": "Bearer eyJhbGciOi...",
  "data": { "_id": "...", "name": "Alex", "role": "user", ... }
}
```

**Client-side rule:** after login, inspect `data.role`:
- `admin` → redirect to `/admin`
- `vendor`/`user` → redirect to `/` (shop)

### 2.3 Change password / Logout

```
POST /auth/change-password          [user | admin]
POST /auth/logout                   [user | admin]
```

---

## 3. Categories — *product type blueprints*

Categories are **not just labels**. They carry an `attributeSchema[]` that declares which attributes (RAM, battery, OS, color, …) are valid for products in that category, their types, and which ones can be used as variant differentiators.

### 3.1 List categories

```
GET /categories
```
Public. Returns all active categories.

### 3.2 Get category by slug

```
GET /categories/:slug
```
Public. Includes the full `attributeSchema`. Use this on the product-create form to drive dynamic fields.

### 3.3 Create category (admin only)

```
POST /categories
```

```json
{
  "name": "Phone",
  "icon": "https://...",
  "attributeSchema": [
    { "key": "display_size", "label": "Display", "group": "Display", "type": "string", "unit": "inch", "filterable": true },
    { "key": "battery_mah",  "label": "Battery",  "group": "Battery", "type": "number", "unit": "mAh", "filterable": true },
    { "key": "os",           "label": "OS",       "group": "System",  "type": "enum",   "options": ["Android", "iOS"] },
    { "key": "color",        "label": "Color",    "group": "Appearance", "type": "string", "isVariantOption": true },
    { "key": "ram",          "label": "RAM",      "group": "Memory",  "type": "string", "unit": "GB", "isVariantOption": true },
    { "key": "storage",      "label": "Storage",  "group": "Memory",  "type": "string", "unit": "GB", "isVariantOption": true }
  ]
}
```

**Why this design:** new product types (e.g. "Drones") can be added by seeding a new category — no code changes. The product model stays flexible because attribute validation is driven by the category blueprint.

### 3.4 Update / deactivate category

```
PATCH  /categories/:id         [admin]
DELETE /categories/:id         [admin]   (soft — sets isActive=false)
```

---

## 4. Vendors — *multi-tenant sellers*

### 4.1 Apply to become a vendor

```
POST /vendors/apply                 [user | vendor]
```

```json
{
  "shopName": "Alex Electronics",
  "description": "Small gadget shop",
  "address": { "line1": "12 Main St", "city": "Dhaka", "country": "Bangladesh" },
  "contact": { "email": "alex@shop.com", "phone": "+880..." }
}
```

Creates a Vendor with `status: 'pending'`. An admin must approve it.

### 4.2 Approve / reject (admin only)

```
PATCH /vendors/:id/status           [admin]
```

```json
{ "status": "approved", "commissionRate": 0.08 }
```

On approval the user's role is automatically promoted to `vendor`.

### 4.3 Vendor self-service

```
GET    /vendors/me                  [vendor | user]
PATCH  /vendors/me                  [vendor | user]
```

### 4.4 Public vendor pages

```
GET /vendors                        public (approved only)
GET /vendors/:slug                  public
```

---

## 5. Products

### 5.1 List products (public)

```
GET /products?searchTerm=honor&brand=HONOR&minPrice=10000&page=1&limit=12&sort=-createdAt
```

Only returns products with `status: 'approved'` and `isDeleted: false`. Paginated.

### 5.2 Product detail (public)

```
GET /products/:slug
```

Returns the product with `category`, `vendor` and an array `variants` (active only) populated. This is the endpoint a product-detail page should call.

### 5.3 Create product (vendor)

```
POST /products                      [vendor]
```

```json
{
  "category": "<categoryId>",
  "name": "HONOR X6b",
  "brand": "HONOR",
  "description": "...",
  "images": ["https://...", "https://..."],
  "thumbnail": "https://...",
  "basePrice": 14999,
  "currency": "BDT",
  "hasVariants": true,
  "variantOptions": [
    { "key": "color",   "label": "Color",   "values": ["Black", "Green"] },
    { "key": "ram",     "label": "RAM",     "values": ["4GB", "6GB"] },
    { "key": "storage", "label": "Storage", "values": ["128GB"] }
  ],
  "attributes": { "display_size": "6.56", "battery_mah": 5200, "os": "Android" },
  "tags": ["honor", "x6b", "budget"],
  "warranty": "12 Months"
}
```

**Guard rails** (enforced server-side):
- Unknown attribute keys → 400
- `variantOptions[].key` must match a category attribute with `isVariantOption: true` → 400
- Created with `status: 'pending'`; admin must approve before it appears in the public list

### 5.4 Update / delete (vendor-owner or admin)

```
PATCH  /products/:id                [vendor-owner | admin]
DELETE /products/:id                [vendor-owner | admin]
```

Vendor edits bump status back to `pending` (re-approval required).

### 5.5 Approve / reject (admin only)

```
PATCH /products/:id/status          [admin]
```

```json
{ "status": "approved" }
```

or

```json
{ "status": "rejected", "rejectionReason": "Low-quality images" }
```

### 5.6 Vendor dashboard list

```
GET /products/vendor/me             [vendor | admin]
```

Returns the vendor's own products (all statuses, including rejected).

---

## 6. Variants

A variant is a specific purchasable combination of a product's `variantOptions`. A single product with 2 colors × 2 RAM × 1 storage has 4 variants.

### 6.1 List variants for a product (public)

```
GET /variants/product/:productId
```

Used by the product-detail page to build the variant picker.

### 6.2 Create one variant

```
POST /variants                      [vendor-owner | admin]
```

```json
{
  "product": "<productId>",
  "sku": "X6B-BLK-4GB-128",
  "options": { "color": "Black", "ram": "4GB", "storage": "128GB" },
  "price": 14999,
  "compareAtPrice": 16999,
  "stock": 50,
  "images": ["https://..."]
}
```

Rejected (400) if `options` keys don't match the product's declared `variantOptions`.

### 6.3 Bulk-generate all variants at once

```
POST /variants/bulk                 [vendor-owner | admin]
```

```json
{
  "product": "<productId>",
  "defaults": { "price": 14999, "compareAtPrice": 16999, "stock": 50 },
  "overrides": [
    { "options": { "color": "Green", "ram": "6GB", "storage": "128GB" }, "price": 15499 }
  ]
}
```

Generates the full cartesian product of `variantOptions` and creates one variant per combination, applying overrides where given. **Use this after creating a product — much faster than posting one at a time.**

### 6.4 Update / deactivate

```
PATCH  /variants/:id                [vendor-owner | admin]
DELETE /variants/:id                [vendor-owner | admin]   (soft — isActive=false)
```

---

## 7. Cart

Cart **never stores price** — prices are resolved from the current variant on every read and re-validated at order time. This prevents client-side price tampering.

### 7.1 Get my cart

```
GET /cart                           [user | vendor | admin]
```

Response:
```json
{
  "data": {
    "items": [
      {
        "product": { "_id": "...", "name": "HONOR X6b", "thumbnail": "..." },
        "variant": { "_id": "...", "sku": "...", "options": { "color": "Black" }, "price": 14999, "stock": 50 },
        "quantity": 2,
        "lineTotal": 29998,
        "availableStock": 50
      }
    ],
    "subtotal": 29998,
    "itemCount": 2
  }
}
```

### 7.2 Add / update / remove

```
POST   /cart/items                  { product, variant, quantity }
PATCH  /cart/items/:variantId       { quantity }
DELETE /cart/items/:variantId
DELETE /cart                                              (clear)
```

All return the refreshed cart shape above.

---

## 8. Orders

### 8.1 Create order from cart

```
POST /orders                        [user | vendor]
```

```json
{
  "shippingAddress": {
    "fullName": "Alex", "line1": "12 Main St", "city": "Dhaka",
    "country": "Bangladesh", "postalCode": "1205", "phone": "+880..."
  },
  "paymentMethod": "stripe"
}
```

**Server-side transaction:**
1. Loads cart
2. For each item: checks availability = `stock - reservedStock`
3. Atomically increments `reservedStock` (fails fast if another buyer drained the stock)
4. Snapshots product/variant name, SKU, options, and **DB price** into the order
5. Creates the Order with `status: 'pending'`, `paymentStatus: 'unpaid'`
6. Clears cart

If the transaction fails, all reservations are rolled back automatically.

### 8.2 Get my orders

```
GET /orders/me                      [any authenticated]
GET /orders/:id                     [owner | admin | vendor-of-item]
```

Vendors viewing an order see **only the items they sold**, not the whole order.

### 8.3 Cancel

```
PATCH /orders/:id/cancel            [order-owner]
```

If the order was unpaid, the reservation is released. If it was paid, stock is restored.

### 8.4 Update fulfilment status

```
PATCH /orders/:id/status            [vendor-of-item | admin]
```

```json
{ "status": "shipped", "note": "Tracking: XYZ123" }
```

Only legal transitions are allowed:
- `paid` → `processing | cancelled`
- `processing` → `shipped | cancelled`
- `shipped` → `delivered`

### 8.5 Vendor + admin dashboards

```
GET /orders/vendor/me               [vendor | admin]
GET /orders                         [admin]
```

---

## 9. Payments — Stripe

### 9.1 End-to-end flow

```
1. Client:  POST /orders               →  { orderId, total, status: 'pending' }
2. Client:  POST /payments/checkout-session  { orderId }
            →  { url, sessionId }
3. Client:  window.location = url       →  Stripe-hosted Checkout page
4. User:    completes payment
5. Stripe → POST /api/v1/payments/webhook (signed)
            →  order.status = 'paid'; stock committed
6. Stripe → redirects user to CLIENT_URL/checkout/success?orderId=...
```

### 9.2 Create checkout session

```
POST /payments/checkout-session     [authenticated user]
```

```json
{ "orderId": "..." }
```

Response:
```json
{ "data": { "url": "https://checkout.stripe.com/...", "sessionId": "cs_..." } }
```

Redirect the user to the returned `url`.

### 9.3 Webhook

```
POST /api/v1/payments/webhook
```

Stripe calls this. Mounted at the **app level** in [app.ts](src/app.ts) with `express.raw` **before** the JSON parser — required for signature verification.

**Never call this from the frontend.** Register it in your Stripe Dashboard with `STRIPE_WEBHOOK_SECRET` copied into `.env`.

Events handled:
- `checkout.session.completed` → mark paid, decrement stock, release reservation, increment `totalSold`
- `checkout.session.expired`, `payment_intent.payment_failed` → release reservation, mark order `cancelled` + `paymentStatus: 'failed'`

All handlers are idempotent — Stripe retries are safe.

### 9.4 BDT note

Stripe doesn't natively support BDT. The implementation falls back to USD with a placeholder FX rate — see [payment.service.ts:11-27](src/modules/payments/payment.service.ts#L11-L27). Swap for a real FX provider before production.

---

## 10. Reviews & Questions

Pre-existing modules kept as-is. Endpoints:

```
GET  /reviews
POST /reviews
GET  /questions
POST /questions
PATCH /questions/:id/answer
```

Both currently take `productId` as a string (tech debt) — refactor is queued for later.

---

## 11. Admin — typical flows

### 11.1 Bootstrap a brand-new category

```
POST /categories  (admin)     # define blueprint
POST /products    (vendor)    # create product referencing that category
POST /variants/bulk (vendor)  # generate all SKU combinations
PATCH /products/:id/status (admin)  { status: 'approved' }
```

### 11.2 Approve a new vendor

```
GET   /vendors                       # (optional) list all
GET   /vendors?status=pending        # admin UI filter
PATCH /vendors/:id/status { status: 'approved', commissionRate: 0.08 }
```

### 11.3 Approve a product

```
GET   /products?status=pending
PATCH /products/:id/status { status: 'approved' }
```

---

## 12. Frontend integration cookbook

### 12.1 axios instance

```js
// src/api/axios.js
import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:5000/api/v1' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = token; // already "Bearer ..."
  return config;
});
export default api;
```

### 12.2 Login → role-based redirect

```js
const res = await api.post('/auth/login', { email, password });
localStorage.setItem('token', res.data.token);
localStorage.setItem('user', JSON.stringify(res.data.data));

if (res.data.data.role === 'admin') navigate('/admin');
else navigate('/');
```

### 12.3 Guard admin routes

```jsx
const { user } = useAuth();
if (!user) return <Navigate to="/login" />;
if (user.role !== 'admin') return <Navigate to="/" />;
return children;
```

---

## 13. Environment variables

```
NODE_ENV=development
PORT=5000
DB_URL=mongodb://localhost:27017/zyromart
BCRYPT_SALT_ROUNDS=10
JWT_ACCESS_SECRET=<random>
JWT_ACCESS_EXPIRES_IN=7d
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=admin
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=http://localhost:5173
DEFAULT_CURRENCY=BDT
```

---

## 14. When to use what (quick reference)

| I want to...                                    | Use |
|--------------------------------------------------|-----|
| Add a new product type (Drone, Smartwatch, …)   | POST `/categories` with an `attributeSchema` — no code changes needed |
| Sell as a new vendor                             | POST `/vendors/apply` then wait for admin approval |
| Upload a new product                             | POST `/products` then POST `/variants/bulk` |
| Show a product detail page                       | GET `/products/:slug` (variants are included) |
| Filter the catalog                               | GET `/products?brand=Honor&minPrice=10000` |
| Let a user buy                                   | `/cart/items` → `/orders` → `/payments/checkout-session` |
| Let an admin moderate                            | GET `/products?status=pending` then PATCH `/products/:id/status` |
| Let a vendor update order fulfilment             | PATCH `/orders/:id/status` |
| Capture payment                                  | Stripe webhook — already wired — no client action needed |
