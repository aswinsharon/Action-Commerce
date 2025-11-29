# Action-Commerce

A headless e-commerce platform built with microservices architecture featuring role-based authentication, product management, and shopping cart functionality.

![Block Diagram](./docs/images/Architecture_Diagram.jpeg)

## Architecture Overview

This project consists of 5 microservices:

1. **API Gateway** (Port 3000) - Routes requests to appropriate microservices
2. **User Management** (Port 6001) - Authentication, authorization, and user management using PostgreSQL
3. **Products** (Port 6002) - Product catalog management using MongoDB
4. **Categories** (Port 6003) - Product categories management using MongoDB
5. **Cart** (Port 6004) - Shopping cart functionality using MongoDB

## Features

- **Role-based Authentication**: Admin, Manager, and Customer roles
- **JWT Token Authentication**: Secure API access
- **Database Optimization**: PostgreSQL for user data, MongoDB for product/cart data
- **Microservices Architecture**: Independent, scalable services
- **API Gateway**: Centralized routing and service discovery

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (for user management)
- MongoDB (for products, categories, and cart)
- npm or yarn

## Quick Start

### Option 1: Automated Start (Recommended)

Use the provided bash scripts to start all services automatically:

```bash
# Make scripts executable
chmod +x start-all-services.sh stop-all-services.sh

# Start all services in new terminal windows
./start-all-services.sh

# Or start in a tmux session
./start-all-services-tmux.sh

# Or start in background
./start-all-services-simple.sh

# Stop all services
./stop-all-services.sh
```

### Option 2: Manual Setup

#### 1. Install Dependencies

```bash
# Install dependencies for all services
cd user-management && npm install && cd ..
cd products && npm install && cd ..
cd categories && npm install && cd ..
cd cart && npm install && cd ..
cd api-gateway && npm install && cd ..
```

#### 2. Database Setup

**PostgreSQL Setup:**
```bash
# Create database for user management
createdb ms_action_users_db

# Or using Docker
docker run -d -p 5432:5432 --name postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=ms_action_users_db \
  postgres:latest
```

**MongoDB Setup:**
```bash
# Start MongoDB service
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Databases will be created automatically on first connection:
# - ms_action_products_db
# - ms_action_categories_db  
# - ms_action_cart_db
```

#### 3. Environment Configuration

Each service needs environment variables configured. See example `.env` files:

- `user-management/.env.local` - PostgreSQL connection and JWT settings
- `products/.env.local` - MongoDB connection and service URLs
- `categories/.env.local` - MongoDB connection
- `cart/.env.local` - MongoDB connection and service URLs
- `api-gateway/.env` - Service URLs and gateway port

#### 4. Start Services Manually

Start each service in separate terminals:

```bash
# Terminal 1: User Management Service
cd user-management && npm start

# Terminal 2: Products Service  
cd products && npm start

# Terminal 3: Categories Service
cd categories && npm start

# Terminal 4: Cart Service
cd cart && npm start

# Terminal 5: API Gateway
cd api-gateway && npm start
```

### Verify Installation

Check if all services are running:

```bash
# Check API Gateway health
curl http://localhost:3000/health

# Check all services health
curl http://localhost:3000/health/services
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[API Gateway Architecture](./docs/API-GATEWAY-ARCHITECTURE.md)** - Complete architecture overview, routing, authentication, and error handling
- **[Endpoint Reference](./docs/ENDPOINT-REFERENCE.md)** - Detailed API endpoint documentation with examples
- **[Quick Start Guide](./docs/QUICK-START-GUIDE.md)** - Step-by-step setup and testing guide
- **[Running Services](./docs/RUNNING-SERVICES.md)** - Different methods to start and manage services
- **[Type Definitions Guide](./TYPE-DEFINITIONS-GUIDE.md)** - TypeScript type definitions and data models

## API Endpoints

All API requests should go through the API Gateway at `http://localhost:3000/api`

### Authentication

```bash
# Register a new user
POST http://localhost:3000/api/auth/register
Headers: 
  Content-Type: application/json
  x-client-id: your-client-id
Body:
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "customer"
}

# Login
POST http://localhost:3000/api/auth/login
Headers:
  Content-Type: application/json
  x-client-id: your-client-id
Body:
{
  "email": "user@example.com",
  "password": "password123"
}

# Verify token
POST http://localhost:3000/api/auth/verify
Headers:
  Authorization: Bearer <token>
  x-client-id: your-client-id
```

### Products

