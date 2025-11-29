#!/bin/bash

# Action Commerce - Simple Start Script
# Starts all services in background with logs

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
PID_DIR="$SCRIPT_DIR/logs/pids"

# Create directories
mkdir -p "$LOG_DIR"
mkdir -p "$PID_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Action Commerce - Simple Startup Script               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to start a service
start_service() {
    local name=$1
    local dir=$2
    local port=$3
    
    echo -e "${YELLOW}Starting $name on port $port...${NC}"
    
    # Check if dependencies are installed
    if [ ! -d "$SCRIPT_DIR/$dir/node_modules" ]; then
        echo -e "${YELLOW}⚠ Dependencies not installed for $name. Installing...${NC}"
        cd "$SCRIPT_DIR/$dir" && sudo npm install
        if [ $? -ne 0 ]; then
            echo -e "${YELLOW}Trying without sudo...${NC}"
            cd "$SCRIPT_DIR/$dir" && npm install
        fi
    fi
    
    cd "$SCRIPT_DIR/$dir"
    npm start > "$LOG_DIR/$name.log" 2>&1 &
    local pid=$!
    echo $pid > "$PID_DIR/$name.pid"
    
    echo -e "${GREEN}✓ Started $name (PID: $pid)${NC}"
    sleep 2
}

# Start services
start_service "user-management" "user-management" "6001"
start_service "products" "products" "6002"
start_service "categories" "categories" "6003"
start_service "cart" "cart" "6004"
start_service "api-gateway" "api-gateway" "3000"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           All Services Started Successfully!               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo -e "  ${GREEN}•${NC} User Management:  http://localhost:6001"
echo -e "  ${GREEN}•${NC} Products:         http://localhost:6002"
echo -e "  ${GREEN}•${NC} Categories:       http://localhost:6003"
echo -e "  ${GREEN}•${NC} Cart:             http://localhost:6004"
echo -e "  ${GREEN}•${NC} API Gateway:      http://localhost:3000"
echo ""
echo -e "${BLUE}Logs:${NC} $LOG_DIR"
echo -e "${BLUE}PIDs:${NC} $PID_DIR"
echo ""
echo -e "${YELLOW}View logs:${NC}"
echo -e "  tail -f $LOG_DIR/user-management.log"
echo -e "  tail -f $LOG_DIR/api-gateway.log"
echo ""
echo -e "${YELLOW}Stop services:${NC}"
echo -e "  ./stop-all-services.sh"
echo ""
