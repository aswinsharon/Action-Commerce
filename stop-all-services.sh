#!/bin/bash

# Action Commerce - Stop All Microservices
# This script stops all running microservices

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Action Commerce - Stop All Services Script            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to kill process on port
kill_port() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}Stopping $service_name on port $port...${NC}"
        local pid=$(lsof -ti:$port)
        if [ -n "$pid" ]; then
            kill -9 $pid 2>/dev/null || true
            echo -e "${GREEN}✓ Stopped $service_name${NC}"
        fi
    else
        echo -e "${BLUE}• $service_name is not running${NC}"
    fi
}

# Stop services by port
echo -e "${YELLOW}Stopping microservices...${NC}"
echo ""

kill_port 6001 "User Management Service"
kill_port 6002 "Products Service"
kill_port 6003 "Categories Service"
kill_port 6004 "Cart Service"
kill_port 3000 "API Gateway"
kill_port 8000 "Load Balancer"

echo ""

# Stop background processes if PID files exist
if [ -d "$SCRIPT_DIR/logs" ]; then
    echo -e "${YELLOW}Checking for background processes...${NC}"
    
    for pidfile in "$SCRIPT_DIR/logs"/*.pid; do
        if [ -f "$pidfile" ]; then
            pid=$(cat "$pidfile")
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${YELLOW}Stopping process $pid...${NC}"
                kill -9 $pid 2>/dev/null || true
            fi
            rm "$pidfile"
        fi
    done
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           All Services Stopped Successfully!               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
