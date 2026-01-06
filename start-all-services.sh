#!/bin/bash

# Action Commerce - Start All Microservices
# This script starts all microservices in separate terminal windows/tabs

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
echo -e "${BLUE}║     Action Commerce - Microservices Startup Script        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to check if a service directory exists
check_service_dir() {
    local service=$1
    if [ ! -d "$SCRIPT_DIR/$service" ]; then
        echo -e "${RED}✗ Service directory not found: $service${NC}"
        return 1
    fi
    return 0
}

# Function to check if node_modules exists
check_dependencies() {
    local service=$1
    if [ ! -d "$SCRIPT_DIR/$service/node_modules" ]; then
        echo -e "${YELLOW}⚠ Dependencies not installed for $service${NC}"
        echo -e "${YELLOW}  Run: cd $service && npm install${NC}"
        return 1
    fi
    return 0
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm --version)${NC}"

echo ""

# Check if ports are already in use
echo -e "${YELLOW}Checking ports...${NC}"
PORTS_IN_USE=0

if check_port 6001; then
    echo -e "${YELLOW} Port 6001 (User Management) is already in use${NC}"
    PORTS_IN_USE=1
fi

if check_port 6002; then
    echo -e "${YELLOW} Port 6002 (Products) is already in use${NC}"
    PORTS_IN_USE=1
fi

if check_port 6003; then
    echo -e "${YELLOW} Port 6003 (Categories) is already in use${NC}"
    PORTS_IN_USE=1
fi

if check_port 6004; then
    echo -e "${YELLOW} Port 6004 (carts) is already in use${NC}"
    PORTS_IN_USE=1
fi

if check_port 3000; then
    echo -e "${YELLOW} Port 3000 (API Gateway) is already in use${NC}"
    PORTS_IN_USE=1
fi

if [ $PORTS_IN_USE -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}Some ports are already in use. Do you want to continue? (y/n)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo -e "${RED}Startup cancelled${NC}"
        exit 1
    fi
fi

echo ""

# Check service directories and dependencies
echo -e "${YELLOW}Checking services...${NC}"
SERVICES=("user-management" "products" "categories" "carts" "api-gateway")
MISSING_DEPS=0

for service in "${SERVICES[@]}"; do
    if check_service_dir "$service"; then
        if check_dependencies "$service"; then
            echo -e "${GREEN}✓ $service${NC}"
        else
            MISSING_DEPS=1
        fi
    else
        echo -e "${RED}✗ $service directory not found${NC}"
        exit 1
    fi
done

if [ $MISSING_DEPS -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}Some services are missing dependencies. Install them? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        for service in "${SERVICES[@]}"; do
            if [ ! -d "$SCRIPT_DIR/$service/node_modules" ]; then
                echo -e "${BLUE}Installing dependencies for $service...${NC}"
                cd "$SCRIPT_DIR/$service" && sudo npm install
                if [ $? -ne 0 ]; then
                    echo -e "${RED}✗ Failed to install dependencies for $service${NC}"
                    echo -e "${YELLOW}Trying without sudo...${NC}"
                    cd "$SCRIPT_DIR/$service" && npm install
                fi
            fi
        done
    else
        echo -e "${RED}Cannot start services without dependencies${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}All checks passed!${NC}"
echo ""

# Detect terminal emulator and OS
detect_terminal() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - Check for iTerm2 first
        if [ -d "/Applications/iTerm.app" ] || [ -d "$HOME/Applications/iTerm.app" ]; then
            echo "iterm"
        else
            echo "macos"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if [ -n "$GNOME_TERMINAL_SERVICE" ]; then
            echo "gnome-terminal"
        elif [ -n "$KONSOLE_VERSION" ]; then
            echo "konsole"
        elif command -v xterm &> /dev/null; then
            echo "xterm"
        else
            echo "unknown"
        fi
    else
        echo "unknown"
    fi
}

TERMINAL_TYPE=$(detect_terminal)

# Global variable to track if first service (for iTerm/Terminal)
FIRST_SERVICE=true

# Function to start a service in a new tab
start_service() {
    local service_name=$1
    local service_dir=$2
    local port=$3
    
    echo -e "${BLUE}Starting $service_name on port $port...${NC}"
    
    case $TERMINAL_TYPE in
        "iterm")
            if [ "$FIRST_SERVICE" = true ]; then
                # First service: create new window
                osascript <<EOF
