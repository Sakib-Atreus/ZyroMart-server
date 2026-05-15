# ZyroMart API — Request & Response Reference

This document shows every endpoint with **exact JSON bodies and responses**. Use it to understand what to send and what comes back.

**Base URL:** `http://localhost:5000/api/v1`
**Content-Type:** `application/json` (except Stripe webhook — raw bytes)

---

## Table of contents

1. [Response envelope](#1-response-envelope)
2. [Auth](#2-auth)
3. [Categories](#3-categories)
4. [Vendors](#4-vendors)
5. [Products](#5-products)
6. [Variants](#6-variants)
7. [Cart](#7-cart)
8. [Orders](#8-orders)
9. [Payments](#9-payments)
10. [Error responses](#10-error-responses)
11. [End-to-end flow](#11-end-to-end-flow)

---

## 1. Response envelope

### 1.1 Success

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products fetched",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 87,
    "totalPages": 8
  }
}
```

- `data` is always present on success
- `meta` is only present on paginated list endpoints
- `token` appears only on `POST /auth/login`

### 1.2 Error

```json
{
  "success": false,
  "message": "Validation error",
  "errorMessages": [
    { "path": "email", "message": "Invalid email" }
  ],
  "statusCode": 400
}
```

### 1.3 Authorization header

Every protected endpoint expects:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The token is returned by `POST /auth/login` — already prefixed with `Bearer `.

---

## 2. Auth

### 2.1 `POST /auth/signup`

Create a new account. Public.

**Request**

```http
POST /api/v1/auth/signup
Content-Type: application/json
```

```json
{
  "name": "Alex Rahman",
  "email": "alex@example.com",
  "phone": "+8801700000000",
  "password": "hunter22",
  "address": "House 12, Road 5, Dhaka"
}
```

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User registered successfully",
  "data": {
    "_id": "65fc1e8b9a1b2c3d4e5f6a01",
    "name": "Alex Rahman",
    "email": "alex@example.com",
    "phone": "+8801700000000",
    "role": "user",
    "address": "House 12, Road 5, Dhaka",
    "isLoggedIn": false,
    "isDeleted": false,
    "createdAt": "2026-04-21T09:12:11.452Z",
    "updatedAt": "2026-04-21T09:12:11.452Z"
  }
}
```

---

### 2.2 `POST /auth/login`

Authenticate and receive an access token.

**Request**

```json
{
  "email": "alex@example.com",
  "password": "hunter22"
}
```

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User logged in successfully",
  "token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyRW1haWwiOiJhbGV4QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpZCI6IjY1ZmMxZThiOWExYjJjM2Q0ZTVmNmEwMSIsImlhdCI6MTcxNTE2NDM2NSwiZXhwIjoxNzE1NzY5MTY1fQ.5a7Q...",
  "data": {
    "_id": "65fc1e8b9a1b2c3d4e5f6a01",
    "name": "Alex Rahman",
    "email": "alex@example.com",
    "role": "user",
    "isLoggedIn": true,
    "loggedInTime": "2026-04-21T09:12:45.121Z"
  }
}
```

**Client action after login**

```js
localStorage.setItem("token", res.token);
localStorage.setItem("user", JSON.stringify(res.data));
if (res.data.role === "admin") navigate("/admin");
else navigate("/");
```

**Response — 400** (wrong password)

```json
{
  "success": false,
  "message": "Password do not matched!",
  "errorMessages": [],
  "statusCode": 400
}
```

---

### 2.3 `POST /auth/change-password`

Requires auth.

**Request**

```http
Authorization: Bearer <token>
```

```json
{
  "oldPassword": "hunter22",
  "newPassword": "newStrongPass1!"
}
```

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password changed successfully",
  "data": { "message": "Password updated successfully" }
}
```

---

### 2.4 `POST /auth/logout`

**Request**

```http
Authorization: Bearer <token>
```

No body.

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User logged out successfully",
  "data": null
}
```

---

## 3. Categories

Categories carry an `attributeSchema` which drives the shape of products created under them. Think of them as product-type blueprints.

### 3.1 `GET /categories`

Public. Returns all active categories.

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Categories fetched successfully",
  "data": [
    {
      "_id": "65fc1e8b9a1b2c3d4e5f6b01",
      "name": "Phone",
      "slug": "phone",
      "parent": null,
      "icon": "https://cdn.zyromart.com/icons/phone.svg",
      "attributeSchema": [
        {
          "key": "display_size",
          "label": "Display",
          "group": "Display",
          "type": "string",
          "unit": "inch",
          "required": false,
          "isVariantOption": false,
          "filterable": true,
          "searchable": false
        },
        {
          "key": "battery_mah",
          "label": "Battery",
          "group": "Battery",
          "type": "number",
          "unit": "mAh",
          "filterable": true
        },
        {
          "key": "os",
          "label": "OS",
          "group": "System",
          "type": "enum",
          "options": ["Android", "iOS", "HarmonyOS"]
        },
        {
          "key": "color",
          "label": "Color",
          "group": "Appearance",
          "type": "string",
          "isVariantOption": true,
          "filterable": true
        },
        {
          "key": "ram",
          "label": "RAM",
          "group": "Memory",
          "type": "string",
          "unit": "GB",
          "isVariantOption": true,
          "filterable": true
        },
        {
          "key": "storage",
          "label": "Storage",
          "group": "Memory",
          "type": "string",
          "unit": "GB",
          "isVariantOption": true,
          "filterable": true
        }
      ],
      "isActive": true,
      "createdAt": "2026-04-10T10:00:00.000Z",
      "updatedAt": "2026-04-10T10:00:00.000Z"
    },
    {
      "_id": "65fc1e8b9a1b2c3d4e5f6b02",
      "name": "Laptop",
      "slug": "laptop",
      "attributeSchema": [
        { "key": "cpu", "label": "CPU", "group": "Performance", "type": "string" },
        { "key": "gpu", "label": "GPU", "group": "Performance", "type": "string" },
        { "key": "ram", "label": "RAM", "group": "Memory", "type": "string", "unit": "GB", "isVariantOption": true },
        { "key": "storage", "label": "Storage", "group": "Memory", "type": "string", "unit": "GB", "isVariantOption": true }
      ],
      "isActive": true
    }
  ]
}
```

---

### 3.2 `GET /categories/:slug`

Public. Returns a single category with its full attribute blueprint.

**Request:** `GET /categories/phone`

**Response — 200 OK** — same shape as one element of 3.1.

---

### 3.3 `POST /categories`

**Admin only.**

**Request**

```http
POST /api/v1/categories
Authorization: Bearer <admin-token>
```

```json
{
  "name": "Smart Watch",
  "icon": "https://cdn.zyromart.com/icons/watch.svg",
  "attributeSchema": [
    {
      "key": "display_size",
      "label": "Display",
      "group": "Display",
      "type": "string",
      "unit": "inch"
    },
    {
      "key": "water_resistance",
      "label": "Water Resistance",
      "group": "Durability",
      "type": "enum",
      "options": ["IP67", "IP68", "5ATM", "10ATM"]
    },
    {
      "key": "color",
      "label": "Color",
      "group": "Appearance",
      "type": "string",
      "isVariantOption": true,
      "filterable": true
    },
    {
      "key": "strap_size",
      "label": "Strap Size",
      "group": "Appearance",
      "type": "string",
      "isVariantOption": true
    }
  ],
  "isActive": true
}
```

**Response — 201 Created**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Category created successfully",
  "data": {
    "_id": "65fc1e8b9a1b2c3d4e5f6b03",
    "name": "Smart Watch",
    "slug": "smart-watch",
    "icon": "https://cdn.zyromart.com/icons/watch.svg",
    "attributeSchema": [ ... ],
    "isActive": true,
    "createdAt": "2026-04-21T09:15:00.000Z",
    "updatedAt": "2026-04-21T09:15:00.000Z"
  }
}
```

---

### 3.4 `PATCH /categories/:id`

**Admin only.**

**Request**

```json
{
  "isActive": false
}
```

Any subset of the create payload is accepted.

**Response — 200 OK** — the updated document.

---

### 3.5 `DELETE /categories/:id`

**Admin only.** Soft-delete (sets `isActive: false`).

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Category deactivated successfully",
  "data": { "_id": "...", "isActive": false, ... }
}
```

---

## 4. Vendors

### 4.1 `POST /vendors/apply`

Authenticated users apply to become vendors.

**Request**

```http
Authorization: Bearer <user-token>
```

```json
{
  "shopName": "Alex Electronics",
  "description": "Small gadget shop in Dhanmondi",
  "logo": "https://cdn.zyromart.com/vendors/alex-logo.png",
  "banner": "https://cdn.zyromart.com/vendors/alex-banner.jpg",
  "address": {
    "line1": "27 Satmasjid Road",
    "city": "Dhaka",
    "country": "Bangladesh",
    "postalCode": "1209"
  },
  "contact": {
    "email": "shop@alex.com",
    "phone": "+8801711111111"
  }
}
```

**Response — 201 Created**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Vendor application submitted",
  "data": {
    "_id": "65fc1e8b9a1b2c3d4e5f6c01",
    "user": "65fc1e8b9a1b2c3d4e5f6a01",
    "shopName": "Alex Electronics",
    "slug": "alex-electronics",
    "description": "Small gadget shop in Dhanmondi",
    "logo": "https://...",
    "banner": "https://...",
    "address": { "line1": "27 Satmasjid Road", "city": "Dhaka", "country": "Bangladesh", "postalCode": "1209" },
    "contact": { "email": "shop@alex.com", "phone": "+8801711111111" },
    "status": "pending",
    "commissionRate": 0.08,
    "rating": 0,
    "totalSales": 0,
    "createdAt": "2026-04-21T09:20:00.000Z",
    "updatedAt": "2026-04-21T09:20:00.000Z"
  }
}
```

---

### 4.2 `GET /vendors/me`

Authenticated vendor or user.

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Vendor profile fetched",
  "data": { "_id": "...", "shopName": "Alex Electronics", "status": "approved", ... }
}
```

**Response — 404**

```json
{ "success": false, "statusCode": 404, "message": "Vendor profile not found" }
```

---

### 4.3 `PATCH /vendors/me`

**Request**

```json
{
  "description": "Updated description",
  "logo": "https://new-logo.png",
  "address": { "line1": "New address", "city": "Dhaka", "country": "Bangladesh" }
}
```

**Response — 200 OK** — the updated vendor document.

---

### 4.4 `GET /vendors`

Public. Lists **approved** vendors only.

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Vendors fetched",
  "data": [
    {
      "_id": "...",
      "shopName": "Alex Electronics",
      "slug": "alex-electronics",
      "logo": "https://...",
      "rating": 4.6,
      "totalSales": 1234,
      "status": "approved"
    }
  ]
}
```

---

### 4.5 `GET /vendors/:slug`

Public. Same shape as one item from 4.4.

---

### 4.6 `PATCH /vendors/:id/status`

**Admin only.** Approve, reject, or suspend. Approval auto-promotes the owning user to role `vendor`.

**Request — approve**

```json
{
  "status": "approved",
  "commissionRate": 0.08
}
```

**Request — reject**

```json
{
  "status": "rejected",
  "rejectionReason": "Incomplete business information"
}
```

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Vendor status updated to approved",
  "data": { "_id": "...", "status": "approved", "commissionRate": 0.08, ... }
}
```

---

## 5. Products

### 5.1 `GET /products`

Public. Paginated, searchable, filterable. Only `status=approved` & `isDeleted=false` are returned.

**Request**

```
GET /api/v1/products?searchTerm=honor&brand=HONOR&minPrice=10000&maxPrice=20000&page=1&limit=12&sort=-createdAt
```

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products fetched",
  "data": [
    {
      "_id": "65fc1e8b9a1b2c3d4e5f6d01",
      "vendor": "65fc1e8b9a1b2c3d4e5f6c01",
      "category": {
        "_id": "65fc1e8b9a1b2c3d4e5f6b01",
        "name": "Phone",
        "slug": "phone"
      },
      "name": "HONOR X6b",
      "slug": "honor-x6b",
      "brand": "HONOR",
      "description": "The HONOR X6B is a feature-packed smartphone...",
      "images": [
        "https://cdn.zyromart.com/honor-x6b-1.jpg",
        "https://cdn.zyromart.com/honor-x6b-2.jpg"
      ],
      "thumbnail": "https://cdn.zyromart.com/honor-x6b-1.jpg",
      "basePrice": 14999,
      "compareAtPrice": 16999,
      "currency": "BDT",
      "hasVariants": true,
      "variantOptions": [
        { "key": "color", "label": "Color", "values": ["Black", "Green"] },
        { "key": "ram", "label": "RAM", "values": ["4GB", "6GB"] },
        { "key": "storage", "label": "Storage", "values": ["128GB"] }
      ],
      "attributes": {
        "display_size": "6.56",
        "battery_mah": 5200,
        "os": "Android"
      },
      "tags": ["honor", "x6b", "budget"],
      "warranty": "12 Months",
      "status": "approved",
      "averageRating": 4.3,
      "reviewCount": 12,
      "questionCount": 3,
      "totalSold": 47,
      "createdAt": "2026-04-10T12:00:00.000Z",
      "updatedAt": "2026-04-15T08:30:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 12, "total": 37, "totalPages": 4 }
}
```

---

### 5.2 `GET /products/:slug`

Public. Returns a single product with variants, category, and vendor populated.

**Request:** `GET /products/honor-x6b`

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product fetched",
  "data": {
    "_id": "65fc1e8b9a1b2c3d4e5f6d01",
    "name": "HONOR X6b",
    "slug": "honor-x6b",
    "brand": "HONOR",
    "description": "...",
    "images": ["https://..."],
    "thumbnail": "https://...",
    "basePrice": 14999,
    "compareAtPrice": 16999,
    "currency": "BDT",
    "hasVariants": true,
    "variantOptions": [
      { "key": "color", "label": "Color", "values": ["Black", "Green"] },
      { "key": "ram", "label": "RAM", "values": ["4GB", "6GB"] },
      { "key": "storage", "label": "Storage", "values": ["128GB"] }
    ],
    "attributes": { "display_size": "6.56", "battery_mah": 5200, "os": "Android" },
    "tags": ["honor", "x6b"],
    "warranty": "12 Months",
    "status": "approved",
    "averageRating": 4.3,
    "reviewCount": 12,
    "totalSold": 47,
    "category": {
      "_id": "65fc1e8b9a1b2c3d4e5f6b01",
      "name": "Phone",
      "slug": "phone",
      "attributeSchema": [ ... ]
    },
    "vendor": {
      "_id": "65fc1e8b9a1b2c3d4e5f6c01",
      "shopName": "Alex Electronics",
      "slug": "alex-electronics",
      "logo": "https://...",
      "rating": 4.6
    },
    "variants": [
      {
        "_id": "65fc1e8b9a1b2c3d4e5f6e01",
        "product": "65fc1e8b9a1b2c3d4e5f6d01",
        "sku": "HONORX6B-BLK-4G-128",
        "options": { "color": "Black", "ram": "4GB", "storage": "128GB" },
        "price": 14999,
        "compareAtPrice": 16999,
        "stock": 50,
        "reservedStock": 2,
        "isActive": true
      },
      {
        "_id": "65fc1e8b9a1b2c3d4e5f6e02",
        "sku": "HONORX6B-BLK-6G-128",
        "options": { "color": "Black", "ram": "6GB", "storage": "128GB" },
        "price": 15999,
        "stock": 30,
        "reservedStock": 0,
        "isActive": true
      },
      {
        "_id": "65fc1e8b9a1b2c3d4e5f6e03",
        "sku": "HONORX6B-GRN-4G-128",
        "options": { "color": "Green", "ram": "4GB", "storage": "128GB" },
        "price": 14999,
        "stock": 20,
        "reservedStock": 0,
        "isActive": true
      },
      {
        "_id": "65fc1e8b9a1b2c3d4e5f6e04",
        "sku": "HONORX6B-GRN-6G-128",
        "options": { "color": "Green", "ram": "6GB", "storage": "128GB" },
        "price": 15999,
        "stock": 15,
        "reservedStock": 0,
        "isActive": true
      }
    ]
  }
}
```

---

### 5.3 `POST /products`

**Vendor only** (approved vendor account required).

**Request**

```http
Authorization: Bearer <vendor-token>
```

```json
{
  "category": "65fc1e8b9a1b2c3d4e5f6b01",
  "name": "HONOR X6b",
  "brand": "HONOR",
  "description": "The HONOR X6B is a feature-packed smartphone designed for users who demand style, performance, and reliability. 6.56-inch 90Hz display, 5200mAh battery, 50MP triple camera.",
  "shortDescription": "Budget 6.56\" phone with 90Hz display",
  "images": [
    "https://cdn.zyromart.com/honor-x6b-1.jpg",
    "https://cdn.zyromart.com/honor-x6b-2.jpg",
    "https://cdn.zyromart.com/honor-x6b-3.jpg"
  ],
  "thumbnail": "https://cdn.zyromart.com/honor-x6b-1.jpg",
  "basePrice": 14999,
  "compareAtPrice": 16999,
  "currency": "BDT",
  "hasVariants": true,
  "variantOptions": [
    { "key": "color", "label": "Color", "values": ["Black", "Green"] },
    { "key": "ram", "label": "RAM", "values": ["4GB", "6GB"] },
    { "key": "storage", "label": "Storage", "values": ["128GB"] }
  ],
  "attributes": {
    "display_size": "6.56",
    "battery_mah": 5200,
    "os": "Android"
  },
  "tags": ["honor", "x6b", "budget", "90hz"],
  "warranty": "12 Months"
}
```

**Response — 201 Created**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Product submitted for approval",
  "data": {
    "_id": "65fc1e8b9a1b2c3d4e5f6d01",
    "slug": "honor-x6b",
    "status": "pending",
    "vendor": "65fc1e8b9a1b2c3d4e5f6c01",
    "name": "HONOR X6b",
    ...
  }
}
```

**Common 400 errors**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Unknown attribute 'bluetooth_version' for this category"
}
```

```json
{
  "success": false,
  "statusCode": 400,
  "message": "'bluetooth' is not a variant-capable attribute for this category"
}
```

---

### 5.4 `PATCH /products/:id`

**Vendor-owner or admin.** Vendor edits reset `status` to `pending`.

**Request**

```json
{
  "basePrice": 13999,
  "compareAtPrice": 15999,
  "tags": ["honor", "x6b", "sale"]
}
```

**Response — 200 OK** — the updated product.

---

### 5.5 `DELETE /products/:id`

Soft-delete. **Vendor-owner or admin.**

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product deleted",
  "data": { "_id": "...", "isDeleted": true, "status": "archived" }
}
```

---

### 5.6 `PATCH /products/:id/status`

**Admin only.** Moderation.

**Request — approve**

```json
{ "status": "approved" }
```

**Request — reject**

```json
{
  "status": "rejected",
  "rejectionReason": "Low-quality images — please re-upload in minimum 1200×1200."
}
```

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product status updated to approved",
  "data": { "_id": "...", "status": "approved" }
}
```

---

### 5.7 `GET /products/vendor/me`

**Vendor or admin.** Returns the vendor's own products regardless of status.

**Request**

```
GET /api/v1/products/vendor/me?status=pending&page=1&limit=20
```

**Response — 200 OK**

Same shape as 5.1 but includes draft/pending/rejected products.

---

## 6. Variants

### 6.1 `GET /variants/product/:productId`

Public. List all active variants for a product.

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Variants fetched",
  "data": [
    {
      "_id": "65fc1e8b9a1b2c3d4e5f6e01",
      "product": "65fc1e8b9a1b2c3d4e5f6d01",
      "sku": "HONORX6B-BLK-4G-128",
      "options": { "color": "Black", "ram": "4GB", "storage": "128GB" },
      "optionsHash": "a3f...",
      "price": 14999,
      "compareAtPrice": 16999,
      "stock": 50,
      "reservedStock": 2,
      "isActive": true
    }
  ]
}
```

---

### 6.2 `POST /variants`

Create a single variant. **Vendor-owner or admin.**

**Request**

```json
{
  "product": "65fc1e8b9a1b2c3d4e5f6d01",
  "sku": "HONORX6B-BLK-4G-128",
  "options": { "color": "Black", "ram": "4GB", "storage": "128GB" },
  "price": 14999,
  "compareAtPrice": 16999,
  "stock": 50,
  "images": [
    "https://cdn.zyromart.com/honor-x6b-black-1.jpg"
  ]
}
```

**Response — 201 Created**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Variant created",
  "data": {
    "_id": "65fc1e8b9a1b2c3d4e5f6e01",
    "product": "65fc1e8b9a1b2c3d4e5f6d01",
    "sku": "HONORX6B-BLK-4G-128",
    "options": { "color": "Black", "ram": "4GB", "storage": "128GB" },
    "optionsHash": "a3f8d...",
    "price": 14999,
    "compareAtPrice": 16999,
    "stock": 50,
    "reservedStock": 0,
    "isActive": true,
    "createdAt": "2026-04-21T09:30:00.000Z"
  }
}
```

**Response — 400**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Option 'color' value 'Pink' not in declared values: Black, Green"
}
```

---

### 6.3 `POST /variants/bulk`

**Generate all variant combinations from the product's `variantOptions`.** Much faster than creating each variant one-by-one.

**Request**

```json
{
  "product": "65fc1e8b9a1b2c3d4e5f6d01",
  "defaults": {
    "price": 14999,
    "compareAtPrice": 16999,
    "stock": 50
  },
  "overrides": [
    {
      "options": { "color": "Black", "ram": "6GB", "storage": "128GB" },
      "price": 15999
    },
    {
      "options": { "color": "Green", "ram": "6GB", "storage": "128GB" },
      "price": 15999,
      "stock": 20
    }
  ]
}
```

If the product declares `color × ram × storage = 2 × 2 × 1 = 4` combinations, this creates 4 variants in one call.

**Response — 201 Created**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "4 variants created",
  "data": [
    { "_id": "...", "sku": "HONOR-X-a3f8d...", "options": {"color":"Black","ram":"4GB","storage":"128GB"}, "price": 14999, "stock": 50, ... },
    { "_id": "...", "sku": "HONOR-X-b7c21...", "options": {"color":"Black","ram":"6GB","storage":"128GB"}, "price": 15999, "stock": 50, ... },
    { "_id": "...", "sku": "HONOR-X-d9e33...", "options": {"color":"Green","ram":"4GB","storage":"128GB"}, "price": 14999, "stock": 50, ... },
    { "_id": "...", "sku": "HONOR-X-f1a44...", "options": {"color":"Green","ram":"6GB","storage":"128GB"}, "price": 15999, "stock": 20, ... }
  ]
}
```

---

### 6.4 `PATCH /variants/:id`

**Request**

```json
{
  "price": 13999,
  "stock": 40
}
```

**Response — 200 OK** — the updated variant.

---

### 6.5 `DELETE /variants/:id`

Soft-delete (sets `isActive: false`).

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Variant deactivated",
  "data": { "_id": "...", "isActive": false }
}
```

---

## 7. Cart

**Design rule:** the cart stores only `{ product, variant, quantity }`. Price is resolved from the Variant collection on every read and re-validated at order time. **Never trust a price from the client.**

### 7.1 `GET /cart`

Authenticated. Returns the hydrated cart.

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cart fetched",
  "data": {
    "items": [
      {
        "product": {
          "_id": "65fc1e8b9a1b2c3d4e5f6d01",
          "name": "HONOR X6b",
          "brand": "HONOR",
          "slug": "honor-x6b",
          "thumbnail": "https://cdn.zyromart.com/honor-x6b-1.jpg",
          "currency": "BDT",
          "status": "approved",
          "isDeleted": false
        },
        "variant": {
          "_id": "65fc1e8b9a1b2c3d4e5f6e02",
          "sku": "HONORX6B-BLK-6G-128",
          "options": { "color": "Black", "ram": "6GB", "storage": "128GB" },
          "price": 15999,
          "compareAtPrice": 17999,
          "stock": 30,
          "reservedStock": 0,
          "isActive": true,
          "images": []
        },
        "quantity": 2,
        "addedAt": "2026-04-21T09:35:00.000Z",
        "lineTotal": 31998,
        "availableStock": 30
      }
    ],
    "subtotal": 31998,
    "itemCount": 2
  }
}
```

