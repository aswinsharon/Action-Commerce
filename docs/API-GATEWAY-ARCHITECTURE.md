# API Gateway & Load Balancer Architecture

## Overview

This document describes the API Gateway and Load Balancer architecture for the Action Commerce microservices platform. The system consists of multiple independent microservices that communicate through a centralized API Gateway.

## Architecture Components

### 1. API Gateway (Port 3000)
The API Gateway serves as the single entry point for all client requests and routes them to appropriate microservices.

**Location**: `api-gateway/index.js`

**Key Features**:
- Centralized request routing
- Service health monitoring
- Request/response logging
- Error handling and standardization
- CORS support
- Header forwarding (authentication, client-id)

### 2. Load Balancer (Port 8000)
The Load Balancer provides advanced traffic distribution with failover support.

**Location**: `load-balancer/load-balancer.js`

**Key Features**:
- Round-robin load balancing
- Least-connections algorithm for POST/PUT requests
- Sticky sessions for GET requests
- Automatic health checks
- Failover and retry logic
- Rate limiting per IP
- Response caching for GET requests
- SSL/TLS support

### 3. Microservices

| Service | Port | Database | Description |
|---------|------|----------|-------------|
| User Management | 6001 | PostgreSQL | Authentication, user profiles, authorization |
| Products | 6002 | MongoDB | Product catalog management |
| Categories | 6003 | MongoDB | Product category management |
| Cart | 6004 | MongoDB | Shopping cart operations |

## API Gateway Endpoint Structure

All client requests should be made through the API Gateway using the `/api` prefix:

```
http://localhost:3000/api/{service}/{endpoint}
```

### Base URLs

**Development**:
- API Gateway: `http://localhost:3000`
- Load Balancer: `http://localhost:8000`

**Production**:
- API Gateway: `https://api.actioncommerce.com`
- Load Balancer: `https://lb.actioncommerce.com`

## Service Endpoints

### Authentication Service (`/api/auth`)

Routes to: User Management Service (port 6001)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/verify` | Verify JWT token | Yes |

**Example**:
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "x-client-id: your-client-id" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-client-id: your-client-id" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### User Service (`/api/users`)

Routes to: User Management Service (port 6001)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/users/profile` | Get current user profile | Yes | All |
| GET | `/api/users/test` | Test endpoint | No | - |
| GET | `/api/users/admin` | Admin dashboard | Yes | admin |
| GET | `/api/users/manager` | Manager dashboard | Yes | admin, manager |

**Example**:
```bash
# Get profile
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: your-client-id"
```

### Products Service (`/api/products`)

Routes to: Products Service (port 6002)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/products` | Get all products | Yes | All |
| GET | `/api/products/:productId` | Get product by ID | Yes | All |
| POST | `/api/products` | Create new product | Yes | admin, manager |
| PATCH | `/api/products/:productId` | Update product | Yes | admin, manager |
| DELETE | `/api/products/:productId` | Delete product | Yes | admin |

**Example**:
```bash
# Get all products
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: your-client-id"

# Create product
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: your-client-id" \
  -H "Content-Type: application/json" \
  -d '{"name":"Product Name","price":99.99,"description":"Product description"}'
```

### Categories Service (`/api/categories`)

Routes to: Categories Service (port 6003)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| HEAD | `/api/categories` | Check categories exist | Yes | All |
| HEAD | `/api/categories/:categoryId` | Check category exists | Yes | All |
| GET | `/api/categories` | Get all categories | Yes | All |
| GET | `/api/categories/:categoryId` | Get category by ID | Yes | All |
| POST | `/api/categories` | Create new category | Yes | admin, manager |
| PATCH | `/api/categories/:categoryId` | Update category | Yes | admin, manager |
| DELETE | `/api/categories/:categoryId` | Delete category | Yes | admin |

**Example**:
```bash
# Get all categories
curl -X GET http://localhost:3000/api/categories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: your-client-id"

# Create category
curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: your-client-id" \
  -H "Content-Type: application/json" \
  -d '{"name":"Electronics","description":"Electronic products"}'
```

### Cart Service (`/api/carts`)

Routes to: Cart Service (port 6004)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/carts` | Get user's cart | Yes | All |
| GET | `/api/carts/:cartId` | Get cart by ID | Yes | All |
| GET | `/api/carts/admin/all` | Get all carts | Yes | admin |
| POST | `/api/carts` | Create new cart | Yes | All |
| POST | `/api/carts/:cartId/line-items` | Add item to cart | Yes | All |
| DELETE | `/api/carts/:cartId/line-items/:lineItemId` | Remove item from cart | Yes | All |

**Example**:
```bash
# Get user's cart
curl -X GET http://localhost:3000/api/carts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: your-client-id"

# Add item to cart
curl -X POST http://localhost:3000/api/carts/cart123/line-items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: your-client-id" \
  -H "Content-Type: application/json" \
  -d '{"productId":"prod123","quantity":2}'
```