tell application "iTerm"
    create window with default profile
    tell current session of current window
        set name to "$service_name"
        write text "cd '$SCRIPT_DIR/$service_dir' && echo 'Starting $service_name...' && npm start"
    end tell
end tell
EOF
                FIRST_SERVICE=false
            else
                # Subsequent services: create new tab in current window
                osascript <<EOF
tell application "iTerm"
    tell current window
        create tab with default profile
        tell current session
            set name to "$service_name"
            write text "cd '$SCRIPT_DIR/$service_dir' && echo 'Starting $service_name...' && npm start"
        end tell
    end tell
end tell
EOF
            fi
            ;;
        "macos")
            if [ "$FIRST_SERVICE" = true ]; then
                # First service: create new window
                osascript <<EOF
tell application "Terminal"
    do script "cd '$SCRIPT_DIR/$service_dir' && echo 'Starting $service_name...' && npm start"
    set custom title of front window to "$service_name"
    activate
end tell
EOF
                FIRST_SERVICE=false
            else
                # Subsequent services: create new tab
                osascript <<EOF
tell application "Terminal"
    tell front window
        do script "cd '$SCRIPT_DIR/$service_dir' && echo 'Starting $service_name...' && npm start" in (make new tab)
        set custom title of current tab to "$service_name"
    end tell
end tell
EOF
            fi
            ;;
        "gnome-terminal")
            gnome-terminal --tab --title="$service_name" -- bash -c "cd '$SCRIPT_DIR/$service_dir' && echo 'Starting $service_name...' && npm start; exec bash"
            ;;
        "konsole")
            konsole --new-tab -e bash -c "cd '$SCRIPT_DIR/$service_dir' && echo 'Starting $service_name...' && npm start; exec bash"
            ;;
        "xterm")
            xterm -T "$service_name" -e "cd '$SCRIPT_DIR/$service_dir' && echo 'Starting $service_name...' && npm start; bash" &
            ;;
        *)
            echo -e "${YELLOW}⚠ Could not detect terminal. Starting in background...${NC}"
            cd "$SCRIPT_DIR/$service_dir" && npm start > "$SCRIPT_DIR/logs/$service_name.log" 2>&1 &
            echo $! > "$SCRIPT_DIR/logs/$service_name.pid"
            ;;
    esac
    
    sleep 2
}

# Create logs directory if running in background
if [ "$TERMINAL_TYPE" == "unknown" ]; then
    mkdir -p "$SCRIPT_DIR/logs"
fi

# Start services
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Starting Microservices...                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

start_service "User Management" "user-management" "6001"
start_service "Products Service" "products" "6002"
start_service "Categories Service" "categories" "6003"
start_service "carts Service" "carts" "6004"
start_service "API Gateway" "api-gateway" "3000"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           All Services Started Successfully!               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo -e "  ${GREEN}•${NC} User Management:  http://localhost:6001"
echo -e "  ${GREEN}•${NC} Products:         http://localhost:6002"
echo -e "  ${GREEN}•${NC} Categories:       http://localhost:6003"
echo -e "  ${GREEN}•${NC} carts:             http://localhost:6004"
echo -e "  ${GREEN}•${NC} API Gateway:      http://localhost:3000"
echo ""
echo -e "${BLUE}Health Check:${NC}"
echo -e "  curl http://localhost:3000/health"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo -e "  ${GREEN}•${NC} API Gateway Architecture: docs/API-GATEWAY-ARCHITECTURE.md"
echo -e "  ${GREEN}•${NC} Endpoint Reference:       docs/ENDPOINT-REFERENCE.md"
echo -e "  ${GREEN}•${NC} Quick Start Guide:        docs/QUICK-START-GUIDE.md"
echo ""

if [ "$TERMINAL_TYPE" == "unknown" ]; then
    echo -e "${YELLOW}Services are running in background. Logs are in: $SCRIPT_DIR/logs/${NC}"
    echo -e "${YELLOW}To stop services, run: ./stop-all-services.sh${NC}"
fi

echo -e "${GREEN}Happy coding! 🎉${NC}"
