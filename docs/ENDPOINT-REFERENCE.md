# API Endpoint Reference

Complete reference for all Action Commerce API endpoints.

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.actioncommerce.com/api
```

## Authentication

All authenticated endpoints require:

```http
Authorization: Bearer <JWT_TOKEN>
x-client-id: <CLIENT_ID>
```

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint**: `POST /api/auth/register`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "role": "user"
}
```

**Response** (201):
```json
{
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "x-client-id: my-client-id" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "John Doe"
  }'
```

---

### Login

Authenticate user and receive JWT token.

**Endpoint**: `POST /api/auth/login`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200):
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    }
  }
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-client-id: my-client-id" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

---

### Verify Token

Verify JWT token validity.

**Endpoint**: `POST /api/auth/verify`

**Authentication**: Required

**Response** (200):
```json
{
  "statusCode": 200,
  "message": "Token is valid",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "user"
  }
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id"
```

---

## User Endpoints

### Get User Profile

Get current authenticated user's profile.

**Endpoint**: `GET /api/users/profile`

**Authentication**: Required

**Roles**: All authenticated users

**Response** (200):
```json
{
  "message": "Profile accessed successfully",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id"
```

---

### Admin Dashboard

Access admin-only resources.

**Endpoint**: `GET /api/users/admin`

**Authentication**: Required

**Roles**: admin

**Response** (200):
```json
{
  "message": "Admin access granted"
}
```

---

### Manager Dashboard

Access manager resources.

**Endpoint**: `GET /api/users/manager`

**Authentication**: Required

**Roles**: admin, manager

**Response** (200):
```json
{
  "message": "Manager access granted"
}
```

---

## Product Endpoints

### Get All Products

Retrieve all products with optional filtering.

**Endpoint**: `GET /api/products`

**Authentication**: Required

**Roles**: All authenticated users

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `category` (optional): Filter by category ID
- `search` (optional): Search in product name/description

**Response** (200):
```json
{
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": "product-uuid",
        "name": "Product Name",
        "description": "Product description",
        "price": 99.99,
        "categoryId": "category-uuid",
        "stock": 100,
        "images": ["url1", "url2"],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:3000/api/products?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id"
```

---

### Get Product by ID

Retrieve a specific product.

**Endpoint**: `GET /api/products/:productId`

**Authentication**: Required

**Roles**: All authenticated users

**Response** (200):
```json
{
  "statusCode": 200,
  "message": "Product retrieved successfully",
  "data": {
    "id": "product-uuid",
    "name": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "categoryId": "category-uuid",
    "stock": 100,
    "images": ["url1", "url2"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:3000/api/products/product-uuid \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id"
```

---

### Create Product

Create a new product.

**Endpoint**: `POST /api/products`

**Authentication**: Required

**Roles**: admin, manager

