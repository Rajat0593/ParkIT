#!/bin/bash

# ParkIT Backend Setup Script
# This script sets up the complete backend environment

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          ParkIT Backend - Setup & Installation                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "${BLUE}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js v18+ from https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo "${GREEN}✓ Node.js ${NODE_VERSION} is installed${NC}"
fi

# Check if PostgreSQL is installed
echo ""
echo "${BLUE}Checking PostgreSQL installation...${NC}"
if ! command -v psql &> /dev/null; then
    echo "${YELLOW}⚠ PostgreSQL is not installed${NC}"
    echo "Please install PostgreSQL 13+ from https://www.postgresql.org/"
    read -p "Do you want to continue without creating the database? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    PG_VERSION=$(psql --version)
    echo "${GREEN}✓ ${PG_VERSION} is installed${NC}"
fi

# Install npm dependencies
echo ""
echo "${BLUE}Installing npm dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

# Create PostgreSQL database
echo ""
echo "${BLUE}Setting up PostgreSQL database...${NC}"
if command -v psql &> /dev/null; then
    read -p "Enter PostgreSQL username [postgres]: " PG_USER
    PG_USER=${PG_USER:-postgres}
    
    read -sp "Enter PostgreSQL password: " PG_PASSWORD
    echo
    
    export PGPASSWORD=$PG_PASSWORD
    
    # Create database
    psql -U $PG_USER -c "CREATE DATABASE parkIT_db;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "${GREEN}✓ Database 'parkIT_db' created${NC}"
    else
        echo "${YELLOW}⚠ Database might already exist or failed to create${NC}"
    fi
    
    unset PGPASSWORD
else
    echo "${YELLOW}⚠ PostgreSQL not found, skipping database setup${NC}"
    echo "Please create the database manually and update .env file"
fi

# Create .env file
echo ""
echo "${BLUE}Setting up environment variables...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "${GREEN}✓ .env file created${NC}"
    echo "${YELLOW}⚠ Please update .env file with your configuration${NC}"
else
    echo "${GREEN}✓ .env file already exists${NC}"
fi

# Create necessary directories
echo ""
echo "${BLUE}Creating necessary directories...${NC}"
mkdir -p logs uploads
echo "${GREEN}✓ Directories created${NC}"

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete!                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "${BLUE}Next steps:${NC}"
echo "1. Update .env file with your database credentials and API keys"
echo "2. Run: ${YELLOW}npm run dev${NC} (development mode)"
echo "3. Run: ${YELLOW}npm start${NC} (production mode)"
echo ""
echo "${BLUE}Useful commands:${NC}"
echo "  npm run dev      - Start development server with auto-reload"
echo "  npm start        - Start production server"
echo "  npm test         - Run tests"
echo "  npm run lint     - Check code style"
echo "  npm run format   - Format code"
echo ""
echo "${GREEN}Happy coding! 🚀${NC}"
echo ""