Empty cart:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cart fetched",
  "data": { "items": [], "subtotal": 0, "itemCount": 0 }
}
```

---

### 7.2 `POST /cart/items`

Add or accumulate an item.

**Request**

```json
{
  "product": "65fc1e8b9a1b2c3d4e5f6d01",
  "variant": "65fc1e8b9a1b2c3d4e5f6e02",
  "quantity": 2
}
```

**Response — 200 OK** — full hydrated cart (same shape as 7.1).

**Response — 409**

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Only 3 unit(s) available"
}
```

---

### 7.3 `PATCH /cart/items/:variantId`

Update quantity of an existing line.

**Request:** `PATCH /cart/items/65fc1e8b9a1b2c3d4e5f6e02`

```json
{ "quantity": 3 }
```

**Response — 200 OK** — full hydrated cart.

---

### 7.4 `DELETE /cart/items/:variantId`

Remove a line.

**Response — 200 OK** — full hydrated cart.

---

### 7.5 `DELETE /cart`

Empty the cart.

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cart cleared",
  "data": { "items": [], "subtotal": 0, "itemCount": 0 }
}
```

---

## 8. Orders

### 8.1 `POST /orders`

Create an order from the current cart. **Transactional** — reserves stock atomically, snapshots prices from DB, clears the cart.

**Request**

```http
Authorization: Bearer <user-token>
```

```json
{
  "shippingAddress": {
    "fullName": "Alex Rahman",
    "line1": "House 12, Road 5",
    "line2": "Flat 4B",
    "city": "Dhaka",
    "country": "Bangladesh",
    "postalCode": "1205",
    "phone": "+8801700000000"
  },
  "paymentMethod": "stripe"
}
```

Optional `billingAddress` (falls back to `shippingAddress` if omitted) and `discount` (number) are also accepted.

**Response — 201 Created**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Order placed successfully",
  "data": {
    "_id": "65fc1e8b9a1b2c3d4e5f6f01",
    "orderNumber": "ZM-20260421-347812",
    "user": "65fc1e8b9a1b2c3d4e5f6a01",
    "items": [
      {
        "product": "65fc1e8b9a1b2c3d4e5f6d01",
        "variant": "65fc1e8b9a1b2c3d4e5f6e02",
        "vendor": "65fc1e8b9a1b2c3d4e5f6c01",
        "productSnapshot": {
          "name": "HONOR X6b",
          "brand": "HONOR",
          "thumbnail": "https://cdn.zyromart.com/honor-x6b-1.jpg",
          "slug": "honor-x6b"
        },
        "variantSnapshot": {
          "sku": "HONORX6B-BLK-6G-128",
          "options": { "color": "Black", "ram": "6GB", "storage": "128GB" }
        },
        "unitPrice": 15999,
        "quantity": 2,
        "subtotal": 31998
      }
    ],
    "shippingAddress": { ... },
    "billingAddress": { ... },
    "subtotal": 31998,
    "shippingFee": 60,
    "tax": 1600,
    "discount": 0,
    "total": 33658,
    "currency": "BDT",
    "status": "pending",
    "paymentStatus": "unpaid",
    "paymentMethod": "stripe",
    "statusHistory": [
      { "status": "pending", "at": "2026-04-21T09:40:00.000Z" }
    ],
    "placedAt": "2026-04-21T09:40:00.000Z",
    "createdAt": "2026-04-21T09:40:00.000Z"
  }
}
```

