import csv
import json
from pymongo import MongoClient
import os

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['grocerease']

# Create collections
store_layouts = db['store_layouts']
items = db['items']

# Import items from CSV
with open('items.csv', 'r') as file:
    csv_reader = csv.DictReader(file)
    items_data = list(csv_reader)
    if items_data:
        items.insert_many(items_data)

# Import store layout from JSON
with open('smoothened_vertices.json', 'r') as file:
    layout_data = json.load(file)
    # Add store_id and floor_id
    layout_data['store_id'] = 'store1'
    layout_data['floor_id'] = 'floor1'
    store_layouts.insert_one(layout_data)

print("Data imported successfully!") 