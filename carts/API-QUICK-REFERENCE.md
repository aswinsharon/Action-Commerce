# Carts API - Quick Reference Card

## Base URL
```
http://localhost:6004/carts
```

## Authentication
All requests require:
```
Authorization: Bearer <jwt-token>
x-client-id: <client-id>
```

## Endpoints

### 📋 Query Carts
```http
GET /carts?page=1&pageSize=20
```

### 🔍 Get Cart by ID
```http
GET /carts/{id}
```

### 🔑 Get Cart by Key
```http
GET /carts/key={key}
```

### 👤 Get Cart by Customer ID
```http
GET /carts/customer-id={customerId}
```

### ➕ Create Cart
```http
POST /carts
Content-Type: application/json

{
  "currency": "USD",
  "customerId": "customer-123",
  "customerEmail": "customer@example.com",
  "key": "cart-001"
}
```

### ✏️ Update Cart by ID
```http
POST /carts/{id}
Content-Type: application/json

{
  "version": 1,
  "actions": [...]
}
```

### ✏️ Update Cart by Key
```http
POST /carts/key={key}
Content-Type: application/json

{
  "version": 1,
  "actions": [...]
}
```

### 🗑️ Delete Cart by ID
```http
DELETE /carts/{id}?version=1
```

### 🗑️ Delete Cart by Key
```http
DELETE /carts/key={key}?version=1
```

## Update Actions

### 1. Add Line Item
```json
{
  "version": 1,
  "actions": [{
    "action": "addLineItem",
    "productId": "product-123",
    "variantId": 1,
    "quantity": 2
  }]
}
```

### 2. Remove Line Item
```json
{
  "version": 1,
  "actions": [{
    "action": "removeLineItem",
    "lineItemId": "line-item-id"
  }]
}
```

### 3. Change Line Item Quantity
```json
{
  "version": 1,
  "actions": [{
    "action": "changeLineItemQuantity",
    "lineItemId": "line-item-id",
    "quantity": 5
  }]
}
```

### 4. Set Shipping Address
```json
{
  "version": 1,
  "actions": [{
    "action": "setShippingAddress",
    "address": {
      "firstName": "John",
      "lastName": "Doe",
      "streetName": "123 Main St",
      "city": "New York",
      "country": "US"
    }
  }]
}
```

### 5. Set Billing Address
```json
{
  "version": 1,
  "actions": [{
    "action": "setBillingAddress",
    "address": {
      "firstName": "Jane",
      "lastName": "Smith",
      "streetName": "456 Oak Ave",
      "city": "Los Angeles",
      "country": "US"
    }
  }]
}
```

### 6. Set Customer Email
```json
{
  "version": 1,
  "actions": [{
    "action": "setCustomerEmail",
    "email": "newemail@example.com"
  }]
}
```

### 7. Set Cart State
```json
{
  "version": 1,
  "actions": [{
    "action": "setCartState",
    "state": "Ordered"
  }]
}
```

**Cart States:**
- `Active` - Cart is active (default)
- `Merged` - Cart merged with another
- `Ordered` - Cart converted to order

## Common Workflows

### 1. Create Cart & Add Products
```bash
# Step 1: Create cart
POST /carts
{
  "currency": "USD",
  "customerId": "customer-123"
}

# Step 2: Add product
POST /carts/{id}
{
  "version": 1,
  "actions": [{
    "action": "addLineItem",
    "productId": "product-456",
    "variantId": 1,
    "quantity": 2
  }]
}
```

### 2. Update Quantity
```bash
POST /carts/{id}
{
  "version": 2,
  "actions": [{
    "action": "changeLineItemQuantity",
    "lineItemId": "line-item-789",
    "quantity": 5
  }]
}
```

### 3. Set Addresses & Checkout
```bash
# Set shipping address
POST /carts/{id}
{
  "version": 3,
  "actions": [{
    "action": "setShippingAddress",
    "address": { "country": "US", "city": "New York" }
  }]
}

# Set billing address
POST /carts/{id}
{
  "version": 4,
  "actions": [{
    "action": "setBillingAddress",
    "address": { "country": "US", "city": "New York" }
  }]
}

# Mark as ordered
POST /carts/{id}
{
  "version": 5,
  "actions": [{
    "action": "setCartState",
    "state": "Ordered"
  }]
}
```

### 4. Remove Item
```bash
POST /carts/{id}
{
  "version": 2,
  "actions": [{
    "action": "removeLineItem",
    "lineItemId": "line-item-789"
  }]
}
```

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful delete) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (version mismatch) |
| 500 | Internal Server Error |

## Data Types

### Money
```json
{
  "centAmount": 10000,
  "currencyCode": "USD"
}
```
**Note:** $100.00 = 10000 cents

### Address
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "streetName": "123 Main St",
  "city": "New York",
  "country": "US"
}
```

### Line Item
```json
{
  "id": "line-item-123",
  "productId": "product-456",
  "quantity": 2,
  "price": {
    "value": {
      "centAmount": 5000,
      "currencyCode": "USD"
    }
  },
  "totalPrice": {
    "centAmount": 10000,
    "currencyCode": "USD"
  }
}
```

## Tips

1. **Always include version** in update requests
2. **Use keys** for idempotent cart creation
3. **Get by customer ID** to retrieve active cart
4. **Total price auto-calculates** when items change
5. **Set state to "Ordered"** when converting to order
6. **One active cart per customer** recommended

## Environment Variables

```bash
MONGO_URI=mongodb://username:password@127.0.0.1:27017
MONGO_DATABASE_NAME=ms_action_carts_db
MONGO_AUTH_SOURCE=admin
PORT=6004
LOG_LEVEL=ERROR
```