**Response — 400** (empty cart)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Cart is empty"
}
```

**Response — 409** (stock changed during checkout)

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Insufficient stock for 'HONOR X6b'. Please adjust your cart."
}
```

---

### 8.2 `GET /orders/me`

Authenticated. Paginated.

**Request:** `GET /orders/me?page=1&limit=10`

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Orders fetched",
  "data": [
    {
      "_id": "65fc1e8b9a1b2c3d4e5f6f01",
      "orderNumber": "ZM-20260421-347812",
      "total": 33658,
      "status": "paid",
      "paymentStatus": "paid",
      "placedAt": "2026-04-21T09:40:00.000Z",
      "items": [ ... ]
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

---

### 8.3 `GET /orders/:id`

Access rules:
- **Admin** — sees the full order
- **Order owner** — sees the full order
- **Vendor of one or more items** — sees only their own items

**Response — 200 OK (admin/owner)**

Full order document as in 8.1.

**Response — 200 OK (vendor — other-vendor items stripped)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order fetched",
  "data": {
    "_id": "...",
    "orderNumber": "ZM-20260421-347812",
    "items": [
      { "vendor": "<my-vendor-id>", ... }
    ],
    ...
  }
}
```

**Response — 403** (unrelated vendor)

```json
{ "success": false, "statusCode": 403, "message": "Forbidden" }
```

---

### 8.4 `PATCH /orders/:id/cancel`

Only the order owner can cancel, and only while the order is `pending | paid | processing`.

**Request**

```json
{ "reason": "Changed my mind" }
```

**Behavior:**
- If `paymentStatus: unpaid` → releases reserved stock
- If `paymentStatus: paid` → restores actual stock

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order cancelled",
  "data": {
    "_id": "...",
    "status": "cancelled",
    "cancelledAt": "2026-04-21T10:15:00.000Z",
    "statusHistory": [
      { "status": "pending", "at": "..." },
      { "status": "paid", "at": "..." },
      { "status": "cancelled", "at": "...", "note": "Changed my mind" }
    ]
  }
}
```

**Response — 400**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Cannot cancel order in status 'delivered'"
}
```

---

### 8.5 `PATCH /orders/:id/status`

**Vendor-of-item or admin.** Valid transitions:
- `paid → processing | cancelled`
- `processing → shipped | cancelled`
- `shipped → delivered`

**Request**

```json
{
  "status": "shipped",
  "note": "Tracking: PATHAO-XYZ123"
}
```

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order status updated to shipped",
  "data": {
    "_id": "...",
    "status": "shipped",
    "shippedAt": "2026-04-22T11:00:00.000Z",
    "statusHistory": [
      { "status": "pending", "at": "..." },
      { "status": "paid", "at": "..." },
      { "status": "processing", "at": "..." },
      { "status": "shipped", "at": "...", "note": "Tracking: PATHAO-XYZ123" }
    ]
  }
}
```

