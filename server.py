from flask import Flask, jsonify, send_from_directory
from pymongo import MongoClient
from flask_cors import CORS

app = Flask(__name__, static_folder='.')
CORS(app)

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['grocerease']

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory('.', 'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/stores', methods=['GET'])
def get_stores():
    print("Fetching stores...")
    stores = db.store_layouts.distinct('store_id')
    print("Found stores:", stores)
    return jsonify(stores)

@app.route('/api/floors/<store_id>', methods=['GET'])
def get_floors(store_id):
    print(f"Fetching floors for store {store_id}...")
    floors = list(db.store_layouts.find({'store_id': store_id}, {'floor_id': 1, '_id': 0}))
    print("Found floors:", floors)
    return jsonify(floors)

@app.route('/api/layout/<store_id>/<floor_id>', methods=['GET'])
def get_layout(store_id, floor_id):
    print(f"Fetching layout for store {store_id}, floor {floor_id}...")
    layout = db.store_layouts.find_one(
        {'store_id': store_id, 'floor_id': floor_id},
        {'_id': 0}
    )
    print("Found layout:", layout is not None)
    return jsonify(layout)

@app.route('/api/items/<store_id>/<floor_id>', methods=['GET'])
def get_items(store_id, floor_id):
    print(f"Fetching items for store {store_id}, floor {floor_id}...")
    items = list(db.items.find({}, {'_id': 0}))
    print("Found items:", len(items))
    return jsonify(items)

if __name__ == '__main__':
    app.run(debug=True, port=5001) 