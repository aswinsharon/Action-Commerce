# Scripts Usage Guide

This document explains how to use the provided bash scripts to manage the Action Commerce microservices.

## Available Scripts

| Script | Purpose | Best For |
|--------|---------|----------|
| `start-all-services.sh` | Start services in new terminal windows | macOS/Linux with GUI |
| `start-all-services-tmux.sh` | Start services in tmux session | Remote servers, tmux users |
| `start-all-services-simple.sh` | Start services in background | CI/CD, headless servers |
| `stop-all-services.sh` | Stop all running services | Cleanup, restart |

## Prerequisites

Before using the scripts, ensure:

1. **Bash shell** is available (default on macOS/Linux)
2. **Execute permissions** are set on scripts
3. **Dependencies** are installed for all services
4. **Databases** (MongoDB, PostgreSQL) are running

## Setting Execute Permissions

Before first use, make scripts executable:

```bash
chmod +x start-all-services.sh
chmod +x start-all-services-tmux.sh
chmod +x start-all-services-simple.sh
chmod +x stop-all-services.sh
```

## Script 1: start-all-services.sh

### Description

Starts all microservices in separate terminal windows/tabs. This is the most user-friendly option for local development.

### Usage

```bash
./start-all-services.sh
```

### What It Does

1. ✅ Checks if Node.js and npm are installed
2. ✅ Verifies all service directories exist
3. ✅ Checks if dependencies are installed
4. ✅ Detects if ports are already in use
5. ✅ Opens a new terminal window/tab for each service
6. ✅ Starts each service with `npm start`

### Supported Terminals

- **macOS**: Terminal.app (default)
- **Linux**: GNOME Terminal, Konsole, xterm
- **Fallback**: Runs in background if terminal not detected

### Example Output

```
╔════════════════════════════════════════════════════════════╗
║     Action Commerce - Microservices Startup Script        ║
╚════════════════════════════════════════════════════════════╝

Checking prerequisites...
✓ Node.js v18.17.0
✓ npm 9.6.7

Checking ports...

Checking services...
✓ user-management
✓ products
✓ categories
✓ cart
✓ api-gateway

All checks passed!

╔════════════════════════════════════════════════════════════╗
║              Starting Microservices...                     ║
╚════════════════════════════════════════════════════════════╝

Starting User Management on port 6001...
Starting Products Service on port 6002...
Starting Categories Service on port 6003...
Starting Cart Service on port 6004...
Starting API Gateway on port 3000...

╔════════════════════════════════════════════════════════════╗
║           All Services Started Successfully!               ║
╚════════════════════════════════════════════════════════════╝

Service URLs:
  • User Management:  http://localhost:6001
  • Products:         http://localhost:6002
  • Categories:       http://localhost:6003
  • Cart:             http://localhost:6004
  • API Gateway:      http://localhost:3000

Health Check:
  curl http://localhost:3000/health

Happy coding! 🎉
```

### Troubleshooting

**Problem**: Ports already in use

**Solution**: The script will ask if you want to continue. You can:
- Press `n` and run `./stop-all-services.sh` first
- Press `y` to continue (services may fail to start)

**Problem**: Dependencies not installed

**Solution**: The script will offer to install them automatically. Press `y` to install.

**Problem**: Terminal windows don't open

**Solution**: The script will fall back to background mode. Check logs in `logs/` directory.

---

## Script 2: start-all-services-tmux.sh

### Description

Starts all microservices in a single tmux session with multiple windows. Perfect for developers who use tmux or work on remote servers.

### Usage

```bash
./start-all-services-tmux.sh
```

### Prerequisites

Install tmux if not already installed:

```bash
# macOS
brew install tmux

# Ubuntu/Debian
sudo apt-get install tmux

# CentOS/RHEL
sudo yum install tmux
```

### What It Does

1. ✅ Checks if tmux is installed
2. ✅ Creates a new tmux session named "action-commerce"
3. ✅ Creates 6 windows (one per service + monitor)
4. ✅ Starts each service in its own window
5. ✅ Attaches to the session

### tmux Windows

| Window | Name | Service | Port |
|--------|------|---------|------|
| 0 | user-mgmt | User Management | 6001 |
| 1 | products | Products | 6002 |
| 2 | categories | Categories | 6003 |
| 3 | cart | Cart | 6004 |
| 4 | gateway | API Gateway | 3000 |
| 5 | monitor | Commands & Info | - |

