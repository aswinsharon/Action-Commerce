# Authentication Architecture

## Overview

Action Commerce uses **centralized authentication** at the API Gateway level. This means JWT tokens are validated once at the gateway, and user information is forwarded to microservices via HTTP headers.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Postman/App)                    │
│              Authorization: Bearer <JWT_TOKEN>              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway (Port 3000)                │
│  ✓ Validates JWT token using JWT_SECRET                    │
│  ✓ Extracts user info (id, email, role)                    │
│  ✓ Adds headers: x-user-id, x-user-email, x-user-role      │
│  ✓ Proxies request to appropriate service                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ User-Mgmt    │  │   Payments   │  │    Carts     │
│ (Port 6001)  │  │ (Port 6005)  │  │ (Port 6004)  │
│              │  │              │  │              │
│ Validates    │  │ Trusts       │  │ Trusts       │
│ own tokens   │  │ gateway      │  │ gateway      │
│ (auth        │  │ headers      │  │ headers      │
│  authority)  │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Products    │  │  Categories  │  │   Orders     │
│ (Port 6002)  │  │ (Port 6003)  │  │ (Port 600X)  │
│              │  │              │  │              │
│ Trusts       │  │ Trusts       │  │ Trusts       │
│ gateway      │  │ gateway      │  │ gateway      │
│ headers      │  │ headers      │  │ headers      │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Authentication Flow

### 1. User Login/Register
```
POST http://localhost:3000/api/auth/login
Body: { "email": "admin@actioncommerce.com", "password": "admin123456" }

Response: { "data": { "token": "eyJhbGc..." } }
```

### 2. Authenticated Request
```
POST http://localhost:3000/api/payments
Headers:
  Authorization: Bearer eyJhbGc...
  x-client-id: postman-test-client
```

### 3. Gateway Processing
- Validates JWT token using `JWT_SECRET`
- Extracts: `{ id, email, role }` from token
- Adds headers:
  - `x-user-id: a8056475-4098-40cd-90b6-0a143dd7a235`
  - `x-user-email: admin@actioncommerce.com`
  - `x-user-role: admin`
- Proxies to: `http://localhost:6005/payments`

### 4. Service Processing
- Reads user info from headers
- Populates `req.user` object
- Performs authorization checks (role-based)
- Processes business logic

## Configuration

### API Gateway (.env)
```env
PORT=3000
JWT_SECRET=YXN3aW46MTIzNA==
USER_MANAGEMENT_URL=http://localhost:6001
PRODUCTS_SERVICE_URL=http://localhost:6002
CATEGORIES_SERVICE_URL=http://localhost:6003
CART_SERVICE_URL=http://localhost:6004
PAYMENTS_SERVICE_URL=http://localhost:6005
```

### Microservices (.env.local)
```env
# No JWT_SECRET needed - services trust gateway
PORT=600X
MONGO_URI=mongodb://...
# or POSTGRES_* for PostgreSQL services
```

## Security Considerations

### ✅ Advantages
1. **Single Point of Validation** - Token validated once at gateway
2. **Performance** - Services don't need to validate tokens
3. **Consistency** - All services use same auth mechanism
4. **Simplified Services** - No JWT dependencies in services
5. **Easy Updates** - Change auth logic in one place

### ⚠️ Important Notes
1. **Gateway Trust** - Services trust headers from gateway
2. **Network Security** - Services should only accept requests from gateway
3. **Internal Network** - Deploy services in private network
4. **Header Validation** - Services validate presence of user headers

## Public Endpoints

These endpoints bypass authentication:
- `/health` - Gateway health check
- `/health/services` - Service health checks
- `/api` - API documentation
- `/api/auth/login` - User login
- `/api/auth/register` - User registration

## Role-Based Authorization

Services implement role-based access control:

```typescript
// Example: Only admin and manager can create payments
router.post('/', 
  authenticateToken,           // Validates user headers exist
  authorizeRoles('admin', 'manager'),  // Checks user role
  paymentController.createPayment
);
```

### Available Roles
- `admin` - Full access to all operations
- `manager` - Create, read, update operations
- `customer` - Read own data, create orders

## Testing with Postman

1. **Import Collection**: `Action-Commerce-API-Collection.postman_collection.json`
2. **Import Environment**: `Action-Commerce-Environment.postman_environment.json`
3. **Login**: Run "Login Admin" request
4. **Auto-Token**: Token automatically saved to `{{auth_token}}`
5. **Make Requests**: All requests automatically include Bearer token

## Troubleshooting

### "User not authenticated" Error
- **Cause**: Gateway not forwarding user headers
- **Fix**: Ensure API Gateway is running and request goes through it

### "Invalid or expired token" Error
- **Cause**: JWT token expired or invalid
- **Fix**: Login again to get fresh token

### "Insufficient permissions" Error
- **Cause**: User role doesn't have access
- **Fix**: Use admin token or check role requirements

## Migration Notes

### Before (Distributed Auth)
- Each service validated JWT tokens
- Required `jsonwebtoken` package in all services
- JWT_SECRET in every service
- Token validation overhead in each service

### After (Centralized Auth)
- Gateway validates tokens once
- Services trust gateway headers
- No JWT dependencies in services
- Better performance and consistency
