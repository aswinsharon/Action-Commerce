# Running Services Guide

This guide explains different ways to start and manage the Action Commerce microservices.

## Prerequisites

Before running the services, ensure you have:

1. **Node.js** (v16 or higher) installed
2. **npm** or **yarn** installed
3. **MongoDB** running (for Products, Categories, Cart)
4. **PostgreSQL** running (for User Management)
5. Dependencies installed for all services

## Installation

Install dependencies for all services:

```bash
# From root directory
cd user-management && npm install && cd ..
cd products && npm install && cd ..
cd categories && npm install && cd ..
cd cart && npm install && cd ..
cd api-gateway && npm install && cd ..
cd load-balancer && npm install && cd ..
```

## Method 1: Automated Scripts (Recommended)

We provide several bash scripts to start all services automatically.

### Option A: Start in New Terminal Windows

Best for: macOS and Linux with GUI

```bash
chmod +x start-all-services.sh
./start-all-services.sh
```

This script will:
- Check prerequisites (Node.js, npm, ports)
- Verify all service directories exist
- Check if dependencies are installed
- Open each service in a new terminal window/tab
- Start all services automatically

**Features**:
- ✅ Automatic port checking
- ✅ Dependency verification
- ✅ Opens separate terminals for each service
- ✅ Works on macOS, Linux (GNOME, KDE, xterm)

### Option B: Start in tmux Session

Best for: Developers who use tmux, remote servers

```bash
chmod +x start-all-services-tmux.sh
./start-all-services-tmux.sh
```

This creates a tmux session with 6 windows:
- Window 0: User Management
- Window 1: Products
- Window 2: Categories
- Window 3: Cart
- Window 4: API Gateway
- Window 5: Monitor & Commands

**tmux Commands**:
- Switch windows: `Ctrl+b` then `0-5`
- Detach session: `Ctrl+b` then `d`
- Reattach: `tmux attach -t action-commerce`
- Kill session: `tmux kill-session -t action-commerce`

### Option C: Start in Background

Best for: Running services in background, CI/CD

```bash
chmod +x start-all-services-simple.sh
./start-all-services-simple.sh
```

This script:
- Starts all services in background
- Logs output to `logs/` directory
- Saves PIDs to `logs/pids/` directory

**View logs**:
```bash
# View all logs
tail -f logs/*.log

# View specific service
tail -f logs/user-management.log
tail -f logs/api-gateway.log
```

### Stop All Services

```bash
chmod +x stop-all-services.sh
./stop-all-services.sh
```

This will stop all running services on ports 3000, 6001-6004, and 8000.

## Method 2: Manual Start (Individual Services)

Start each service manually in separate terminal windows.

### Terminal 1: User Management Service

```bash
cd user-management
npm start
```

Expected output:
```
User Management Service is running on port 6001
PostgreSQL connected successfully!
```

### Terminal 2: Products Service

```bash
cd products
npm start
```

Expected output:
```
Products Service is running on port 6002
MongoDB connected successfully!
```

### Terminal 3: Categories Service

```bash
cd categories
npm start
```

Expected output:
```
Server is running on port 6003
MongoDB connected successfully!
```

### Terminal 4: Cart Service

```bash
cd cart
npm start
```

Expected output:
```
Cart Service is running on port 6004
MongoDB connected successfully!
```

### Terminal 5: API Gateway

```bash
cd api-gateway
npm start
```

Expected output:
```
🚀 API Gateway running on port 3000
📍 Gateway URL: http://localhost:3000
🏥 Health check: http://localhost:3000/health

📦 Available services:
   - auth         -> http://localhost:6001
   - users        -> http://localhost:6001
   - products     -> http://localhost:6002
   - categories   -> http://localhost:6003
   - carts        -> http://localhost:6004
```

### Terminal 6: Load Balancer (Optional)

```bash
cd load-balancer
npm start
```

Expected output:
```
🚀 API Gateway Load Balancer with Failover listening on http://localhost:8000
```

## Method 3: Using Process Managers

### Using PM2

PM2 is a production process manager for Node.js applications.

**Install PM2**:
```bash
npm install -g pm2
```