### tmux Commands

Once in the session:

| Action | Command |
|--------|---------|
| Switch to window 0-5 | `Ctrl+b` then `0-5` |
| Next window | `Ctrl+b` then `n` |
| Previous window | `Ctrl+b` then `p` |
| Detach session | `Ctrl+b` then `d` |
| Scroll mode | `Ctrl+b` then `[` |
| Exit scroll mode | `q` |
| Kill session | `Ctrl+b` then `:kill-session` |

### Reattaching to Session

If you detach or disconnect:

```bash
tmux attach -t action-commerce
```

### Killing the Session

```bash
tmux kill-session -t action-commerce
```

### Example Output

```
╔════════════════════════════════════════════════════════════╗
║   Action Commerce - Start Services in tmux Session        ║
╚════════════════════════════════════════════════════════════╝

Creating new tmux session: action-commerce

╔════════════════════════════════════════════════════════════╗
║           tmux Session Created Successfully!               ║
╚════════════════════════════════════════════════════════════╝

Session Name: action-commerce

Windows:
  0 - User Management (Port 6001)
  1 - Products (Port 6002)
  2 - Categories (Port 6003)
  3 - Cart (Port 6004)
  4 - API Gateway (Port 3000)
  5 - Monitor & Commands

tmux Commands:
  • Switch windows:   Ctrl+b then 0-5
  • Detach session:   Ctrl+b then d
  • Reattach:         tmux attach -t action-commerce
  • Kill session:     tmux kill-session -t action-commerce

Attaching to session in 3 seconds...
```

---

## Script 3: start-all-services-simple.sh

### Description

Starts all microservices in the background with output logged to files. Ideal for CI/CD pipelines or when you don't need interactive terminals.

### Usage

```bash
./start-all-services-simple.sh
```

### What It Does

1. ✅ Creates `logs/` and `logs/pids/` directories
2. ✅ Starts each service in background
3. ✅ Redirects output to log files
4. ✅ Saves process IDs (PIDs) to files

### Log Files

Logs are saved in the `logs/` directory:

```
logs/
├── user-management.log
├── products.log
├── categories.log
├── cart.log
├── api-gateway.log
└── pids/
    ├── user-management.pid
    ├── products.pid
    ├── categories.pid
    ├── cart.pid
    └── api-gateway.pid
```

### Viewing Logs

```bash
# View all logs in real-time
tail -f logs/*.log

# View specific service log
tail -f logs/user-management.log
tail -f logs/api-gateway.log

# View last 100 lines
tail -n 100 logs/products.log

# Search logs
grep "error" logs/*.log
grep "MongoDB connected" logs/products.log
```

### Example Output

```
╔════════════════════════════════════════════════════════════╗
║     Action Commerce - Simple Startup Script               ║
╚════════════════════════════════════════════════════════════╝

Starting user-management on port 6001...
✓ Started user-management (PID: 12345)
Starting products on port 6002...
✓ Started products (PID: 12346)
Starting categories on port 6003...
✓ Started categories (PID: 12347)
Starting cart on port 6004...
✓ Started cart (PID: 12348)
Starting api-gateway on port 3000...
✓ Started api-gateway (PID: 12349)

╔════════════════════════════════════════════════════════════╗
║           All Services Started Successfully!               ║
╚════════════════════════════════════════════════════════════╝

Service URLs:
  • User Management:  http://localhost:6001
  • Products:         http://localhost:6002
  • Categories:       http://localhost:6003
  • Cart:             http://localhost:6004
  • API Gateway:      http://localhost:3000

Logs: /path/to/project/logs
PIDs: /path/to/project/logs/pids

View logs:
  tail -f logs/user-management.log
  tail -f logs/api-gateway.log

Stop services:
  ./stop-all-services.sh
```

---

## Script 4: stop-all-services.sh

### Description

Stops all running microservices by killing processes on their respective ports.

### Usage

```bash
./stop-all-services.sh
```

### What It Does

1. ✅ Finds processes listening on ports 6001-6004, 3000, 8000
2. ✅ Kills those processes
3. ✅ Cleans up PID files if they exist
4. ✅ Reports status for each service

### Example Output