```bash
# Get all products (authenticated)
GET http://localhost:3000/api/products
Headers:
  Authorization: Bearer <token>
  x-client-id: your-client-id

# Get product by ID (authenticated)
GET http://localhost:3000/api/products/:productId
Headers:
  Authorization: Bearer <token>
  x-client-id: your-client-id

# Create product (admin/manager only)
POST http://localhost:3000/api/products
Headers:
  Authorization: Bearer <token>
  x-client-id: your-client-id
  Content-Type: application/json

# Update product (admin/manager only)
PATCH http://localhost:3000/api/products/:productId
Headers:
  Authorization: Bearer <token>
  x-client-id: your-client-id
  Content-Type: application/json

# Delete product (admin only)
DELETE http://localhost:3000/api/products/:productId
Headers:
  Authorization: Bearer <token>
  x-client-id: your-client-id
```

### Categories

```bash
# Get all categories (authenticated)
GET http://localhost:3000/api/categories
Headers:
  Authorization: Bearer <token>
  x-client-id: your-client-id

# Get category by ID (authenticated)
GET http://localhost:3000/api/categories/:categoryId
Headers:
  Authorization: Bearer <token>
  x-client-id: your-client-id

# Create category (admin/manager only)
POST http://localhost:3000/api/categories
Headers:
  Authorization: Bearer <token>
  x-client-id: your-client-id
  Content-Type: application/json
```

### Cart

```bash
# Get user's cart (authenticated)
GET http://localhost:3000/api/carts
Headers:
  Authorization: Bearer <token>
  x-client-id: your-client-id

# Create cart (authenticated)
POST http://localhost:3000/api/carts
Headers:
  Authorization: Bearer <token>
  x-client-id: your-client-id
  Content-Type: application/json

# Add item to cart (authenticated)
POST http://localhost:3000/api/carts/:cartId/line-items
Headers:
  Authorization: Bearer <token>
  x-client-id: your-client-id
  Content-Type: application/json

# Remove item from cart (authenticated)
DELETE http://localhost:3000/api/carts/:cartId/line-items/:lineItemId
Headers:
  Authorization: Bearer <token>
  x-client-id: your-client-id

# Get all carts (admin only)
GET http://localhost:3000/api/carts/admin/all
Headers:
  Authorization: Bearer <token>
  x-client-id: your-client-id
```

**Note**: All authenticated requests require both `Authorization` and `x-client-id` headers.

For complete API documentation with request/response examples, see [Endpoint Reference](./docs/ENDPOINT-REFERENCE.md).

## User Roles

- **Admin**: Full access to all resources, can manage users, products, categories, and view all carts
- **Manager**: Can manage products and categories, limited user management
- **Customer**: Can view products, manage their own cart, basic profile access

## Data Models

### Cart Object Structure
```json
{
  "type": "Cart",
  "id": "27b39077-aa57-48a5-b504-914f68fa44dc",
  "version": 1,
  "createdAt": "2023-01-23T13:06:28.569Z",
  "lastModifiedAt": "2023-01-23T13:06:28.569Z",
  "lastModifiedBy": {"isPlatformClient": false},
  "createdBy": {"isPlatformClient": false},
  "lineItems": [],
  "cartState": "Active",
  "totalPrice": {
    "type": "centPrecision",
    "currencyCode": "EUR",
    "centAmount": 0,
    "fractionDigits": 2
  },
  "customerId": "user-id"
}
```

### Product Object Structure
```json
{
  "id": "e7ba4c75-b1bb-483d-94d8-2c4a10f78472",
  "version": 2,
  "masterData": {
    "current": {
      "categories": [{"id": "category-id", "typeId": "category"}],
      "description": {"en": "Sample description"},
      "masterVariant": {
        "id": 1,
        "sku": "sku_MB_PREMIUM_TECH_T_variant1",
        "prices": [{
          "value": {
            "type": "centPrecision",
            "fractionDigits": 2,
            "centAmount": 10000,
            "currencyCode": "EUR"
          }
        }]
      },
      "name": {"en": "MB PREMIUM TECH T"},
      "slug": {"en": "mb-premium-tech-t"}
    }
  }
}
```

## Development

### Building Services

```bash
# Build individual services
cd user-management && npm run build
cd products && npm run build  
cd categories && npm run build
cd cart && npm run build
```

### Testing

```bash
# Run tests (when implemented)
npm test
```

## Deployment

Each service can be deployed independently using the included `serverless.yml` configurations or containerized with Docker.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License
