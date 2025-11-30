# Action Commerce - Postman Collection Guide

## Architecture Overview

All API requests now go through the **API Gateway** at `http://localhost:3000`. The gateway:
- Validates JWT tokens centrally
- Forwards authenticated user info to services
- Routes requests to appropriate microservices

## Updated Environment Variables

The following environment variables have been added/updated:

```json
{
  "base_url": "http://localhost:3000",
  "user_management_url": "http://localhost:6001",
  "products_url": "http://localhost:6002",
  "categories_url": "http://localhost:6003",
  "carts_url": "http://localhost:6004",
  "payments_url": "http://localhost:6005",
  "client_id": "postman-test-client",
  "auth_token": "",
  "admin_token": "",
  "manager_token": "",
  "customer_token": "",
  "category_id": "",
  "product_id": "",
  "product_key": "",
  "cart_id": "",
  "cart_key": "",
  "customer_id": "",
  "line_item_id": "",
  "payment_id": "",
  "payment_key": "",
  "variant_id": "1",
  "price_id": ""
}
```

## API Endpoints (via Gateway)

**Important:** All requests go through the API Gateway at `{{base_url}}/api/*`

### 💳 Payments Service

#### Query Payments
```
GET {{base_url}}/api/payments?page=1&pageSize=10
Headers: Authorization: Bearer {{auth_token}}
```

#### Get Payment by ID
```
GET {{base_url}}/api/payments/{{payment_id}}
Headers: Authorization: Bearer {{auth_token}}
```

#### Get Payment by Key
```
GET {{base_url}}/api/payments/key={{payment_key}}
Headers: Authorization: Bearer {{auth_token}}
```

#### Create Payment
```
POST {{base_url}}/api/payments
Headers: 
  Authorization: Bearer {{admin_token}}
  Content-Type: application/json
  x-client-id: {{client_id}}

Body:
{
  "key": "payment-001",
  "amountPlanned": {
    "centAmount": 10000,
    "currencyCode": "USD"
  },
  "customer": {
    "typeId": "customer",
    "id": "{{customer_id}}"
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

#### Update Payment - Add Transaction
```
POST {{base_url}}/api/payments/{{payment_id}}
Headers: 
  Authorization: Bearer {{admin_token}}
  Content-Type: application/json

Body:
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
      "interactionId": "stripe-pi-123"
    }
  }]
}
```

#### Update Payment - Change Amount
```
POST {{base_url}}/api/payments/{{payment_id}}
Body:
{
  "version": 2,
  "actions": [{
    "action": "changeAmountPlanned",
    "amount": {
      "centAmount": 15000,
      "currencyCode": "USD"
    }
  }]
}
```

#### Delete Payment
```
DELETE {{base_url}}/api/payments/{{payment_id}}?version=1
Headers: Authorization: Bearer {{admin_token}}
```

### 🛒 Carts Service

#### Query Carts
```
GET {{base_url}}/api/carts?page=1&pageSize=10
Headers: Authorization: Bearer {{auth_token}}
```

#### Get Cart by ID
```
GET {{base_url}}/api/carts/{{cart_id}}
Headers: Authorization: Bearer {{auth_token}}
```

#### Get Cart by Key
```
GET {{base_url}}/api/carts/key={{cart_key}}
Headers: Authorization: Bearer {{auth_token}}
```

#### Get Cart by Customer ID
```
GET {{base_url}}/api/carts/customer-id={{customer_id}}
Headers: Authorization: Bearer {{auth_token}}
```

#### Create Cart
```
POST {{base_url}}/api/carts
Headers: 
  Authorization: Bearer {{auth_token}}
  Content-Type: application/json
  x-client-id: {{client_id}}

