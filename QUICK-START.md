# Action Commerce - Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Prerequisites
- Node.js (v18+)
- MongoDB running on localhost:27017
- npm or yarn

### Step 1: Install Dependencies (2 minutes)

```bash
# Install all services at once
npm install

# Or install each service individually
cd payments && npm install && cd ..
cd carts && npm install && cd ..
cd products && npm install && cd ..
cd categories && npm install && cd ..
cd user-management && npm install && cd ..
```

### Step 2: Configure Environment (1 minute)

Each service has a `.env.local` file already configured. Verify MongoDB connection:

```bash
# Check MongoDB is running
mongosh --eval "db.version()"

# If using different credentials, update .env.local in each service folder
# Default: mongodb://aswin:987654321@127.0.0.1:27017
```

### Step 3: Start All Services (1 minute)

```bash
# Option 1: Simple startup (recommended for first time)
./start-all-services-simple.sh

# Option 2: With tmux (for advanced users)
./start-all-services-tmux.sh

# Option 3: Start services individually
cd user-management && npm run dev &
cd products && npm run dev &
cd categories && npm run dev &
cd carts && npm run dev &
cd payments && npm run dev &
```

### Step 4: Verify Services (30 seconds)

```bash
# Check all services are running
curl http://localhost:6001/users/test  # User Management
curl http://localhost:6002/products    # Products (needs auth)
curl http://localhost:6003/categories  # Categories (needs auth)
curl http://localhost:6004/carts       # Carts (needs auth)
curl http://localhost:6005/payments    # Payments (needs auth)
```

### Step 5: Test with Postman (30 seconds)

1. Import `Action-Commerce-Environment.postman_environment.json` into Postman
2. Create a new request or follow `POSTMAN-COLLECTION-GUIDE.md`
3. Start with authentication:

```
POST http://localhost:6001/auth/register
Body:
{
  "email": "admin@test.com",
  "password": "admin123456",
  "firstName": "Admin",
  "lastName": "User",
  "role": "admin"
}
```

4. Save the token from response to `{{auth_token}}`
5. Test other endpoints!

## 📋 Service Status Check

| Service | Port | Status Check |
|---------|------|--------------|
| User Management | 6001 | `curl http://localhost:6001/users/test` |
| Products | 6002 | `curl -H "Authorization: Bearer TOKEN" http://localhost:6002/products` |
| Categories | 6003 | `curl -H "Authorization: Bearer TOKEN" http://localhost:6003/categories` |
| Carts | 6004 | `curl -H "Authorization: Bearer TOKEN" http://localhost:6004/carts` |
| Payments | 6005 | `curl -H "Authorization: Bearer TOKEN" http://localhost:6005/payments` |

## 🎯 Quick Test Workflow

### 1. Register & Login
```bash
# Register admin user
curl -X POST http://localhost:6001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123456",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'

# Login and get token
curl -X POST http://localhost:6001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123456"
  }'

# Save the token as TOKEN variable
TOKEN="your-token-here"
```

### 2. Create Category
```bash
curl -X POST http://localhost:6003/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-client-id: test-client" \
  -d '{
    "name": {
      "en": "Electronics"
    },
    "slug": {
      "en": "electronics"
    }
  }'

# Save category ID as CATEGORY_ID
```

### 3. Create Product
```bash
curl -X POST http://localhost:6002/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-client-id: test-client" \
  -d '{
    "key": "product-001",
    "productType": {
      "typeId": "product-type",
      "id": "default"
    },
    "name": {
      "en": "Wireless Headphones"
    },
    "slug": {
      "en": "wireless-headphones"
    },
    "masterVariant": {
      "sku": "WH-001",
      "prices": [{
        "value": {
          "centAmount": 9999,
          "currencyCode": "USD"
        }
      }]
    },
    "publish": true
  }'

# Save product ID as PRODUCT_ID
```

### 4. Create Cart
```bash
curl -X POST http://localhost:6004/carts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-client-id: test-client" \
  -d '{
    "currency": "USD",
    "customerEmail": "customer@test.com"
  }'

# Save cart ID as CART_ID
```

### 5. Add Product to Cart
```bash
curl -X POST http://localhost:6004/carts/$CART_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": 1,
    "actions": [{
      "action": "addLineItem",
      "productId": "'$PRODUCT_ID'",
      "variantId": 1,
      "quantity": 2
    }]
  }'
```

### 6. Create Payment
```bash
curl -X POST http://localhost:6005/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-client-id: test-client" \
  -d '{
    "amountPlanned": {
      "centAmount": 19998,
      "currencyCode": "USD"
    },
    "paymentMethodInfo": {
      "paymentInterface": "Stripe",
      "method": "CreditCard"
    }
  }'
```

## 🛠️ Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection
mongosh
```

### Port Already in Use
```bash
# Find process using port
lsof -i :6001

# Kill process
kill -9 <PID>
```

### Service Won't Start
```bash
# Check logs
cd <service-folder>
cat src/logs/*.log

# Rebuild
npm run build

# Try starting again
npm run dev
```

### Permission Issues with npm
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

## 📚 Next Steps

1. ✅ **Read Documentation**
   - Check `MICROSERVICES-SUMMARY.md` for overview
   - Review service-specific README files
   - Read `POSTMAN-COLLECTION-GUIDE.md` for API testing

2. ✅ **Explore APIs**
   - Test all CRUD operations
   - Try update actions
   - Test error scenarios

3. ✅ **Customize**
   - Add more update actions
   - Implement additional features
   - Integrate with frontend

4. ✅ **Deploy**
   - Set up production MongoDB
   - Configure environment variables
   - Deploy to cloud platform

## 🎉 You're Ready!

Your Action Commerce microservices platform is now running with:
- ✅ User Management (Authentication)
- ✅ Products (Catalog)
- ✅ Categories (Organization)
- ✅ Carts (Shopping)
- ✅ Payments (Transactions)

All services are Commerce Tools compatible and production-ready!

## 📞 Need Help?

- Check service logs in `<service>/src/logs/`
- Review API documentation
- Test with Postman collection
- Check MongoDB connection
- Verify environment variables

Happy coding! 🚀
