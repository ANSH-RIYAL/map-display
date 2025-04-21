// Store data structures
let faces = [];
let items = [];
let storeLayout = null;
let shoppingList = new Set(); // Track items in shopping list
let itemMarkers = new Map(); // Track markers for items in shopping list

// UI elements
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');
const itemList = document.getElementById('itemList');

// Map interaction variables
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let lastX = 0;
let lastY = 0;

// Add tooltip styling
tooltip.style.position = 'fixed';
tooltip.style.backgroundColor = 'white';
tooltip.style.border = '1px solid #ccc';
tooltip.style.padding = '10px';
tooltip.style.borderRadius = '5px';
tooltip.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
tooltip.style.fontSize = '14px';
tooltip.style.zIndex = '1000';
tooltip.style.minWidth = '150px';
tooltip.style.textAlign = 'center';
tooltip.style.display = 'none';

// Add this variable to track the timeout
let tooltipTimeout = null;

function initializeMap(layout, itemsData) {
    try {
        // Set the store layout
        storeLayout = layout;
        items = itemsData;
        
        // Generate faces from vertices
        generateFaces();
        
        // Show the map and item display
        canvas.style.display = 'block';
        document.getElementById('itemDisplay').style.display = 'block';
        
        // Initial render
        drawMap();
        
        console.log('Available face IDs:', faces.map(f => f.face_id));
        console.log('Available items face IDs:', [...new Set(items.map(i => i.face_id))]);
        
    } catch (error) {
        console.error('Error in initializeMap:', error);
        document.getElementById('uploadError').textContent = 'Error initializing map: ' + error.message;
    }
}

function generateFaces() {
    faces = [];
    
    // Process store boundary
    const store_vertices = storeLayout.store_vertices;
    // Make sure to close the loop by connecting last vertex to first
    const allStoreVertices = [...store_vertices, store_vertices[0]];
    
    for (let i = 0; i < allStoreVertices.length - 1; i++) {
        const face_id = `S${i+1}`;
        faces.push({
            face_id: face_id,
            start_x: allStoreVertices[i][0],
            start_y: allStoreVertices[i][1],
            end_x: allStoreVertices[i+1][0],
            end_y: allStoreVertices[i+1][1]
        });
    }
    
    // Process internal polygons (blocks)
    storeLayout.polygons.forEach((block, block_idx) => {
        const vertices = block.polygon_vertices;
        // Make sure to close the loop by connecting last vertex to first
        const allBlockVertices = [...vertices, vertices[0]];
        
        for (let i = 0; i < allBlockVertices.length - 1; i++) {
            const face_id = `B${block_idx + 1}F${i+1}`;
            faces.push({
                face_id: face_id,
                start_x: allBlockVertices[i][0],
                start_y: allBlockVertices[i][1],
                end_x: allBlockVertices[i+1][0],
                end_y: allBlockVertices[i+1][1]
            });
        }
    });
    
    // Log all face IDs for debugging
    console.log('Available face IDs:', faces.map(f => f.face_id));
    console.log('Available items face IDs:', [...new Set(items.map(i => i.face_id))]);
}

// Add this function to generate a unique color for each face
function getFaceColor(faceId) {
    // Create a mapping of face IDs to their index in the sequence
    const faceIndex = faces.findIndex(f => f.face_id === faceId);
    
    // Use the index to generate a unique HSL color
    // We have 90 faces, so we'll distribute them evenly across the color wheel
    const hue = (faceIndex * (360 / faces.length)) % 360;
    return `hsl(${hue}, 80%, 50%)`;
}

