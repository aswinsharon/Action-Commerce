# Payments API - Quick Reference Card

## Base URL
```
http://localhost:6005/payments
```

## Authentication
All requests require:
```
Authorization: Bearer <jwt-token>
x-client-id: <client-id>
```

## Endpoints

### 📋 Query Payments
```http
GET /payments?page=1&pageSize=20
```

### 🔍 Get Payment by ID
```http
GET /payments/{id}
```

### 🔑 Get Payment by Key
```http
GET /payments/key={key}
```

### ➕ Create Payment
```http
POST /payments
Content-Type: application/json

{
  "key": "payment-001",
  "amountPlanned": {
    "centAmount": 10000,
    "currencyCode": "USD"
  },
  "customer": {
    "typeId": "customer",
    "id": "customer-123"
  },
  "paymentMethodInfo": {
    "paymentInterface": "Stripe",
    "method": "CreditCard",
    "name": {
      "en": "Credit Card"
    }
  }
}
```

### ✏️ Update Payment by ID
```http
POST /payments/{id}
Content-Type: application/json

{
  "version": 1,
  "actions": [...]
}
```

### 🔑 Update Payment by Key
```http
POST /payments/key={key}
Content-Type: application/json

{
  "version": 1,
  "actions": [...]
}
```

### 🗑️ Delete Payment by ID
```http
DELETE /payments/{id}?version=1
```

### 🗑️ Delete Payment by Key
```http
DELETE /payments/key={key}?version=1
```

### 📊 Check Payment Exists
```http
HEAD /payments/{id}
```

### 📊 Check Payments Collection
```http
HEAD /payments
```

## Update Actions

### Add Transaction
```json
{
  "version": 1,
  "actions": [{
    "action": "addTransaction",
    "transaction": {
      "type": "Authorization",
      "amount": {
        "centAmount": 10000,
        "currencyCode": "USD"
      },
      "state": "Pending",
      "interactionId": "stripe-pi_123"
    }
  }]
}
```

**Transaction Types:**
- `Authorization` - Reserve funds
- `Charge` - Capture funds
- `Refund` - Return funds
- `CancelAuthorization` - Release reserved funds

**Transaction States:**
- `Initial` - Just created
- `Pending` - Processing
- `Success` - Completed
- `Failure` - Failed

### Change Amount Planned
```json
{
  "version": 1,
  "actions": [{
    "action": "changeAmountPlanned",
    "amount": {
      "centAmount": 15000,
      "currencyCode": "USD"
    }
  }]
}
```

### Set Customer
```json
{
  "version": 1,
  "actions": [{
    "action": "setCustomer",
    "customer": {
      "typeId": "customer",
      "id": "customer-456"
    }
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

## Error Response Format
```json
{
  "statusCode": 404,
  "message": "The Resource with ID 'xyz' was not found.",
  "errors": [{
    "code": "ResourceNotFound",
    "message": "The Resource with ID 'xyz' was not found."
  }]
}
```

## Success Response Format
```json
{
  "statusCode": 200,
  "code": "Success",
  "data": {
    "id": "payment-id",
    "version": 1,
    "createdAt": "2025-11-30T10:00:00.000Z",
    "lastModifiedAt": "2025-11-30T10:00:00.000Z",
    "amountPlanned": {
      "centAmount": 10000,
      "currencyCode": "USD"
    },
    "transactions": []
  }
}
```

## Money Format
```json
{
  "centAmount": 10000,
  "currencyCode": "USD"
}
```
**Note:** Amount is in smallest currency unit (cents). $100.00 = 10000 cents

## Reference Format
```json
{
  "typeId": "customer",
  "id": "customer-123"
}
```

## Localized String Format
```json
{
  "en": "Credit Card",
  "de": "Kreditkarte",
  "fr": "Carte de crédit"
}
```

## Role-Based Access

| Role | Permissions |
|------|-------------|
| admin | Full access (CRUD) |
| manager | Create, Read, Update |
| user | Read only |

## Optimistic Locking

All updates require the current `version` number:
1. Get payment (version: 1)
2. Update with version: 1
3. Version increments to 2
4. Concurrent update with version: 1 → **409 Conflict**

## Common Use Cases

### 1. Create Payment & Authorize
```bash
# Step 1: Create payment
POST /payments
{
  "amountPlanned": { "centAmount": 10000, "currencyCode": "USD" },
  "customer": { "typeId": "customer", "id": "cust-123" }
}

# Step 2: Add authorization transaction
POST /payments/{id}
{
  "version": 1,
  "actions": [{
    "action": "addTransaction",
    "transaction": {
      "type": "Authorization",
      "amount": { "centAmount": 10000, "currencyCode": "USD" },
      "state": "Success",
      "interactionId": "auth-123"
    }
  }]
}
```

### 2. Capture Payment
```bash
POST /payments/{id}
{
  "version": 2,
  "actions": [{
    "action": "addTransaction",
    "transaction": {
      "type": "Charge",
      "amount": { "centAmount": 10000, "currencyCode": "USD" },
      "state": "Success",
      "interactionId": "charge-456"
    }
  }]
}
```

### 3. Refund Payment
```bash
POST /payments/{id}
{
  "version": 3,
  "actions": [{
    "action": "addTransaction",
    "transaction": {
      "type": "Refund",
      "amount": { "centAmount": 5000, "currencyCode": "USD" },
      "state": "Success",
      "interactionId": "refund-789"
    }
  }]
}
```

## Tips

1. **Always include version** in update requests to prevent conflicts
2. **Use keys** for idempotent operations and easier lookups
3. **Store interactionId** to link with external payment systems
4. **Check transaction state** before proceeding with next steps
5. **Use centAmount** for precise currency calculations (avoid floating point)

## Environment Variables

```bash
MONGO_URI=mongodb://username:password@127.0.0.1:27017
MONGO_DATABASE_NAME=ms_action_payments_db
MONGO_AUTH_SOURCE=admin
PORT=6005
LOG_LEVEL=ERROR
```