## Health Check Endpoints

### Gateway Health
```bash
GET http://localhost:3000/health
```

Response:
```json
{
  "status": "OK",
  "message": "API Gateway is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": ["auth", "users", "products", "categories", "carts"]
}
```

### Services Health
```bash
GET http://localhost:3000/health/services
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": [
    {
      "service": "auth",
      "status": "healthy",
      "url": "http://localhost:6001"
    },
    {
      "service": "products",
      "status": "healthy",
      "url": "http://localhost:6002"
    }
  ]
}
```

## Authentication & Authorization

### Required Headers

All authenticated requests must include:

1. **Authorization Header**: Bearer token from login
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Client ID Header**: Unique client identifier
   ```
   x-client-id: your-client-id
   ```

### Authentication Flow

1. **Register** or **Login** to get JWT token
2. Include token in `Authorization` header for subsequent requests
3. Include `x-client-id` header in all requests
4. Token is verified by User Management Service
5. User information is attached to request and forwarded to target service

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **user** | Read products, categories, manage own cart |
| **manager** | All user permissions + create/update products and categories |
| **admin** | All permissions + delete operations, view all carts |

## Error Handling

All errors follow a standardized format:

```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "errors": [
    {
      "code": "NotFound",
      "message": "The requested resource does not exist"
    }
  ]
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | BadRequest | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | NotFound | Resource not found |
| 429 | RateLimitExceeded | Too many requests |
| 500 | InternalError | Server error |
| 503 | ServiceUnavailable | Service is down |

## Load Balancer Configuration

### Service Configuration

Edit `load-balancer/services.json` to configure service instances:

```json
{
  "/products": [
    { "host": "localhost", "port": 6002 },
    { "host": "localhost", "port": 6012 }
  ]
}
```

### Load Balancing Strategies

1. **Round-Robin**: Default for all requests
2. **Least-Connections**: Used for POST/PUT requests
3. **Sticky Sessions**: Used for GET requests (session affinity)

### Features

- **Health Checks**: Every 5 seconds
- **Failover**: Automatic retry up to 3 times
- **Rate Limiting**: 100 requests per minute per IP
- **Caching**: 10-second TTL for GET requests
- **SSL/TLS**: Supports HTTPS with certificates

## Running the Services

### Start Individual Services

```bash
# User Management
cd user-management && npm start

# Products
cd products && npm start

# Categories
cd categories && npm start

# Cart
cd cart && npm start
```

### Start API Gateway

```bash
cd api-gateway && npm start
```

### Start Load Balancer

```bash
cd load-balancer && npm start
```

## Environment Configuration

### API Gateway (.env)

```env
PORT=3000
USER_MANAGEMENT_URL=http://localhost:6001
PRODUCTS_SERVICE_URL=http://localhost:6002
CATEGORIES_SERVICE_URL=http://localhost:6003
CART_SERVICE_URL=http://localhost:6004
```

### Microservices

Each service should have:
- `PORT`: Service port number
- Database connection strings
- `USER_MANAGEMENT_URL`: For auth verification

## Best Practices

1. **Always use the API Gateway** for client requests (not direct service calls)
2. **Include both headers** (Authorization and x-client-id) in authenticated requests
3. **Handle errors gracefully** using the standardized error format
4. **Monitor health endpoints** for service availability
5. **Use appropriate HTTP methods** (GET, POST, PATCH, DELETE)
6. **Implement retry logic** for transient failures
7. **Cache responses** when appropriate
8. **Use HTTPS** in production

## Monitoring & Logging

All requests are logged with:
- Timestamp
- HTTP method
- Request path
- Response status
- Duration

Example log:
```
[2024-01-01T00:00:00.000Z] GET /api/products - 200 (45ms)
[PROXY] GET /api/products -> http://localhost:6002/products
[RESPONSE] 200 from products
```

## Security Considerations

1. **JWT Tokens**: Short-lived, signed tokens
2. **CORS**: Configured for allowed origins
3. **Rate Limiting**: Prevents abuse
4. **Input Validation**: All services validate input
5. **Error Messages**: Don't expose sensitive information
6. **HTTPS**: Required in production
7. **Client ID**: Tracks and isolates client requests

## Troubleshooting

### Service Unavailable (503)
- Check if microservice is running
- Verify service URL in .env
- Check health endpoint: `/health/services`

### Unauthorized (401)
- Verify JWT token is valid
- Check token expiration
- Ensure x-client-id header is present

### Forbidden (403)
- Check user role permissions
- Verify token contains correct role

### Not Found (404)
- Verify endpoint path
- Check service is registered in gateway
- Ensure route exists in microservice

## Future Enhancements

- [ ] API versioning (v1, v2)
- [ ] Request/response transformation
- [ ] Advanced caching strategies
- [ ] Circuit breaker pattern
- [ ] Distributed tracing
- [ ] API rate limiting per user
- [ ] WebSocket support
- [ ] GraphQL gateway