**Request Body**:
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "categoryId": "category-uuid",
  "stock": 100,
  "images": ["url1", "url2"]
}
```

**Response** (201):
```json
{
  "statusCode": 201,
  "message": "Product created successfully",
  "data": {
    "id": "product-uuid",
    "name": "New Product",
    "description": "Product description",
    "price": 99.99,
    "categoryId": "category-uuid",
    "stock": 100,
    "images": ["url1", "url2"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Product",
    "description": "Product description",
    "price": 99.99,
    "categoryId": "category-uuid",
    "stock": 100
  }'
```

---

### Update Product

Update an existing product.

**Endpoint**: `PATCH /api/products/:productId`

**Authentication**: Required

**Roles**: admin, manager

**Request Body** (partial update):
```json
{
  "name": "Updated Product Name",
  "price": 89.99,
  "stock": 150
}
```

**Response** (200):
```json
{
  "statusCode": 200,
  "message": "Product updated successfully",
  "data": {
    "id": "product-uuid",
    "name": "Updated Product Name",
    "price": 89.99,
    "stock": 150,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**cURL Example**:
```bash
curl -X PATCH http://localhost:3000/api/products/product-uuid \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 89.99,
    "stock": 150
  }'
```

---

### Delete Product

Delete a product.

**Endpoint**: `DELETE /api/products/:productId`

**Authentication**: Required

**Roles**: admin

**Response** (200):
```json
{
  "statusCode": 200,
  "message": "Product deleted successfully"
}
```

**cURL Example**:
```bash
curl -X DELETE http://localhost:3000/api/products/product-uuid \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id"
```

---

## Category Endpoints

### Check Categories Exist

Check if categories resource exists (HEAD request).

**Endpoint**: `HEAD /api/categories`

**Authentication**: Required

**Response**: 200 (no body)

---

### Check Category Exists

Check if a specific category exists.

**Endpoint**: `HEAD /api/categories/:categoryId`

**Authentication**: Required

**Response**: 200 (exists) or 404 (not found)

---

### Get All Categories

Retrieve all categories.

**Endpoint**: `GET /api/categories`

**Authentication**: Required

**Roles**: All authenticated users

**Response** (200):
```json
{
  "statusCode": 200,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "category-uuid",
      "name": "Electronics",
      "description": "Electronic products",
      "parentId": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:3000/api/categories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id"
```

---

### Get Category by ID

Retrieve a specific category.

**Endpoint**: `GET /api/categories/:categoryId`

**Authentication**: Required

**Roles**: All authenticated users

**Response** (200):
```json
{
  "statusCode": 200,
  "message": "Category retrieved successfully",
  "data": {
    "id": "category-uuid",
    "name": "Electronics",
    "description": "Electronic products",
    "parentId": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:3000/api/categories/category-uuid \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id"
```

---

### Create Category

Create a new category.

**Endpoint**: `POST /api/categories`

**Authentication**: Required

**Roles**: admin, manager

**Request Body**:
```json
{
  "name": "Electronics",
  "description": "Electronic products",
  "parentId": null
}
```

**Response** (201):
```json
{
  "statusCode": 201,
  "message": "Category created successfully",
  "data": {
    "id": "category-uuid",
    "name": "Electronics",
    "description": "Electronic products",
    "parentId": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "description": "Electronic products"
  }'
```

---

### Update Category

Update an existing category.

**Endpoint**: `PATCH /api/categories/:categoryId`

**Authentication**: Required

**Roles**: admin, manager

**Request Body** (partial update):
```json
{
  "name": "Updated Electronics",
  "description": "Updated description"
}
```

**Response** (200):
```json
{
  "statusCode": 200,
  "message": "Category updated successfully",
  "data": {
    "id": "category-uuid",
    "name": "Updated Electronics",
    "description": "Updated description",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**cURL Example**:
```bash
curl -X PATCH http://localhost:3000/api/categories/category-uuid \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Electronics"
  }'
```

---

### Delete Category

Delete a category.

**Endpoint**: `DELETE /api/categories/:categoryId`

**Authentication**: Required

**Roles**: admin

**Response** (200):
```json
{
  "statusCode": 200,
  "message": "Category deleted successfully"
}
```

**cURL Example**:
```bash
curl -X DELETE http://localhost:3000/api/categories/category-uuid \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id"
```

---

## Cart Endpoints

### Get User's Cart

Get the current user's active cart.

**Endpoint**: `GET /api/carts`

**Authentication**: Required

**Roles**: All authenticated users

**Response** (200):
```json
{
  "statusCode": 200,
  "message": "Cart retrieved successfully",
  "data": {
    "id": "cart-uuid",
    "userId": "user-uuid",
    "lineItems": [
      {
        "id": "line-item-uuid",
        "productId": "product-uuid",
        "quantity": 2,
        "price": 99.99,
        "total": 199.98
      }
    ],
    "totalPrice": 199.98,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:3000/api/carts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id"
```

---

### Get Cart by ID

Retrieve a specific cart.

**Endpoint**: `GET /api/carts/:cartId`

**Authentication**: Required

**Roles**: All authenticated users (own cart only)

**Response** (200):
```json
{
  "statusCode": 200,
  "message": "Cart retrieved successfully",
  "data": {
    "id": "cart-uuid",
    "userId": "user-uuid",
    "lineItems": [],
    "totalPrice": 0,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:3000/api/carts/cart-uuid \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id"
```

---

### Create Cart

Create a new cart for the user.

**Endpoint**: `POST /api/carts`

**Authentication**: Required

**Roles**: All authenticated users

**Request Body** (optional):
```json
{
  "lineItems": []
}
```

**Response** (201):
```json
{
  "statusCode": 201,
  "message": "Cart created successfully",
  "data": {
    "id": "cart-uuid",
    "userId": "user-uuid",
    "lineItems": [],
    "totalPrice": 0,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/carts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### Add Item to Cart

Add a product to the cart.

**Endpoint**: `POST /api/carts/:cartId/line-items`

**Authentication**: Required

**Roles**: All authenticated users

**Request Body**:
```json
{
  "productId": "product-uuid",
  "quantity": 2
}
```

**Response** (200):
```json
{
  "statusCode": 200,
  "message": "Item added to cart successfully",
  "data": {
    "id": "cart-uuid",
    "lineItems": [
      {
        "id": "line-item-uuid",
        "productId": "product-uuid",
        "quantity": 2,
        "price": 99.99,
        "total": 199.98
      }
    ],
    "totalPrice": 199.98,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/carts/cart-uuid/line-items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-uuid",
    "quantity": 2
  }'
```

---

### Remove Item from Cart

Remove a line item from the cart.

**Endpoint**: `DELETE /api/carts/:cartId/line-items/:lineItemId`

**Authentication**: Required

**Roles**: All authenticated users

**Response** (200):
```json
{
  "statusCode": 200,
  "message": "Item removed from cart successfully",
  "data": {
    "id": "cart-uuid",
    "lineItems": [],
    "totalPrice": 0,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**cURL Example**:
```bash
curl -X DELETE http://localhost:3000/api/carts/cart-uuid/line-items/line-item-uuid \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id"
```

---

### Get All Carts (Admin)

Retrieve all carts in the system.

**Endpoint**: `GET /api/carts/admin/all`

**Authentication**: Required

**Roles**: admin

**Response** (200):
```json
{
  "statusCode": 200,
  "message": "All carts retrieved successfully",
  "data": [
    {
      "id": "cart-uuid",
      "userId": "user-uuid",
      "lineItems": [],
      "totalPrice": 0,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:3000/api/carts/admin/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-client-id: my-client-id"
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid request data",
  "errors": [
    {
      "code": "BadRequest",
      "message": "Missing required field: name"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Access token is required",
  "errors": [
    {
      "code": "Unauthorized",
      "message": "No authorization header provided"
    }
  ]
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "errors": [
    {
      "code": "Forbidden",
      "message": "Admin role required"
    }
  ]
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "errors": [
    {
      "code": "NotFound",
      "message": "Product with ID 'xyz' not found"
    }
  ]
}
```

### 503 Service Unavailable
```json
{
  "statusCode": 503,
  "message": "Service is currently unavailable",
  "errors": [
    {
      "code": "ServiceUnavailable",
      "message": "Cannot connect to products service"
    }
  ]
}
```

---

## Postman Collection

Import the Postman collection for easy testing:

**File**: `Action-Commerce-API-Collection.postman_collection.json`

**Environment**: `Action-Commerce-Environment.postman_environment.json`

### Environment Variables

Set these in your Postman environment:

- `base_url`: `http://localhost:3000/api`
- `client_id`: Your client ID
- `jwt_token`: JWT token from login (auto-set)

---

## Rate Limiting

The API implements rate limiting:

- **Limit**: 100 requests per minute per IP (via Load Balancer)
- **Response**: 429 Too Many Requests

```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded",
  "errors": [
    {
      "code": "RateLimitExceeded",
      "message": "Too many requests, please try again later"
    }
  ]
}
```

---

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response Format**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

## Testing with cURL

### Complete Flow Example

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "x-client-id: test-client" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# 2. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-client-id: test-client" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  | jq -r '.data.token')

# 3. Get Products
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-client-id: test-client"

# 4. Create Cart
CART_ID=$(curl -X POST http://localhost:3000/api/carts \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-client-id: test-client" \
  -H "Content-Type: application/json" \
  -d '{}' \
  | jq -r '.data.id')

# 5. Add Item to Cart
curl -X POST http://localhost:3000/api/carts/$CART_ID/line-items \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-client-id: test-client" \
  -H "Content-Type: application/json" \
  -d '{"productId":"product-123","quantity":2}'
```

---

## Support

For issues or questions:
- Check service health: `GET /health/services`
- Review logs in each microservice
- Verify environment configuration
- Ensure all services are running
