# Interactive Store Map

An interactive web application that displays store layouts and item locations using MongoDB for data storage and a Flask backend.

## Features

- Interactive store map with pan and zoom capabilities
- Hover over sections to see face IDs and section names
- Click on sections to view items in that area
- Dropdown selection for store and floor
- Real-time data updates from MongoDB

## Prerequisites

- Python 3.x
- MongoDB
- pip (Python package manager)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ANSH-RIYAL/map-display.git
cd map-display
```

2. Install required Python packages:
```bash
pip install flask pymongo flask-cors
```

3. Install MongoDB:
- For macOS (using Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

- For Ubuntu:
```bash
sudo apt-get install mongodb
sudo service mongodb start
```

## Data Files

The application requires two data files:
1. `items.csv`: Contains item information with columns:
   - face_id
   - section_name
   - item_name
   - category
   - price
   - stock

2. `smoothened_vertices.json`: Contains store layout data with:
   - store_vertices
   - polygons
   - store_faces
   - block_faces

## Quick Start

1. Make the initialization script executable:
```bash
chmod +x init.sh
```

2. Run the initialization script:
```bash
./init.sh
```

This will:
- Start MongoDB if not already running
- Import the data files into MongoDB
- Start the Flask server

## Manual Setup

If you prefer to set up manually:

1. Start MongoDB:
```bash
mongod --dbpath /usr/local/var/mongodb
```

2. Import data:
```bash
python3 import_data.py
```

3. Start the server:
```bash
python3 server.py
```

4. Open your browser and navigate to:
```
http://localhost:5001
```

## Usage

1. Select a store from the dropdown
2. Select a floor from the dropdown
3. The map will display with:
   - Store boundaries in green
   - Internal blocks in red and blue
4. Hover over sections to see face IDs and section names
5. Click on sections to view items in that area
6. Use mouse wheel to zoom in/out
7. Click and drag to pan the map

## Project Structure

- `index.html`: Frontend interface
- `map.js`: Map rendering and interaction logic
- `server.py`: Flask backend server
- `import_data.py`: MongoDB data import script
- `init.sh`: Initialization script
- `items.csv`: Item data
- `smoothened_vertices.json`: Store layout data

## Troubleshooting

1. If MongoDB fails to start:
   - Check if MongoDB is already running: `ps aux | grep mongod`
   - Ensure the data directory exists and has proper permissions
   - Check MongoDB logs for errors

2. If the server fails to start:
   - Ensure all required packages are installed
   - Check if port 5001 is available
   - Verify MongoDB is running

3. If the map doesn't display:
   - Check browser console for JavaScript errors
   - Verify data was imported correctly into MongoDB
   - Ensure the server is running and accessible

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 