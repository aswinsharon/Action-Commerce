# Redis Caching Implementation Guide

This document provides a comprehensive guide for the Redis caching implementation across all microservices in the Action-Commerce platform.

## Overview

Redis caching has been implemented across all microservices to improve performance, reduce database load, and provide faster response times. Each service includes:

- **Redis Configuration**: Connection management with retry logic
- **Cache Service**: Standardized caching operations (get, set, delete, pattern matching)
- **Cache Middleware**: Automatic caching for GET requests and cache invalidation
- **Service-Specific Cache Keys**: Optimized key generation for each service's data patterns

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │   User Mgmt     │    │   Products      │
│   (Port 3000)   │    │   (Port 6001)   │    │   (Port 6002)   │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Redis Cache  │ │    │ │Redis Cache  │ │    │ │Redis Cache  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────────────┐
                    │     Redis Server        │
                    │   (localhost:6379)      │
                    └─────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Categories    │    │     Carts       │    │   Payments      │
│   (Port 6003)   │    │   (Port 6004)   │    │   (Port 6005)   │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Redis Cache  │ │    │ │Redis Cache  │ │    │ │Redis Cache  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### 1. Install Redis Server

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Windows:**
- Download Redis from: https://github.com/microsoftarchive/redis/releases
- Or use Docker: `docker run -d -p 6379:6379 redis:alpine`

**Docker (Recommended for Development):**
```bash
docker run -d --name redis-cache -p 6379:6379 redis:alpine
```

### 2. Verify Redis Installation

```bash
redis-cli ping
# Should return: PONG
```

## Configuration

### Environment Variables

Each service requires the following Redis environment variables:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600  # Default TTL in seconds (1 hour)
```

### Service-Specific Configuration

Copy the `.env.example` files to `.env.local` for each service:

```bash
# For each service directory
cp .env.example .env.local
```

Update the Redis URL if using a different host/port:
```bash
# For remote Redis instance
REDIS_URL=redis://your-redis-host:6379

# For Redis with authentication
REDIS_URL=redis://username:password@host:port

# For Redis Cluster
REDIS_URL=redis://host1:port1,host2:port2,host3:port3
```

## Service-Specific Caching Strategies

### 1. API Gateway (Port 3000)
- **Service Health Status**: Cache health check results
- **Route Responses**: Cache frequently accessed routes
- **User Sessions**: Cache user session data

**Key Patterns:**
```javascript
service_health:user-management
route:GET:/api/products:eyJwYWdlIjoxfQ==
user_session:user123
```

### 2. User Management (Port 6001)
- **User Profiles**: Cache user data and profiles
- **JWT Blacklist**: Cache invalidated tokens
- **User Lists**: Cache paginated user lists

**Key Patterns:**
```typescript
user:user123
user_profile:user123
session:session456
users:list:1:10:eyJyb2xlIjoiYWRtaW4ifQ==
jwt_blacklist:jti789
```

### 3. Products (Port 6002)
- **Product Data**: Cache individual product details
- **Product Lists**: Cache paginated product lists with filters
- **Search Results**: Cache search query results

**Key Patterns:**
```typescript
product:prod123
products:list:1:10:eyJjYXRlZ29yeSI6ImVsZWN0cm9uaWNzIn0=
products:search:aXBob25l:1:10
```

### 4. Categories (Port 6003)
- **Category Data**: Cache category details
- **Category Tree**: Cache hierarchical category structure
- **Category Lists**: Cache paginated category lists

**Key Patterns:**
```typescript
category:cat123
categories:tree
categories:list:1:10:eyJwYXJlbnQiOiJyb290In0=
```

### 5. Carts (Port 6004)
- **Cart Data**: Cache user cart contents
- **Cart Lists**: Cache user's cart history
- **Cart Items**: Cache individual cart items

**Key Patterns:**
```typescript
cart:user123
carts:list:user123:1:10
cart_item:item456
```

### 6. Payments (Port 6005)
- **Payment Methods**: Cache user payment methods
- **Transaction Data**: Cache transaction details
- **Payment History**: Cache user payment history

**Key Patterns:**
```typescript
payment:payment123
payment_methods:user123
transaction:txn456
payment_history:user123:1:10
```

## Usage Examples

### Basic Caching in Controllers

```typescript
import { cacheService } from '../common/services/cache.service';

export class ProductController {
    async getProduct(req: Request, res: Response) {
        const productId = req.params.id;
        const cacheKey = cacheService.generateProductKey(productId);
        
        // Try to get from cache first
        const cachedProduct = await cacheService.get(cacheKey);
        if (cachedProduct) {
            return res.json(cachedProduct);
        }
        
        // Get from database
        const product = await ProductService.findById(productId);
        
        // Cache the result (TTL: 1 hour)
        await cacheService.set(cacheKey, product, 3600);
        
        res.json(product);
    }
    
