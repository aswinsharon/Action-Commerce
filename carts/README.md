# Carts Microservice

Cart management microservice for Action Commerce platform with full Commerce Tools API compatibility.

## Features

- Create, read, update, and delete carts
- Line item management (add, remove, change quantity)
- Customer cart association
- Address management (shipping & billing)
- Cart state tracking (Active, Merged, Ordered)
- Optimistic concurrency control with versioning
- MongoDB integration
- **Redis caching for improved performance**
- RESTful API endpoints
- Health monitoring and cache statistics

## Cart Model

The cart object includes:
- `id`: Unique cart identifier
- `version`: Version number for optimistic locking
- `customerId`: Associated customer ID
- `customerEmail`: Customer email
- `totalPrice`: Total cart price with currency
- `lineItems`: Array of products in cart
- `customLineItems`: Custom line items
- `cartState`: Active, Merged, or Ordered
- `shippingAddress`: Delivery address
- `billingAddress`: Billing address
- `shippingInfo`: Shipping method and price
- `discountCodes`: Applied discount codes
- `custom`: Custom fields support

## Installation

```bash
npm install
```

### Redis Setup

For optimal performance, install and configure Redis:

```bash
# Quick setup (macOS/Linux)
./scripts/setup-redis.sh

# Manual installation
# macOS with Homebrew
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server

# Docker
docker run -d --name redis -p 6379:6379 redis:alpine
```

## Environment Variables

Create a `.env.local` file:

```
MONGO_URI=mongodb://username:password@127.0.0.1:27017
MONGO_DATABASE_NAME=ms_action_carts_db
MONGO_AUTH_SOURCE=admin
PORT=6004
LOG_LEVEL=ERROR

# Redis Configuration
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600
```

## Running the Service

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

**Commerce Tools Compatible API** - See documentation for full details.

### Carts
- `GET /carts` - Query all carts (paginated) *[Cached: 5min]*
- `GET /carts/:id` - Get cart by ID *[Cached: 30min]*
- `GET /carts/key=:key` - Get cart by key *[Cached: 30min]*
- `GET /carts/customer-id=:customerId` - Get active cart for customer *[Cached: 15min]*
- `POST /carts` - Create new cart
- `POST /carts/:id` - Update cart by ID (action-based)
- `POST /carts/key=:key` - Update cart by key (action-based)
- `DELETE /carts/:id?version={version}` - Delete cart by ID
- `DELETE /carts/key=:key?version={version}` - Delete cart by key
- `HEAD /carts` - Check carts metadata
- `HEAD /carts/:id` - Check cart exists

### Health & Monitoring
- `GET /health` - Service health check (includes cache status)
- `GET /health/cache` - Cache statistics (requires auth)
- `DELETE /health/cache?pattern=cart:*` - Clear cache (admin only)

**Note:** Updates use POST (not PATCH) following Commerce Tools conventions.

### Update Actions

The PATCH endpoint supports these actions:

1. **Add Line Item**
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

2. **Remove Line Item**
```json
{
  "version": 1,
  "actions": [{
    "action": "removeLineItem",
    "lineItemId": "line-item-id"
  }]
}
```

3. **Change Line Item Quantity**
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

4. **Set Shipping Address**
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

5. **Set Billing Address**
```json
{
  "version": 1,
  "actions": [{
    "action": "setBillingAddress",
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

6. **Set Customer Email**
```json
{
  "version": 1,
  "actions": [{
    "action": "setCustomerEmail",
    "email": "customer@example.com"
  }]
}
```

7. **Set Cart State**
```json
{
  "version": 1,
  "actions": [{
    "action": "setCartState",
    "state": "Ordered"
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
- `user`: Read only (own carts)

## Port

Default port: `6004`

## Example Usage

### Create Cart
```bash
POST /carts
Authorization: Bearer <token>
x-client-id: my-client
Content-Type: application/json

{
  "currency": "USD",
  "customerId": "customer-123",
  "customerEmail": "customer@example.com"
}
```

### Add Product to Cart
```bash
POST /carts/{id}
Authorization: Bearer <token>
Content-Type: application/json

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

### Get Customer's Active Cart
```bash
GET /carts/customer-id=customer-123
Authorization: Bearer <token>
```

### Update Quantity
```bash
POST /carts/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "version": 2,
  "actions": [{
    "action": "changeLineItemQuantity",
    "lineItemId": "line-item-789",
    "quantity": 5
  }]
}
```

## Redis Caching

The service includes Redis caching for improved performance:

### Cache Strategy
- **GET requests**: Automatically cached with configurable TTL
- **Modifications**: Automatically invalidate related cache entries
- **Graceful degradation**: Service works even if Redis is unavailable

### Cache TTL
- Cart lists: 5 minutes
- Customer carts: 15 minutes  
- Individual carts: 30 minutes

### Monitoring
```bash
# Check service health (includes cache status)
curl http://localhost:6004/health

# Get cache statistics
curl -H "Authorization: Bearer <token>" http://localhost:6004/health/cache

# Clear cache (admin only)
curl -X DELETE -H "Authorization: Bearer <admin-token>" \
  "http://localhost:6004/health/cache?pattern=cart:*"
```

For detailed caching information, see [REDIS-CACHING-GUIDE.md](./REDIS-CACHING-GUIDE.md).

## Performance

With Redis caching enabled:
- **50-90% faster** response times for cached requests
- **Reduced database load** for read operations
- **Better scalability** under high concurrent load