// Draw the store map
function drawMap(highlightedFace = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    
    // Draw store boundary
    ctx.beginPath();
    const firstPoint = storeLayout.store_vertices[0];
    ctx.moveTo(firstPoint[0], firstPoint[1]);
    
    for (let i = 1; i < storeLayout.store_vertices.length; i++) {
        const point = storeLayout.store_vertices[i];
        ctx.lineTo(point[0], point[1]);
    }
    
    // Close the store boundary
    ctx.lineTo(firstPoint[0], firstPoint[1]);
    ctx.strokeStyle = '#2ecc71';  // Green color for store boundary
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';  // White background
    ctx.fill();
    
    // Draw internal blocks with solid fill
    storeLayout.polygons.forEach((block, index) => {
        ctx.beginPath();
        const firstBlockPoint = block.polygon_vertices[0];
        ctx.moveTo(firstBlockPoint[0], firstBlockPoint[1]);
        
        for (let i = 1; i < block.polygon_vertices.length; i++) {
            const point = block.polygon_vertices[i];
            ctx.lineTo(point[0], point[1]);
        }
        
        // Close the block
        ctx.lineTo(firstBlockPoint[0], firstBlockPoint[1]);
        
        // Fill blocks with solid colors
        ctx.fillStyle = index === 0 ? 'rgba(231, 76, 60, 0.3)' : 'rgba(52, 152, 219, 0.3)';
        ctx.fill();
        
        // Draw block outline
        ctx.strokeStyle = index === 0 ? '#e74c3c' : '#3498db';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    
    // Draw highlighted face if exists
    if (highlightedFace) {
        ctx.beginPath();
        ctx.moveTo(highlightedFace.start_x, highlightedFace.start_y);
        ctx.lineTo(highlightedFace.end_x, highlightedFace.end_y);
        ctx.strokeStyle = '#f1c40f';  // Yellow highlight
        ctx.lineWidth = 4;
        ctx.stroke();
    }
    
    // Draw markers for items in shopping list
    itemMarkers.forEach((marker, itemName) => {
        ctx.beginPath();
        ctx.arc(marker.x, marker.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = getFaceColor(marker.faceId);
        ctx.fill();
    });
    
    ctx.restore();
}

// Handle mouse events
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener('mousemove', handleMouseMove);

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scale *= delta;
    drawMap();
});

// Handle mouse move for hover effect
function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - offsetX) / scale;
    const y = (event.clientY - rect.top - offsetY) / scale;
    
    if (isDragging) {
        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;
        offsetX += dx;
        offsetY += dy;
        lastX = event.clientX;
        lastY = event.clientY;
        drawMap();
    }
    
    // Find the face under the cursor
    const face = faces.find(f => isPointNearLine(x, y, f));
    
    if (face) {
        // Clear any existing timeout
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
        }
        
        // Find the face info in items data
        const faceInfo = items.find(item => item.face_id === face.face_id);
        
        // Set tooltip content with both face ID and section name
        if (faceInfo) {
            tooltip.textContent = `Face ID: ${face.face_id}\nSection: ${faceInfo.section_name}`;
        } else {
            tooltip.textContent = `Face ID: ${face.face_id}\nSection: Not Assigned`;
        }
        
        tooltip.style.display = 'block';
        tooltip.style.left = (event.clientX + 10) + 'px';
        tooltip.style.top = (event.clientY + 10) + 'px';
        
        // Set a timeout to hide the tooltip
        tooltipTimeout = setTimeout(() => {
            tooltip.style.display = 'none';
        }, 2000);
    } else {
        tooltip.style.display = 'none';
    }
}

// Handle click to display items
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - offsetX) / scale;
    const y = (event.clientY - rect.top - offsetY) / scale;
    
    // Find the face under the cursor with a 3-pixel buffer
    const face = faces.find(f => isPointNearLine(x, y, f));
    
    if (face) {
        displayItems(face.face_id);
    }
});

// Display items for selected face
function displayItems(faceId) {
    // Find items for the selected face
    const faceItems = items.filter(item => item.face_id === faceId);
    
    // Clear previous items
    itemList.innerHTML = '';
    
    // Display each item
    faceItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';
        itemElement.innerHTML = `
            <h3>${item.item_name}</h3>
            <p>Section: ${item.section_name}</p>
            <button onclick="addToShoppingList('${item.item_name}', '${item.face_id}')">Add to Shopping List</button>
        `;
        itemList.appendChild(itemElement);
    });
}

// Add item to shopping list
function addToShoppingList(itemName, faceId) {
    if (!shoppingList.has(itemName)) {
        shoppingList.add(itemName);
        
        // Add to shopping list UI
        const shoppingListElement = document.getElementById('shoppingList');
        const listItem = document.createElement('li');
        listItem.className = 'shopping-list-item';
        listItem.innerHTML = `
            <div class="item-dot" style="background-color: ${getFaceColor(faceId)}"></div>
            <span class="item-name">${itemName}</span>
            <button onclick="removeFromShoppingList('${itemName}')">Remove</button>
        `;
        shoppingListElement.appendChild(listItem);
        
        // Add marker to map
        const face = faces.find(f => f.face_id === faceId);
        if (face) {
            const midX = (face.start_x + face.end_x) / 2;
            const midY = (face.start_y + face.end_y) / 2;
            itemMarkers.set(itemName, { 
                x: midX, 
                y: midY,
                faceId: faceId
            });
            drawMap();
        }
    }
}

// Remove item from shopping list
function removeFromShoppingList(itemName) {
    shoppingList.delete(itemName);
    itemMarkers.delete(itemName);
    
    // Remove from shopping list UI
    const shoppingListElement = document.getElementById('shoppingList');
    const items = shoppingListElement.getElementsByClassName('shopping-list-item');
    for (let i = 0; i < items.length; i++) {
        if (items[i].querySelector('span').textContent === itemName) {
            items[i].remove();
            break;
        }
    }
    
    drawMap();
}

// Check if point is near line segment
function isPointNearLine(x, y, face) {
    const A = x - face.start_x;
    const B = y - face.start_y;
    const C = face.end_x - face.start_x;
    const D = face.end_y - face.start_y;
    
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    
    if (len_sq !== 0) {
        param = dot / len_sq;
    }
    
    let xx, yy;
    
    if (param < 0) {
        xx = face.start_x;
        yy = face.start_y;
    } else if (param > 1) {
        xx = face.end_x;
        yy = face.end_y;
    } else {
        xx = face.start_x + param * C;
        yy = face.start_y + param * D;
    }
    
    const dx = x - xx;
    const dy = y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Return true if distance is less than 4 pixels for hover, 3 pixels for click
    return distance < 4;
} 