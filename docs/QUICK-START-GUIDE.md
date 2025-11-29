# Quick Start Guide

Get the Action Commerce microservices up and running in minutes.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (for Products, Categories, Cart services)
- PostgreSQL (for User Management service)

## Installation

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# API Gateway
cd api-gateway && npm install && cd ..

# Load Balancer
cd load-balancer && npm install && cd ..

# User Management Service
cd user-management && npm install && cd ..

# Products Service
cd products && npm install && cd ..

# Categories Service
cd categories && npm install && cd ..

# Cart Service
cd cart && npm install && cd ..
```

### 2. Configure Environment Variables

#### User Management Service

Create `user-management/.env`:
```env
PORT=6001
NODE_ENV=development

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=ms_action_users_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

#### Products Service

Create `products/.env.local`:
```env
PORT=6002
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB=ms_action_products_db
MONGO_USER=
MONGO_PASSWORD=

# User Management Service (for auth)
USER_MANAGEMENT_URL=http://localhost:6001
```

#### Categories Service

Create `categories/.env.local`:
```env
PORT=6003
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB=ms_action_categories_db
MONGO_USER=
MONGO_PASSWORD=

# User Management Service (for auth)
USER_MANAGEMENT_URL=http://localhost:6001
```

#### Cart Service

Create `cart/.env.local`:
```env
PORT=6004
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB=ms_action_cart_db
MONGO_USER=
MONGO_PASSWORD=

# User Management Service (for auth)
USER_MANAGEMENT_URL=http://localhost:6001
```

#### API Gateway

Create `api-gateway/.env`:
```env
PORT=3000

# Microservice URLs
USER_MANAGEMENT_URL=http://localhost:6001
PRODUCTS_SERVICE_URL=http://localhost:6002
CATEGORIES_SERVICE_URL=http://localhost:6003
CART_SERVICE_URL=http://localhost:6004
```

### 3. Start Databases

#### MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use local installation
mongod
```

#### PostgreSQL
```bash
# Using Docker
docker run -d -p 5432:5432 --name postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=ms_action_users_db \
  postgres:latest

# Or use local installation
# Create database
psql -U postgres -c "CREATE DATABASE ms_action_users_db;"
```

## Running the Services

### Option 1: Run All Services (Recommended for Development)

Use separate terminal windows/tabs:

```bash
# Terminal 1: User Management
cd user-management && npm start

# Terminal 2: Products
cd products && npm start

# Terminal 3: Categories
cd categories && npm start

# Terminal 4: Cart
cd cart && npm start

# Terminal 5: API Gateway
cd api-gateway && npm start
```

### Option 2: Using npm scripts (from root)

```bash
# If you have concurrently installed
npm run start:all
```

### Option 3: Load Balancer (Optional)

```bash
# Terminal 6: Load Balancer
cd load-balancer && npm start
```

## Verify Installation

### 1. Check API Gateway Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "API Gateway is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": ["auth", "users", "products", "categories", "carts"]
}
```

### 2. Check All Services Health

```bash
curl http://localhost:3000/health/services
```

Expected response:
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
    },
    {
      "service": "categories",
      "status": "healthy",
      "url": "http://localhost:6003"
    },
    {
      "service": "carts",
      "status": "healthy",
      "url": "http://localhost:6004"
    }
  ]
}
```

## Test the API

### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "x-client-id: test-client" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "name": "Admin User",
    "role": "admin"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-client-id: test-client" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

Save the token from the response:
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {...}
  }
}
```

### 3. Create a Category

```bash
export TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-client-id: test-client" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "description": "Electronic products and gadgets"
  }'
```

### 4. Create a Product

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-client-id: test-client" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 999.99,
    "stock": 50,
    "categoryId": "category-id-from-previous-step"
  }'
```

### 5. Get All Products

```bash
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-client-id: test-client"
```

### 6. Create a Cart

```bash
curl -X POST http://localhost:3000/api/carts \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-client-id: test-client" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 7. Add Item to Cart

```bash
export CART_ID="cart-id-from-previous-step"
export PRODUCT_ID="product-id-from-step-4"

curl -X POST http://localhost:3000/api/carts/$CART_ID/line-items \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-client-id: test-client" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "'$PRODUCT_ID'",
    "quantity": 2
  }'
```

## Using Postman

### Import Collections

1. Open Postman
2. Click "Import"
3. Select files:
   - `Action-Commerce-API-Collection.postman_collection.json`
   - `Action-Commerce-Environment.postman_environment.json`

### Configure Environment

1. Select "Action Commerce Environment"
2. Set variables:
   - `base_url`: `http://localhost:3000/api`
   - `client_id`: `test-client`
   - `jwt_token`: (will be auto-set after login)

### Run Requests

1. Start with "Auth > Register" or "Auth > Login"
2. Token will be automatically saved to environment
3. Try other endpoints in the collection

## Troubleshooting

### Service Won't Start

**Problem**: Port already in use

**Solution**:
```bash
# Find process using port
lsof -i :6001  # or whatever port

# Kill process
kill -9 <PID>
```

### Database Connection Failed

**MongoDB**:
```bash
# Check if MongoDB is running
mongosh

# Or with Docker
docker ps | grep mongo
```

**PostgreSQL**:
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Or with Docker
docker ps | grep postgres
```

### Service Unavailable (503)

**Check service health**:
```bash
curl http://localhost:3000/health/services
```

**Check individual service**:
```bash
# User Management
curl http://localhost:6001/health

# Products
curl http://localhost:6002/health

# Categories
curl http://localhost:6003/health

# Cart
curl http://localhost:6004/health
```

### Authentication Failed

**Check headers**:
- `Authorization: Bearer <token>` is present
- `x-client-id` header is present
- Token is not expired (24h default)

**Get new token**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-client-id: test-client" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

### CORS Errors

All services have CORS enabled by default. If you encounter CORS issues:

1. Check that requests go through API Gateway (port 3000)
2. Verify `Origin` header is set correctly
3. Check browser console for specific CORS error

## Development Tips

### Hot Reload

Most services use nodemon for hot reload:

```bash
# User Management
cd user-management && npm run dev

# Products
cd products && npm run dev

# Categories
cd categories && npm run dev
```

### View Logs

Each service logs to console. Check the terminal where the service is running.

### Database GUI Tools

**MongoDB**:
- MongoDB Compass: https://www.mongodb.com/products/compass
- Studio 3T: https://studio3t.com/

**PostgreSQL**:
- pgAdmin: https://www.pgadmin.org/
- DBeaver: https://dbeaver.io/

### API Testing Tools

- Postman (included collections)
- Insomnia
- Thunder Client (VS Code extension)
- REST Client (VS Code extension)

## Next Steps

1. Read the [API Gateway Architecture](./API-GATEWAY-ARCHITECTURE.md)
2. Review the [Endpoint Reference](./ENDPOINT-REFERENCE.md)
3. Explore the Postman collection
4. Build your frontend application
5. Deploy to production

## Production Deployment

For production deployment:

1. Use environment-specific `.env` files
2. Enable HTTPS/SSL
3. Use managed databases (AWS RDS, MongoDB Atlas)
4. Implement proper logging (Winston, ELK stack)
5. Add monitoring (Prometheus, Grafana)
6. Use container orchestration (Docker, Kubernetes)
7. Implement CI/CD pipelines
8. Add API rate limiting per user
9. Enable request/response validation
10. Implement circuit breakers

## Support

For issues or questions:
- Check service logs
- Review environment configuration
- Verify database connections
- Test individual services directly
- Check the documentation files in `/docs`