**Response — 400** (illegal transition)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Cannot transition pending -> shipped"
}
```

---

### 8.6 `GET /orders/vendor/me`

**Vendor or admin.** Returns every order containing any of the vendor's items.

**Response** — same shape as 8.2 (paginated list).

---

### 8.7 `GET /orders`

**Admin only.** All orders, paginated.

**Request:** `GET /orders?status=pending&page=1&limit=20`

**Response** — same shape as 8.2.

---

## 9. Payments

### 9.1 `POST /payments/checkout-session`

Create a Stripe Checkout session for an existing order.

**Request**

```http
Authorization: Bearer <user-token>
```

```json
{
  "orderId": "65fc1e8b9a1b2c3d4e5f6f01"
}
```

**Response — 200 OK**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Checkout session created",
  "data": {
    "url": "https://checkout.stripe.com/c/pay/cs_test_a1ZK...",
    "sessionId": "cs_test_a1ZK..."
  }
}
```

**Client action**

```js
window.location.href = res.data.url;
```

**Response — 400** (order already paid)

```json
{ "success": false, "statusCode": 400, "message": "Order already paid" }
```

---

### 9.2 `POST /payments/webhook`

**Stripe calls this endpoint — never the frontend.** Mounted with `express.raw` before `express.json` so the signature can be verified.

