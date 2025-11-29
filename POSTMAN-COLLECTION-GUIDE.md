# Action Commerce - Postman Collection Guide

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

## New Endpoints Added

### 💳 Payments Service (Port 6005)

#### Query Payments
```
GET {{payments_url}}/payments?page=1&pageSize=10
Headers: Authorization: Bearer {{auth_token}}
```

#### Get Payment by ID
```
GET {{payments_url}}/payments/{{payment_id}}
Headers: Authorization: Bearer {{auth_token}}
```

#### Get Payment by Key
```
GET {{payments_url}}/payments/key={{payment_key}}
Headers: Authorization: Bearer {{auth_token}}
```

#### Create Payment
```
POST {{payments_url}}/payments
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
POST {{payments_url}}/payments/{{payment_id}}
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
POST {{payments_url}}/payments/{{payment_id}}
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
DELETE {{payments_url}}/payments/{{payment_id}}?version=1
Headers: Authorization: Bearer {{admin_token}}
```

### 🛒 Carts Service (Port 6004)

#### Query Carts
```
GET {{carts_url}}/carts?page=1&pageSize=10
Headers: Authorization: Bearer {{auth_token}}
```

#### Get Cart by ID
```
GET {{carts_url}}/carts/{{cart_id}}
Headers: Authorization: Bearer {{auth_token}}
```

#### Get Cart by Key
```
GET {{carts_url}}/carts/key={{cart_key}}
Headers: Authorization: Bearer {{auth_token}}
```

#### Get Cart by Customer ID
```
GET {{carts_url}}/carts/customer-id={{customer_id}}
Headers: Authorization: Bearer {{auth_token}}
```

#### Create Cart
```
POST {{carts_url}}/carts
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
POST {{carts_url}}/carts/{{cart_id}}
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
POST {{carts_url}}/carts/{{cart_id}}
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
POST {{carts_url}}/carts/{{cart_id}}
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
POST {{carts_url}}/carts/{{cart_id}}
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
DELETE {{carts_url}}/carts/{{cart_id}}?version=1
Headers: Authorization: Bearer {{admin_token}}
```

### 🛍️ Products Service (Port 6002)

#### Query Products
```
GET {{products_url}}/products?page=1&pageSize=10
Headers: Authorization: Bearer {{auth_token}}
```

#### Get Product by ID
```
GET {{products_url}}/products/{{product_id}}
Headers: Authorization: Bearer {{auth_token}}
```

#### Get Product by Key
```
GET {{products_url}}/products/key={{product_key}}
Headers: Authorization: Bearer {{auth_token}}
```

#### Create Product
```
POST {{products_url}}/products
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
POST {{products_url}}/products/{{product_id}}
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
POST {{products_url}}/products/{{product_id}}
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
POST {{products_url}}/products/{{product_id}}
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
POST {{products_url}}/products/{{product_id}}
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
DELETE {{products_url}}/products/{{product_id}}?version=5
Headers: Authorization: Bearer {{admin_token}}
```

## Complete Workflow Example

### 1. Authentication
```bash
# Register and login as admin
POST {{user_management_url}}/auth/register
POST {{user_management_url}}/auth/login
# Save token to {{admin_token}}
```

### 2. Create Category
```bash
POST {{categories_url}}/categories
# Save category_id
```

### 3. Create Product
```bash
POST {{products_url}}/products
# Save product_id
```

### 4. Create Cart
```bash
POST {{carts_url}}/carts
# Save cart_id
```

### 5. Add Product to Cart
```bash
POST {{carts_url}}/carts/{{cart_id}}
# Action: addLineItem
```

### 6. Create Payment
```bash
POST {{payments_url}}/payments
# Save payment_id
```

### 7. Add Authorization Transaction
```bash
POST {{payments_url}}/payments/{{payment_id}}
# Action: addTransaction (type: Authorization)
```

### 8. Charge Payment
```bash
POST {{payments_url}}/payments/{{payment_id}}
# Action: addTransaction (type: Charge)
```

### 9. Mark Cart as Ordered
```bash
POST {{carts_url}}/carts/{{cart_id}}
# Action: setCartState (state: Ordered)
```

## Testing Tips

1. **Always set auth_token**: Run login first and save the token
2. **Use environment variables**: Save IDs after creation for reuse
3. **Check versions**: Update actions require correct version numbers
4. **Test with different roles**: Use admin_token, manager_token, customer_token
5. **Test error cases**: Try invalid tokens, missing fields, wrong versions

## Import Instructions

1. Import `Action-Commerce-Environment.postman_environment.json` into Postman
2. Create requests manually using the examples above
3. Or use Postman's "Import" > "Raw text" and paste request examples
4. Set the environment to "Action Commerce - Local Development"
5. Run authentication requests first to get tokens
6. Use saved environment variables in subsequent requests
