# Payments Microservice

Payment management microservice for Action Commerce platform.

## Features

- Create, read, update, and delete payments
- Transaction management (Authorization, Charge, Refund, CancelAuthorization)
- Payment status tracking
- Customer reference linking
- Payment method information
- Optimistic concurrency control with versioning
- MongoDB integration
- RESTful API endpoints

## Payment Model

The payment object includes:
- `id`: Unique payment identifier
- `version`: Version number for optimistic locking
- `amountPlanned`: Planned payment amount with currency
- `customer`: Reference to customer
- `paymentMethodInfo`: Payment interface and method details
- `paymentStatus`: Current payment status
- `transactions`: Array of payment transactions
- `custom`: Custom fields support

## Installation

```bash
npm install
```

Note: If you encounter permission issues with npm, run:
```bash
sudo chown -R $(whoami) ~/.npm
```

## Environment Variables

Create a `.env.local` file:

```
MONGO_URI=mongodb://username:password@127.0.0.1:27017
MONGO_DATABASE_NAME=ms_action_payments_db
MONGO_AUTH_SOURCE=admin
PORT=6005
LOG_LEVEL=ERROR
```

## Running the Service

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

**Commerce Tools Compatible API** - See [COMMERCETOOLS-API-COMPATIBILITY.md](./COMMERCETOOLS-API-COMPATIBILITY.md) for full details.

### Payments
- `GET /payments` - Query all payments (paginated)
- `GET /payments/:id` - Get payment by ID
- `GET /payments/key=:key` - Get payment by key
- `POST /payments` - Create new payment
- `POST /payments/:id` - Update payment by ID (action-based)
- `POST /payments/key=:key` - Update payment by key (action-based)
- `DELETE /payments/:id?version={version}` - Delete payment by ID
- `DELETE /payments/key=:key?version={version}` - Delete payment by key
- `HEAD /payments` - Check payments metadata
- `HEAD /payments/:id` - Check payment exists

**Note:** Updates use POST (not PATCH) following Commerce Tools conventions.

### Update Actions

The PATCH endpoint supports these actions:

1. **Add Transaction**
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
      "state": "Pending"
    }
  }]
}
```

2. **Change Amount Planned**
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

3. **Set Customer**
```json
{
  "version": 1,
  "actions": [{
    "action": "setCustomer",
    "customer": {
      "typeId": "customer",
      "id": "customer-id-123"
    }
  }]
}
```

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

Role-based access:
- `admin`: Full access
- `manager`: Create, read, update
- `user`: Read only

## Port

Default port: `6005`