**Event: `checkout.session.completed`**

Stripe sends a signed raw body. The server:
1. Verifies the `stripe-signature` header using `STRIPE_WEBHOOK_SECRET`
2. Loads the order by `metadata.orderId`
3. If `paymentStatus` is already `paid` → returns 200 (idempotent)
4. Otherwise: decrements `stock` and `reservedStock` on each variant, increments `product.totalSold`, sets `order.status = 'paid'`, `order.paymentStatus = 'paid'`, `order.paidAt = now`, pushes `statusHistory`

**Response — 200 OK**

```json
{ "received": true }
```

**Response — 400** (bad signature)

```json
{ "success": false, "message": "Webhook Error: No signatures found matching the expected signature for payload" }
```

---

## 10. Error responses

| HTTP | When it happens                                            | Example message                                           |
|------|------------------------------------------------------------|------------------------------------------------------------|
| 400  | Zod validation fails / business rule violated              | `Validation error`, `Cart is empty`, `Unknown attribute`   |
| 401  | Missing / expired / invalid token                          | `You are not authorized`                                   |
| 403  | Authenticated but wrong role / not the owner               | `You have no access to this route`                         |
| 404  | Resource not found                                         | `Product not found`, `Category not found`                  |
| 409  | Conflict — duplicate or stock race                         | `Only 3 unit(s) available`, `Insufficient stock`           |
| 500  | Server/DB error                                            | `Something went wrong`                                     |

