#!/bin/bash

# Action Commerce - Start All Microservices in tmux
# This script starts all microservices in a single tmux session with multiple panes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SESSION_NAME="action-commerce"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Action Commerce - Start Services in tmux Session        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}✗ tmux is not installed${NC}"
    echo -e "${YELLOW}Install tmux:${NC}"
    echo -e "  macOS:   brew install tmux"
    echo -e "  Ubuntu:  sudo apt-get install tmux"
    echo -e "  CentOS:  sudo yum install tmux"
    exit 1
fi

# Check if session already exists
if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo -e "${YELLOW}⚠ Session '$SESSION_NAME' already exists${NC}"
    echo -e "${YELLOW}Do you want to kill it and create a new one? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        tmux kill-session -t $SESSION_NAME
        echo -e "${GREEN}✓ Killed existing session${NC}"
    else
        echo -e "${BLUE}Attaching to existing session...${NC}"
        tmux attach-session -t $SESSION_NAME
        exit 0
    fi
fi

echo -e "${GREEN}Creating new tmux session: $SESSION_NAME${NC}"
echo ""

# Check and install dependencies if needed
SERVICES=("user-management" "products" "categories" "cart" "api-gateway")
for service in "${SERVICES[@]}"; do
    if [ ! -d "$SCRIPT_DIR/$service/node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies for $service...${NC}"
        cd "$SCRIPT_DIR/$service" && sudo npm install
        if [ $? -ne 0 ]; then
            echo -e "${YELLOW}Trying without sudo...${NC}"
            cd "$SCRIPT_DIR/$service" && npm install
        fi
    fi
done

# Create new session with first window for User Management
tmux new-session -d -s $SESSION_NAME -n "user-mgmt" -c "$SCRIPT_DIR/user-management"

# Send commands to first window
tmux send-keys -t $SESSION_NAME:0 "echo 'Starting User Management Service (Port 6001)...'" C-m
tmux send-keys -t $SESSION_NAME:0 "npm start" C-m

# Create window for Products Service
tmux new-window -t $SESSION_NAME:1 -n "products" -c "$SCRIPT_DIR/products"
tmux send-keys -t $SESSION_NAME:1 "echo 'Starting Products Service (Port 6002)...'" C-m
tmux send-keys -t $SESSION_NAME:1 "npm start" C-m

# Create window for Categories Service
tmux new-window -t $SESSION_NAME:2 -n "categories" -c "$SCRIPT_DIR/categories"
tmux send-keys -t $SESSION_NAME:2 "echo 'Starting Categories Service (Port 6003)...'" C-m
tmux send-keys -t $SESSION_NAME:2 "npm start" C-m

# Create window for Cart Service
tmux new-window -t $SESSION_NAME:3 -n "cart" -c "$SCRIPT_DIR/cart"
tmux send-keys -t $SESSION_NAME:3 "echo 'Starting Cart Service (Port 6004)...'" C-m
tmux send-keys -t $SESSION_NAME:3 "npm start" C-m

# Create window for API Gateway
tmux new-window -t $SESSION_NAME:4 -n "gateway" -c "$SCRIPT_DIR/api-gateway"
tmux send-keys -t $SESSION_NAME:4 "echo 'Starting API Gateway (Port 3000)...'" C-m
tmux send-keys -t $SESSION_NAME:4 "npm start" C-m

# Create window for monitoring/commands
tmux new-window -t $SESSION_NAME:5 -n "monitor" -c "$SCRIPT_DIR"
tmux send-keys -t $SESSION_NAME:5 "clear" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '╔════════════════════════════════════════════════════════════╗'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '║        Action Commerce - Monitoring & Commands            ║'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '╚════════════════════════════════════════════════════════════╝'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo ''" C-m
tmux send-keys -t $SESSION_NAME:5 "echo 'Services:'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '  • User Management:  http://localhost:6001'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '  • Products:         http://localhost:6002'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '  • Categories:       http://localhost:6003'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '  • Cart:             http://localhost:6004'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '  • API Gateway:      http://localhost:3000'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo ''" C-m
tmux send-keys -t $SESSION_NAME:5 "echo 'tmux Commands:'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '  • Switch windows:   Ctrl+b then 0-5'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '  • Detach session:   Ctrl+b then d'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '  • Kill session:     Ctrl+b then :kill-session'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '  • Scroll mode:      Ctrl+b then ['" C-m
tmux send-keys -t $SESSION_NAME:5 "echo ''" C-m
tmux send-keys -t $SESSION_NAME:5 "echo 'Useful Commands:'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '  # Check health'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '  curl http://localhost:3000/health'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo ''" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '  # Check all services health'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '  curl http://localhost:3000/health/services'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo ''" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '  # Stop all services'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '  ./stop-all-services.sh'" C-m
tmux send-keys -t $SESSION_NAME:5 "echo ''" C-m

# Select the monitoring window
tmux select-window -t $SESSION_NAME:5

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           tmux Session Created Successfully!               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Session Name:${NC} $SESSION_NAME"
echo ""
echo -e "${BLUE}Windows:${NC}"
echo -e "  ${GREEN}0${NC} - User Management (Port 6001)"
echo -e "  ${GREEN}1${NC} - Products (Port 6002)"
echo -e "  ${GREEN}2${NC} - Categories (Port 6003)"
echo -e "  ${GREEN}3${NC} - Cart (Port 6004)"
echo -e "  ${GREEN}4${NC} - API Gateway (Port 3000)"
echo -e "  ${GREEN}5${NC} - Monitor & Commands"
echo ""
echo -e "${BLUE}tmux Commands:${NC}"
echo -e "  ${GREEN}•${NC} Switch windows:   ${YELLOW}Ctrl+b${NC} then ${YELLOW}0-5${NC}"
echo -e "  ${GREEN}•${NC} Detach session:   ${YELLOW}Ctrl+b${NC} then ${YELLOW}d${NC}"
echo -e "  ${GREEN}•${NC} Reattach:         ${YELLOW}tmux attach -t $SESSION_NAME${NC}"
echo -e "  ${GREEN}•${NC} Kill session:     ${YELLOW}tmux kill-session -t $SESSION_NAME${NC}"
echo ""
echo -e "${YELLOW}Attaching to session in 3 seconds...${NC}"
sleep 3

# Attach to the session
tmux attach-session -t $SESSION_NAME
