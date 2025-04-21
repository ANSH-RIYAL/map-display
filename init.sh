#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting initialization...${NC}"

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo -e "${RED}MongoDB is not installed. Please install MongoDB first.${NC}"
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo -e "${GREEN}Starting MongoDB...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start mongodb-community
    else
        # Linux
        sudo service mongodb start
    fi
    sleep 5 # Wait for MongoDB to start
else
    echo -e "${GREEN}MongoDB is already running.${NC}"
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3 first.${NC}"
    exit 1
fi

# Install required Python packages
echo -e "${GREEN}Installing required Python packages...${NC}"
pip3 install flask pymongo flask-cors

# Check if data files exist
if [ ! -f "items.csv" ] || [ ! -f "smoothened_vertices.json" ]; then
    echo -e "${RED}Required data files (items.csv and smoothened_vertices.json) are missing.${NC}"
    exit 1
fi

# Import data into MongoDB
echo -e "${GREEN}Importing data into MongoDB...${NC}"
python3 import_data.py

# Check if import was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to import data into MongoDB.${NC}"
    exit 1
fi

# Start the Flask server
echo -e "${GREEN}Starting Flask server...${NC}"
echo -e "${GREEN}Server will be available at http://localhost:5001${NC}"
python3 server.py 