Body:
{
  "currency": "USD",
  "customerId": "{{customer_id}}",
  "customerEmail": "customer@example.com",
  "key": "cart-001"
}
```

#### Update Cart - Add Line Item
```
POST {{base_url}}/api/carts/{{cart_id}}
Body:
{
  "version": 1,
  "actions": [{
    "action": "addLineItem",
    "productId": "{{product_id}}",
    "variantId": 1,
    "quantity": 2
  }]
}
```

#### Update Cart - Change Quantity
```
POST {{base_url}}/api/carts/{{cart_id}}
Body:
{
  "version": 2,
  "actions": [{
    "action": "changeLineItemQuantity",
    "lineItemId": "{{line_item_id}}",
    "quantity": 5
  }]
}
```

#### Update Cart - Set Shipping Address
```
POST {{base_url}}/api/carts/{{cart_id}}
Body:
{
  "version": 3,
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

#### Update Cart - Set Cart State
```
POST {{base_url}}/api/carts/{{cart_id}}
Body:
{
  "version": 4,
  "actions": [{
    "action": "setCartState",
    "state": "Ordered"
  }]
}
```

#### Delete Cart
```
DELETE {{base_url}}/api/carts/{{cart_id}}?version=1
Headers: Authorization: Bearer {{admin_token}}
```

### 🛍️ Products Service

#### Query Products
```
GET {{base_url}}/api/products?page=1&pageSize=10
Headers: Authorization: Bearer {{auth_token}}
```

#### Get Product by ID
```
GET {{base_url}}/api/products/{{product_id}}
Headers: Authorization: Bearer {{auth_token}}
```

#### Get Product by Key
```
GET {{base_url}}/api/products/key={{product_key}}
Headers: Authorization: Bearer {{auth_token}}
```

#### Create Product
```
POST {{base_url}}/api/products
Headers: 
  Authorization: Bearer {{admin_token}}
  Content-Type: application/json
  x-client-id: {{client_id}}

Body:
{
  "key": "product-001",
  "productType": {
    "typeId": "product-type",
    "id": "default"
  },
  "name": {
    "en": "Awesome T-Shirt",
    "de": "Tolles T-Shirt"
  },
  "slug": {
    "en": "awesome-t-shirt",
    "de": "tolles-t-shirt"
  },
  "description": {
    "en": "A really awesome t-shirt"
  },
  "masterVariant": {
    "sku": "SKU-001",
    "prices": [{
      "value": {
        "centAmount": 2999,
        "currencyCode": "USD"
      }
    }],
    "images": [{
      "url": "https://example.com/tshirt.jpg",
      "dimensions": { "w": 1000, "h": 1000 }
    }]
  },
  "categories": [{
    "typeId": "category",
    "id": "{{category_id}}"
  }],
  "publish": true
}
```

#### Update Product - Change Name (Staged)
```
POST {{base_url}}/api/products/{{product_id}}
Body:
{
  "version": 1,
  "actions": [{
    "action": "changeName",
    "name": {
      "en": "Super Awesome T-Shirt"
    },
    "staged": true
  }]
}
```

#### Update Product - Add Variant
```
POST {{base_url}}/api/products/{{product_id}}
Body:
{
  "version": 2,
  "actions": [{
    "action": "addVariant",
    "sku": "SKU-002",
    "prices": [{
      "value": {
        "centAmount": 3499,
        "currencyCode": "USD"
      }
    }],
    "staged": true
  }]
}
```

#### Update Product - Add to Category
```
POST {{base_url}}/api/products/{{product_id}}
Body:
{
  "version": 3,
  "actions": [{
    "action": "addToCategory",
    "category": {
      "typeId": "category",
      "id": "{{category_id}}"
    },
    "staged": true
  }]
}
```

#### Update Product - Publish
```
POST {{base_url}}/api/products/{{product_id}}
Body:
{
  "version": 4,
  "actions": [{
    "action": "publish"
  }]
}
```

#### Delete Product
```
DELETE {{base_url}}/api/products/{{product_id}}?version=5
Headers: Authorization: Bearer {{admin_token}}
```

### 📂 Categories Service

#### Query Categories
```
GET {{base_url}}/api/categories?page=1&pageSize=10
Headers: Authorization: Bearer {{auth_token}}
```

#### Get Category by ID
```
GET {{base_url}}/api/categories/{{category_id}}
Headers: Authorization: Bearer {{auth_token}}
```

#### Create Category
```
POST {{base_url}}/api/categories
Headers: 
  Authorization: Bearer {{admin_token}}
  Content-Type: application/json
  x-client-id: {{client_id}}
```

#### Delete Category
```
DELETE {{base_url}}/api/categories/{{category_id}}
Headers: Authorization: Bearer {{admin_token}}
```

## Complete Workflow Example

### 1. Authentication
```bash
# Register and login as admin (via API Gateway)
POST {{base_url}}/api/auth/register
POST {{base_url}}/api/auth/login
# Token is automatically saved to {{auth_token}} and {{admin_token}}
```

### 2. Create Category
```bash
POST {{base_url}}/api/categories
# Save category_id
```

### 3. Create Product
```bash
POST {{base_url}}/api/products
# Save product_id
```

### 4. Create Cart
```bash
POST {{base_url}}/api/carts
# Save cart_id
```

### 5. Add Product to Cart
```bash
POST {{base_url}}/api/carts/{{cart_id}}
# Action: addLineItem
```

### 6. Create Payment
```bash
POST {{base_url}}/api/payments
# Save payment_id
```

### 7. Add Authorization Transaction
```bash
POST {{base_url}}/api/payments/{{payment_id}}
# Action: addTransaction (type: Authorization)
```

### 8. Charge Payment
```bash
POST {{base_url}}/api/payments/{{payment_id}}
# Action: addTransaction (type: Charge)
```

### 9. Mark Cart as Ordered
```bash
POST {{base_url}}/api/carts/{{cart_id}}
# Action: setCartState (state: Ordered)
```

## Authentication Flow

1. **Login/Register** → Returns JWT token
2. **Token Auto-Saved** → Stored in `{{auth_token}}` environment variable
3. **All Requests** → Include `Authorization: Bearer {{auth_token}}` header
4. **API Gateway** → Validates token once, forwards user info to services
5. **Services** → Trust gateway headers, no token validation needed

## Testing Tips

1. **Always set auth_token**: Run login first and save the token
2. **Use environment variables**: Save IDs after creation for reuse
3. **Check versions**: Update actions require correct version numbers
4. **Test with different roles**: Use admin_token, manager_token, customer_token
5. **Test error cases**: Try invalid tokens, missing fields, wrong versions
6. **All requests go through gateway**: Use `{{base_url}}/api/*` endpoints

## Import Instructions

1. Import `Action-Commerce-API-Collection.postman_collection.json` into Postman
2. Import `Action-Commerce-Environment.postman_environment.json` into Postman
3. Set the environment to "Action Commerce - Local Development"
4. Ensure API Gateway is running on port 3000
5. Run authentication requests first to get tokens
6. All subsequent requests will automatically use the saved token

## Architecture Notes

- **Centralized Authentication**: API Gateway validates JWT tokens
- **Single Point of Entry**: All requests go through `http://localhost:3000/api/*`
- **Service Independence**: Microservices trust gateway headers
- **Automatic Token Handling**: Collection automatically includes Bearer token in all requests
