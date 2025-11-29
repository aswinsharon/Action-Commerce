# Payments Microservice Setup Guide

## What Was Created

A complete payments microservice following the same architecture as the categories service, with full Commerce Tools API compatibility.

### Project Structure

```
payments/
├── src/
│   ├── index.ts                          # Main entry point
│   ├── models/
│   │   └── paymentSchema.ts              # MongoDB schema for payments
│   ├── service/
│   │   └── payment.service.ts            # Business logic layer
│   ├── controllers/
│   │   └── payment.controller.ts         # Request handlers
│   ├── routes/
│   │   └── payment.route.ts              # API route definitions
│   ├── types/
│   │   └── express.d.ts                  # TypeScript type extensions
│   └── common/
│       ├── config/
│       │   └── database.config.ts        # MongoDB connection
│       ├── loggers/
│       │   └── logger.ts                 # Logging utility
│       ├── middlewares/
│       │   ├── auth.middleware.ts        # Authentication
│       │   ├── errorHandler.ts           # Error handling
│       │   └── validateBody.ts           # Request validation
│       ├── dtos/
│       │   ├── payment.ts                # Payment data types
│       │   ├── success.response.ts       # Success response format
│       │   └── error.response.ts         # Error response format
│       ├── validations/
│       │   └── payment.validation.ts     # Joi validation schemas
│       ├── constants/
│       │   └── httpStatus.ts             # HTTP status codes
│       ├── decorators/
│       │   └── logger.decorators.ts      # Method logging decorator
│       └── utils/
│           └── utilities.ts              # Helper functions
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript config
├── .env.local                            # Environment variables
├── .gitignore                            # Git ignore rules
└── README.md                             # Documentation

```

## Installation Steps

1. **Fix npm permissions** (if needed):
   ```bash
   sudo chown -R $(whoami) ~/.npm
   ```

2. **Install dependencies**:
   ```bash
   cd payments
   npm install
   ```

3. **Configure environment**:
   Edit `.env.local` with your MongoDB credentials

4. **Build the project**:
   ```bash
   npm run build
   ```

5. **Start the service**:
   ```bash
   npm run dev
   ```

## Key Features Implemented

### Payment Model
- Full Commerce Tools Payment interface support
- Money type with centAmount and currencyCode
- Customer references
- Payment method information with localized names
- Payment status tracking
- Transaction management (Authorization, Charge, Refund, CancelAuthorization)
- Custom fields support
- Version-based optimistic locking

### API Endpoints
- CRUD operations for payments
- Pagination support
- HEAD requests for metadata
- Update actions:
  - addTransaction
  - changeAmountPlanned
  - setCustomer

### Middleware & Security
- JWT authentication
- Role-based authorization (admin, manager, user)
- Request body validation with Joi
- Error handling
- Logging with different levels (DEBUG, INFO, WARN, ERROR)

### Database
- MongoDB with Mongoose ODM
- Auto-reconnection on disconnect
- Connection pooling
- Command monitoring
- Graceful shutdown

## Next Steps

1. Install dependencies (resolve npm permission issue first)
2. Update API Gateway to route `/payments` requests to port 6005
3. Test the endpoints using Postman or similar tool
4. Add to startup scripts if needed

## Integration with API Gateway

Add to `api-gateway/index.js`:

```javascript
app.use('/payments', createProxyMiddleware({
    target: 'http://localhost:6005',
    changeOrigin: true,
    pathRewrite: {
        '^/payments': '/payments'
    }
}));
```

## Testing

Example payment creation:

```bash
curl -X POST http://localhost:6005/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "x-client-id: test-client" \
  -d '{
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
  }'
```
