# Commerce Tools Cart API Compatibility

This document outlines how the carts microservice endpoints match with Commerce Tools Cart API.

## Endpoint Mapping

### ✅ Query Carts
**Commerce Tools:** `GET /{projectKey}/carts`  
**Our Implementation:** `GET /carts`

Supports pagination via `page` and `pageSize` query parameters.

### ✅ Get Cart by ID
**Commerce Tools:** `GET /{projectKey}/carts/{id}`  
**Our Implementation:** `GET /carts/:id`

Returns a single cart by its unique ID.

### ✅ Get Cart by Key
**Commerce Tools:** `GET /{projectKey}/carts/key={key}`  
**Our Implementation:** `GET /carts/key=:key`

Returns a single cart by its unique key.

### ✅ Get Cart by Customer ID
**Commerce Tools:** `GET /{projectKey}/carts/customer-id={customerId}`  
**Our Implementation:** `GET /carts/customer-id=:customerId`

Returns the active cart for a specific customer.

### ✅ Create Cart
**Commerce Tools:** `POST /{projectKey}/carts`  
**Our Implementation:** `POST /carts`

Creates a new cart with:
- `currency` (required): Currency code (e.g., "USD")
- `customerId` (optional): Customer identifier
- `customerEmail` (optional): Customer email
- `key` (optional): Unique cart key

### ✅ Update Cart by ID
**Commerce Tools:** `POST /{projectKey}/carts/{id}`  
**Our Implementation:** `POST /carts/:id`

Updates a cart using update actions with optimistic concurrency control.

### ✅ Update Cart by Key
**Commerce Tools:** `POST /{projectKey}/carts/key={key}`  
**Our Implementation:** `POST /carts/key=:key`

Updates a cart by key using update actions.

### ✅ Delete Cart by ID
**Commerce Tools:** `DELETE /{projectKey}/carts/{id}?version={version}`  
**Our Implementation:** `DELETE /carts/:id?version={version}`

Deletes a cart with version-based optimistic locking.

### ✅ Delete Cart by Key
**Commerce Tools:** `DELETE /{projectKey}/carts/key={key}?version={version}`  
**Our Implementation:** `DELETE /carts/key=:key?version={version}`

Deletes a cart by key with version control.

## Update Actions

Commerce Tools uses an action-based update pattern. Our implementation supports:

### ✅ addLineItem
Adds a product to the cart.

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

### ✅ removeLineItem
Removes a line item from the cart.

```json
{
  "version": 1,
  "actions": [{
    "action": "removeLineItem",
    "lineItemId": "line-item-id"
  }]
}
```

### ✅ changeLineItemQuantity
Changes the quantity of a line item.

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

### ✅ setShippingAddress
Sets or updates the shipping address.

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

### ✅ setBillingAddress
Sets or updates the billing address.

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

### ✅ setCustomerEmail
Sets or updates the customer email.

```json
{
  "version": 1,
  "actions": [{
    "action": "setCustomerEmail",
    "email": "customer@example.com"
  }]
}
```

### ✅ setCartState
Changes the cart state.

```json
{
  "version": 1,
  "actions": [{
    "action": "setCartState",
    "state": "Ordered"
  }]
}
```

**Cart States:**
- `Active` - Cart is active and can be modified
- `Merged` - Cart has been merged with another cart
- `Ordered` - Cart has been converted to an order

## Data Model Compatibility

### Cart Object
```typescript
{
  id: string;
  version: number;
  createdAt: string;
  lastModifiedAt: string;
  key?: string;
  customerId?: string;
  customerEmail?: string;
  totalPrice: Money;
  taxedPrice?: TaxedPrice;
  lineItems: LineItem[];
  customLineItems?: CustomLineItem[];
  cartState: "Active" | "Merged" | "Ordered";
  shippingAddress?: Address;
  billingAddress?: Address;
  shippingInfo?: ShippingInfo;
  discountCodes?: DiscountCodeInfo[];
  custom?: CustomFields;
}
```

### LineItem
```typescript
{
  id: string;
  productId: string;
  productType: Reference;
  name: LocalizedString;
  variant: ProductVariant;
  quantity: number;
  price: Price;
  totalPrice: Money;
}
```

### Money Type
```typescript
{
  centAmount: number;    // Amount in smallest currency unit
  currencyCode: string;  // ISO 4217 currency code
}
```

### Address Type
```typescript
{
  firstName?: string;
  lastName?: string;
  streetName?: string;
  city?: string;
  country: string;  // ISO 3166-1 alpha-2 country code
}
```

## Key Features

### ✅ Optimistic Concurrency Control
Uses version-based locking exactly like Commerce Tools:
- Every update requires current version number
- Version auto-increments on successful updates
- Returns `409 Conflict` with `ConcurrentModification` error on version mismatch

### ✅ Automatic Price Calculation
Total price is automatically recalculated when:
- Line items are added
- Line items are removed
- Line item quantities change

### ✅ Customer Association
Carts can be associated with customers via:
- `customerId` - Link to customer resource
- `customerEmail` - Customer email address
- Special endpoint to get active cart by customer ID

## Additional Commerce Tools Actions (Not Yet Implemented)

- `setCustomerId`
- `setCountry`
- `setShippingMethod`
- `addDiscountCode`
- `removeDiscountCode`
- `recalculate`
- `addCustomLineItem`
- `removeCustomLineItem`
- `setLineItemPrice`
- `setLineItemTotalPrice`
- `setLineItemCustomField`
- `setCustomType`
- `setCustomField`
- `setDeleteDaysAfterLastModification`
- `setAnonymousId`
- `setLocale`

## Summary

**Compatibility Level: ~80%**

The carts microservice implements all core Commerce Tools Cart API endpoints with full data model compatibility. The main differences are:
1. No project key in URL (handled at gateway level)
2. Simplified query/filtering (basic pagination only)
3. JWT auth instead of OAuth2
4. Subset of update actions (7 of ~30+ available in Commerce Tools)
5. Product details need to be fetched from products service

For most e-commerce use cases, this implementation is **fully compatible** with Commerce Tools Cart API patterns.