**Validation error shape**

```json
{
  "success": false,
  "message": "Validation error",
  "errorMessages": [
    { "path": "email", "message": "Invalid email" },
    { "path": "password", "message": "String must contain at least 6 character(s)" }
  ],
  "statusCode": 400
}
```

---

## 11. End-to-end flow

Full walkthrough: **admin seeds → vendor onboards → vendor lists product → customer buys & pays**.

### Step 1 — Admin creates category

```http
POST /api/v1/categories
Authorization: Bearer <admin-token>
```

```json
{
  "name": "Phone",
  "attributeSchema": [
    { "key": "display_size", "label": "Display", "group": "Display", "type": "string", "unit": "inch" },
    { "key": "battery_mah", "label": "Battery", "group": "Battery", "type": "number", "unit": "mAh" },
    { "key": "color", "label": "Color", "group": "Appearance", "type": "string", "isVariantOption": true },
    { "key": "ram", "label": "RAM", "group": "Memory", "type": "string", "unit": "GB", "isVariantOption": true },
    { "key": "storage", "label": "Storage", "group": "Memory", "type": "string", "unit": "GB", "isVariantOption": true }
  ]
}
```

Response includes `_id` of new category (needed later).

### Step 2 — User signs up

```http
POST /api/v1/auth/signup
```

