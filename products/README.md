# Products Microservice

Product catalog management microservice for Action Commerce platform with full Commerce Tools API compatibility.

## Features

- Create, read, update, and delete products
- Product variant management
- Price management with multi-currency support
- Image and attribute management
- Category associations
- Staged/Published product data (draft/live)
- SEO metadata (meta title, description, keywords)
- Search keywords
- Review rating statistics
- Optimistic concurrency control with versioning
- MongoDB integration
- RESTful API endpoints

## Product Model

The product object includes:
- `id`: Unique product identifier
- `version`: Version number for optimistic locking
- `key`: Optional unique key
- `productType`: Reference to product type
- `masterData`: Contains current (published) and staged (draft) product data
  - `current`: Published product data
  - `staged`: Draft product data
  - `published`: Publication status
  - `hasStagedChanges`: Indicates if staged differs from current
- `masterVariant`: Main product variant
- `variants`: Additional product variants
- `name`: Localized product name
- `slug`: Localized URL-friendly identifier
- `description`: Localized product description
- `categories`: Category references
- `prices`: Multi-currency pricing
- `images`: Product images with dimensions
- `attributes`: Custom product attributes
- `taxCategory`: Tax category reference
- `reviewRatingStatistics`: Product ratings and reviews

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env.local` file:

```
MONGO_URI=mongodb://username:password@127.0.0.1:27017
MONGO_DATABASE_NAME=ms_action_products_db
MONGO_AUTH_SOURCE=admin
PORT=6002
LOG_LEVEL=ERROR
```

## Running the Service

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

**Commerce Tools Compatible API**

### Products
- `GET /products` - Query all products (paginated)
- `GET /products/:id` - Get product by ID
- `GET /products/key=:key` - Get product by key
- `POST /products` - Create new product
- `POST /products/:id` - Update product by ID (action-based)
- `POST /products/key=:key` - Update product by key (action-based)
- `DELETE /products/:id?version={version}` - Delete product by ID
- `DELETE /products/key=:key?version={version}` - Delete product by key
- `HEAD /products` - Check products metadata
- `HEAD /products/:id` - Check product exists

**Note:** Updates use POST (not PATCH) following Commerce Tools conventions.

### Update Actions

1. **Change Name**
```json
{
  "version": 1,
  "actions": [{
    "action": "changeName",
    "name": {
      "en": "New Product Name",
      "de": "Neuer Produktname"
    },
    "staged": true
  }]
}
```

2. **Change Slug**
```json
{
  "version": 1,
  "actions": [{
    "action": "changeSlug",
    "slug": {
      "en": "new-product-slug",
      "de": "neuer-produkt-slug"
    },
    "staged": true
  }]
}
```

3. **Set Description**
```json
{
  "version": 1,
  "actions": [{
    "action": "setDescription",
    "description": {
      "en": "Product description",
      "de": "Produktbeschreibung"
    },
    "staged": true
  }]
}
```

4. **Add to Category**
```json
{
  "version": 1,
  "actions": [{
    "action": "addToCategory",
    "category": {
      "typeId": "category",
      "id": "category-123"
    },
    "staged": true
  }]
}
```

5. **Remove from Category**
```json
{
  "version": 1,
  "actions": [{
    "action": "removeFromCategory",
    "category": {
      "typeId": "category",
      "id": "category-123"
    },
    "staged": true
  }]
}
```

6. **Add Variant**
```json
{
  "version": 1,
  "actions": [{
    "action": "addVariant",
    "sku": "SKU-123",
    "prices": [{
      "value": {
        "centAmount": 9999,
        "currencyCode": "USD"
      }
    }],
    "images": [{
      "url": "https://example.com/image.jpg",
      "dimensions": { "w": 800, "h": 600 }
    }],
    "staged": true
  }]
}
```

7. **Remove Variant**
```json
{
  "version": 1,
  "actions": [{
    "action": "removeVariant",
    "id": 2,
    "staged": true
  }]
}
```

8. **Add Price**
```json
{
  "version": 1,
  "actions": [{
    "action": "addPrice",
    "variantId": 1,
    "price": {
      "value": {
        "centAmount": 12999,
        "currencyCode": "EUR"
      },
      "country": "DE"
    },
    "staged": true
  }]
}
```

9. **Remove Price**
```json
{
  "version": 1,
  "actions": [{
    "action": "removePrice",
    "priceId": "price-id-123",
    "staged": true
  }]
}
```

10. **Publish** (Make staged changes live)
```json
{
  "version": 1,
  "actions": [{
    "action": "publish"
  }]
}
```

11. **Unpublish**
```json
{
  "version": 1,
  "actions": [{
    "action": "unpublish"
  }]
}
```

12. **Revert Staged Changes**
```json
{
  "version": 1,
  "actions": [{
    "action": "revertStagedChanges"
  }]
}
```

## Staged vs Current Data

Products support a draft/live workflow:
- **Staged**: Draft changes that aren't visible to customers
- **Current**: Published data visible to customers
- Most update actions accept a `staged` parameter (default: true)
- Use `publish` action to make staged changes live
- Use `revertStagedChanges` to discard draft changes

## Authentication

All endpoints require authentication via Bearer token:
```
Authorization: Bearer <token>
```

Role-based access:
- `admin`: Full access
- `manager`: Create, read, update
- `user`: Read only

## Port

Default port: `6002`

## Example Usage

### Create Product
```bash
POST /products
Authorization: Bearer <token>
x-client-id: my-client
Content-Type: application/json

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
    "id": "clothing-123"
  }],
  "publish": true
}
```

### Update Product Name (Staged)
```bash
POST /products/{id}
Authorization: Bearer <token>
Content-Type: application/json

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

### Publish Changes
```bash
POST /products/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "version": 2,
  "actions": [{
    "action": "publish"
  }]
}
```