**Create ecosystem file** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [
    {
      name: 'user-management',
      cwd: './user-management',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'products',
      cwd: './products',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'categories',
      cwd: './categories',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'cart',
      cwd: './cart',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'api-gateway',
      cwd: './api-gateway',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
```

**Start all services**:
```bash
pm2 start ecosystem.config.js
```

**Useful PM2 commands**:
```bash
# View status
pm2 status

# View logs
pm2 logs

# View specific service logs
pm2 logs user-management

# Restart all
pm2 restart all

# Stop all
pm2 stop all

# Delete all
pm2 delete all

# Monitor
pm2 monit
```

### Using Docker Compose

Create `docker-compose.yml` in root:

```yaml
version: '3.8'

services:
  user-management:
    build: ./user-management
    ports:
      - "6001:6001"
    environment:
      - NODE_ENV=development
    depends_on:
      - postgres

  products:
    build: ./products
    ports:
      - "6002:6002"
    environment:
      - NODE_ENV=development
    depends_on:
      - mongodb

  categories:
    build: ./categories
    ports:
      - "6003:6003"
    environment:
      - NODE_ENV=development
    depends_on:
      - mongodb

  cart:
    build: ./cart
    ports:
      - "6004:6004"
    environment:
      - NODE_ENV=development
    depends_on:
      - mongodb

  api-gateway:
    build: ./api-gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    depends_on:
      - user-management
      - products
      - categories
      - cart

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  postgres:
    image: postgres:latest
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=your_password
      - POSTGRES_DB=ms_action_users_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  mongodb_data:
  postgres_data:
```

**Start with Docker Compose**:
```bash
docker-compose up -d
```

## Verification

### Check API Gateway Health

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

### Check All Services Health

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

### Check Individual Services

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

## Troubleshooting

### Port Already in Use

**Error**: `EADDRINUSE: address already in use`

**Solution**:
```bash
# Find process using port
lsof -i :6001

# Kill process
kill -9 <PID>

# Or use the stop script
./stop-all-services.sh
```

### Service Won't Start

**Check logs**:
```bash
# If using background mode
tail -f logs/user-management.log

# If using PM2
pm2 logs user-management
```

**Common issues**:
1. Dependencies not installed: `cd <service> && npm install`
2. Database not running: Start MongoDB/PostgreSQL
3. Environment variables missing: Check `.env` files
4. Port conflicts: Stop other services using the port

### Database Connection Failed

**MongoDB**:
```bash
# Check if running
mongosh

# Start MongoDB
mongod

# Or with Docker
docker run -d -p 27017:27017 mongo:latest
```

**PostgreSQL**:
```bash
# Check if running
psql -U postgres

# Start PostgreSQL (macOS)
brew services start postgresql

# Or with Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:latest
```

### Service Crashes on Startup

1. Check logs for error messages
2. Verify environment variables in `.env` files
3. Ensure databases are accessible
4. Check Node.js version compatibility
5. Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Development Mode

For development with hot reload:

```bash
# User Management
cd user-management && npm run dev

# Products
cd products && npm run dev

# Categories
cd categories && npm run dev

# Cart
cd cart && npm run dev

# API Gateway
cd api-gateway && npm run dev
```

## Production Deployment

For production, consider:

1. **Use PM2 with cluster mode**:
   ```bash
   pm2 start ecosystem.config.js --env production
   ```

2. **Use Docker containers**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Use Kubernetes** for orchestration

4. **Enable monitoring** (Prometheus, Grafana)

5. **Set up logging** (ELK stack, CloudWatch)

6. **Configure load balancing** (NGINX, AWS ALB)

7. **Enable HTTPS/SSL**

8. **Set production environment variables**

## Summary

| Method | Best For | Pros | Cons |
|--------|----------|------|------|
| Automated Script | Quick start, development | Easy, automatic | Requires GUI terminal |
| tmux | Remote servers, power users | Single session, organized | Requires tmux knowledge |
| Background | CI/CD, headless | Simple, logs to files | No interactive console |
| Manual | Learning, debugging | Full control | Tedious, error-prone |
| PM2 | Production, monitoring | Process management, logs | Additional dependency |
| Docker | Consistency, deployment | Isolated, reproducible | Requires Docker setup |

## Next Steps

1. Verify all services are running
2. Test the API endpoints (see [ENDPOINT-REFERENCE.md](./ENDPOINT-REFERENCE.md))
3. Import Postman collection for testing
4. Build your frontend application
5. Set up monitoring and logging

## Support

For issues:
- Check service logs
- Verify environment configuration
- Review [QUICK-START-GUIDE.md](./QUICK-START-GUIDE.md)
- Check [API-GATEWAY-ARCHITECTURE.md](./API-GATEWAY-ARCHITECTURE.md)