```json
{
  "name": "Alex", "email": "alex@example.com", "phone": "+8801700000000",
  "password": "hunter22", "address": "Dhaka, Bangladesh"
}
```

### Step 3 — User applies to become a vendor

```http
POST /api/v1/auth/login
```

```json
{ "email": "alex@example.com", "password": "hunter22" }
```

→ save `token`

```http
POST /api/v1/vendors/apply
Authorization: Bearer <user-token>
```

```json
{
  "shopName": "Alex Electronics",
  "address": { "line1": "27 Satmasjid Rd", "city": "Dhaka", "country": "Bangladesh" },
  "contact": { "email": "shop@alex.com" }
}
```

### Step 4 — Admin approves the vendor

```http
PATCH /api/v1/vendors/<vendorId>/status
Authorization: Bearer <admin-token>
```

```json
{ "status": "approved", "commissionRate": 0.08 }
```

The user's role is now `vendor`. They must log in again to get a token reflecting the new role.

### Step 5 — Vendor creates a product

```http
POST /api/v1/products
Authorization: Bearer <vendor-token>
```

```json
{
  "category": "<category-id>",
  "name": "HONOR X6b",
  "brand": "HONOR",
  "description": "Feature-packed 6.56\" phone with 5200mAh battery.",
  "images": ["https://cdn.zyromart.com/x6b-1.jpg", "https://cdn.zyromart.com/x6b-2.jpg"],
  "thumbnail": "https://cdn.zyromart.com/x6b-1.jpg",
  "basePrice": 14999,
  "hasVariants": true,
  "variantOptions": [
    { "key": "color", "label": "Color", "values": ["Black", "Green"] },
    { "key": "ram", "label": "RAM", "values": ["4GB", "6GB"] },
    { "key": "storage", "label": "Storage", "values": ["128GB"] }
  ],
  "attributes": { "display_size": "6.56", "battery_mah": 5200 }
}
```