    async updateProduct(req: Request, res: Response) {
        const productId = req.params.id;
        
        // Update in database
        const updatedProduct = await ProductService.update(productId, req.body);
        
        // Invalidate related cache
        await cacheService.del(cacheService.generateProductKey(productId));
        await cacheService.delPattern('products:list:*');
        await cacheService.delPattern('products:search:*');
        
        res.json(updatedProduct);
    }
}
```

### Using Cache Middleware

```typescript
import { cacheMiddleware, invalidateCacheMiddleware } from '../common/middlewares/cache.middleware';

// Cache GET requests for 30 minutes
router.get('/products', 
    cacheMiddleware({ 
        ttl: 1800,
        keyGenerator: (req) => `products:${JSON.stringify(req.query)}`
    }), 
    ProductController.getProducts
);

// Invalidate cache on updates
router.post('/products', 
    invalidateCacheMiddleware(['products:*']),
    ProductController.createProduct
);
```

## Cache Invalidation Strategies

### 1. Time-Based Expiration (TTL)
- Default: 1 hour (3600 seconds)
- Configurable via `CACHE_TTL` environment variable
- Automatic cleanup of expired keys

### 2. Event-Based Invalidation
- Invalidate on CREATE, UPDATE, DELETE operations
- Pattern-based invalidation for related data
- Cascade invalidation for dependent data

### 3. Manual Invalidation
- Admin endpoints for cache management
- Health check endpoints with cache clearing
- Service restart clears all cache

## Monitoring and Health Checks

### Cache Health Endpoints

Each service provides cache health endpoints:

```bash
# Check cache status
GET /health/cache

# Clear cache (admin only)
DELETE /health/cache

# Get cache statistics
GET /health/cache/stats
```

### Monitoring Cache Performance

```typescript
// Get cache statistics
const stats = await cacheService.getStats();
console.log('Cache Stats:', stats);

// Monitor cache hit/miss ratio
const cacheKey = 'some:key';
const startTime = Date.now();
const result = await cacheService.get(cacheKey);
const duration = Date.now() - startTime;

if (result) {
    console.log(`Cache HIT: ${cacheKey} (${duration}ms)`);
} else {
    console.log(`Cache MISS: ${cacheKey} (${duration}ms)`);
}
```

## Performance Optimization

### 1. Key Design Best Practices
- Use consistent naming conventions
- Include version numbers for schema changes
- Use hierarchical keys for easy pattern matching
- Keep keys short but descriptive

### 2. TTL Strategy
- Short TTL for frequently changing data (5-15 minutes)
- Medium TTL for semi-static data (1-6 hours)
- Long TTL for static data (24+ hours)

### 3. Memory Management
- Monitor Redis memory usage
- Use appropriate data structures
- Implement cache size limits
- Regular cleanup of unused keys

### 4. Connection Pooling
- Reuse Redis connections
- Configure connection timeouts
- Handle connection failures gracefully

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   ```bash
   # Check if Redis is running
   redis-cli ping
   
   # Check Redis logs
   redis-cli monitor
   ```

2. **High Memory Usage**
   ```bash
   # Check memory usage
   redis-cli info memory
   
   # Find large keys
   redis-cli --bigkeys
   ```

3. **Cache Miss Issues**
   ```bash
   # Check if keys exist
   redis-cli keys "pattern:*"
   
   # Check TTL
   redis-cli ttl "key:name"
   ```

4. **Performance Issues**
   ```bash
   # Monitor slow queries
   redis-cli slowlog get 10
   
   # Check connection stats
   redis-cli info clients
   ```

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will log all cache operations for debugging purposes.

## Production Considerations

### 1. Redis Configuration
- Enable persistence (RDB + AOF)
- Configure memory limits
- Set up monitoring and alerting
- Use Redis Sentinel for high availability

### 2. Security
- Enable authentication
- Use TLS for connections
- Restrict network access
- Regular security updates

### 3. Scaling
- Consider Redis Cluster for large datasets
- Implement read replicas
- Use connection pooling
- Monitor performance metrics

### 4. Backup and Recovery
- Regular Redis backups
- Test restore procedures
- Monitor backup integrity
- Document recovery processes

## Migration Guide

If you're adding Redis to an existing deployment:

1. **Install Redis** on your infrastructure
2. **Update environment variables** in all services
3. **Deploy services** with Redis support
4. **Monitor performance** and adjust TTL values
5. **Gradually increase** cache usage based on performance metrics

The implementation is designed to be **fault-tolerant** - if Redis is unavailable, services will continue to work without caching, just with reduced performance.