```
╔════════════════════════════════════════════════════════════╗
║     Action Commerce - Stop All Services Script            ║
╚════════════════════════════════════════════════════════════╝

Stopping microservices...

Stopping User Management Service on port 6001...
✓ Stopped User Management Service
Stopping Products Service on port 6002...
✓ Stopped Products Service
Stopping Categories Service on port 6003...
✓ Stopped Categories Service
Stopping Cart Service on port 6004...
✓ Stopped Cart Service
Stopping API Gateway on port 3000...
✓ Stopped API Gateway
• Load Balancer is not running

Checking for background processes...

╔════════════════════════════════════════════════════════════╗
║           All Services Stopped Successfully!               ║
╚════════════════════════════════════════════════════════════╝
```

### Manual Port Cleanup

If the script doesn't work, manually kill processes:

```bash
# Find process on port
lsof -i :6001

# Kill process
kill -9 <PID>

# Or kill all Node processes (use with caution!)
pkill -9 node
```

---

## Common Workflows

### Development Workflow

```bash
# Start services
./start-all-services.sh

# Make changes to code...

# Restart specific service (in its terminal)
# Ctrl+C to stop, then npm start

# Or restart all services
./stop-all-services.sh
./start-all-services.sh
```

### Remote Server Workflow

```bash
# SSH into server
ssh user@server

# Start services in tmux
./start-all-services-tmux.sh

# Detach from tmux
# Ctrl+b then d

# Logout from SSH
exit

# Later, SSH back and reattach
ssh user@server
tmux attach -t action-commerce
```

### CI/CD Workflow

```bash
# In CI/CD pipeline
./start-all-services-simple.sh

# Wait for services to be ready
sleep 10

# Run tests
npm test

# Check logs if tests fail
cat logs/*.log

# Stop services
./stop-all-services.sh
```

### Debugging Workflow

```bash
# Start in background
./start-all-services-simple.sh

# Monitor logs
tail -f logs/user-management.log

# In another terminal, test API
curl http://localhost:3000/health

# Check specific service
curl http://localhost:6001/health

# Stop when done
./stop-all-services.sh
```

---

## Troubleshooting

### Script Won't Execute

**Error**: `Permission denied`

**Solution**:
```bash
chmod +x start-all-services.sh
```

### Services Won't Start

**Check logs**:
```bash
# If using simple script
tail -f logs/*.log

# If using tmux
# Switch to service window and check output
```

**Common issues**:
1. Port already in use → Run `./stop-all-services.sh`
2. Dependencies missing → Run `npm install` in each service
3. Database not running → Start MongoDB/PostgreSQL
4. Environment variables missing → Check `.env` files

### Can't Stop Services

**Try manual cleanup**:
```bash
# Kill all Node processes
pkill -9 node

# Or kill specific ports
lsof -ti:6001 | xargs kill -9
lsof -ti:6002 | xargs kill -9
lsof -ti:6003 | xargs kill -9
lsof -ti:6004 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### tmux Session Already Exists

**Solution**:
```bash
# Kill existing session
tmux kill-session -t action-commerce

# Or attach to it
tmux attach -t action-commerce
```

---

## Best Practices

1. **Always stop services cleanly** using `./stop-all-services.sh` before shutting down
2. **Check health endpoints** after starting services
3. **Monitor logs** when debugging issues
4. **Use tmux for remote servers** to keep services running after disconnect
5. **Use background mode for CI/CD** to capture logs
6. **Keep scripts updated** if you add new services

---

## Summary

| Scenario | Recommended Script |
|----------|-------------------|
| Local development (GUI) | `start-all-services.sh` |
| Remote server | `start-all-services-tmux.sh` |
| CI/CD pipeline | `start-all-services-simple.sh` |
| Quick testing | `start-all-services-simple.sh` |
| Debugging | `start-all-services-simple.sh` + `tail -f` |
| Cleanup | `stop-all-services.sh` |

---

## Additional Resources

- [Running Services Guide](./RUNNING-SERVICES.md) - Comprehensive guide to running services
- [Quick Start Guide](./QUICK-START-GUIDE.md) - Complete setup instructions
- [API Gateway Architecture](./API-GATEWAY-ARCHITECTURE.md) - Architecture overview
- [Endpoint Reference](./ENDPOINT-REFERENCE.md) - API documentation