Response gives `productId`.

### Step 6 — Vendor generates variants

```http
POST /api/v1/variants/bulk
Authorization: Bearer <vendor-token>
```

```json
{
  "product": "<productId>",
  "defaults": { "price": 14999, "stock": 50, "compareAtPrice": 16999 },
  "overrides": [
    { "options": { "color": "Green", "ram": "6GB", "storage": "128GB" }, "price": 15999 }
  ]
}
```

→ 4 variants created.

### Step 7 — Admin approves the product

```http
PATCH /api/v1/products/<productId>/status
Authorization: Bearer <admin-token>
```

```json
{ "status": "approved" }
```

### Step 8 — Customer browses & adds to cart

```http
GET /api/v1/products?searchTerm=honor
```

→ returns product list, pick `honor-x6b`:

```http
GET /api/v1/products/honor-x6b
```

→ returns product with variants. User picks Black 6GB.

```http
POST /api/v1/cart/items
Authorization: Bearer <customer-token>
```

```json
{
  "product": "<productId>",
  "variant": "<blackSixGBVariantId>",
  "quantity": 1
}
```

### Step 9 — Customer places the order

```http
POST /api/v1/orders
Authorization: Bearer <customer-token>
```

```json
{
  "shippingAddress": {
    "fullName": "Alex", "line1": "House 12, Road 5", "city": "Dhaka",
    "country": "Bangladesh", "postalCode": "1205", "phone": "+8801700000000"
  },
  "paymentMethod": "stripe"
}
```

→ Response includes `_id`, `orderNumber`, `total`. Stock is now reserved.

### Step 10 — Create Stripe checkout session

```http
POST /api/v1/payments/checkout-session
Authorization: Bearer <customer-token>
```

```json
{ "orderId": "<orderId>" }
```

→ Response: `{ "url": "https://checkout.stripe.com/c/pay/cs_..." }`

### Step 11 — Customer pays on Stripe

Browser redirects to `res.data.url`. Customer enters card, Stripe redirects back to `CLIENT_URL/checkout/success?orderId=<orderId>`.

### Step 12 — Stripe webhook fires

```
POST /api/v1/payments/webhook   (from Stripe, signed)
event type: checkout.session.completed
```

Server commits the stock reservation, marks the order `paid`. **No frontend involvement.**

### Step 13 — Vendor fulfils

```http
PATCH /api/v1/orders/<orderId>/status
Authorization: Bearer <vendor-token>
```

```json
{ "status": "processing" }
```

Later:

```json
{ "status": "shipped", "note": "Tracking: PATHAO-XYZ123" }
```

Eventually:

```json
{ "status": "delivered" }
```

### Step 14 — Customer views order history

```http
GET /api/v1/orders/me
Authorization: Bearer <customer-token>
```

→ returns the order with full `statusHistory` audit trail.

---

## Appendix — typical headers

Every **authenticated** request:

```
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
```

Every **public** GET request:

```
Content-Type: application/json
Accept: application/json
```

The **Stripe webhook** endpoint is the only one that does NOT use `application/json` parsed body — it uses raw bytes plus a `stripe-signature` header.
