// Store data structures
let faces = [];
let items = [];
let storeLayout = null;

// UI elements
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');
const itemList = document.getElementById('itemList');
const loadButton = document.getElementById('loadButton');
const verticesFile = document.getElementById('verticesFile');
const itemsFile = document.getElementById('itemsFile');
const uploadError = document.getElementById('uploadError');

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

// File handling
let verticesData = null;
let itemsData = null;

// Add this variable to track the timeout
let tooltipTimeout = null;

// Event listeners for file inputs
verticesFile.addEventListener('change', handleVerticesFile);
itemsFile.addEventListener('change', handleItemsFile);
loadButton.addEventListener('click', initializeMap);

function handleVerticesFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                verticesData = JSON.parse(e.target.result);
                console.log('Loaded vertices data:', verticesData);
                checkFiles();
            } catch (error) {
                uploadError.textContent = 'Invalid vertices.json file format';
                verticesData = null;
                checkFiles();
            }
        };
        reader.readAsText(file);
    }
}

function handleItemsFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                itemsData = parseCSV(e.target.result);
                console.log('Loaded items data (first 3):', JSON.stringify(itemsData.slice(0, 3), null, 2));
                checkFiles();
            } catch (error) {
                console.error('Error parsing CSV:', error);
                uploadError.textContent = 'Invalid items.csv file format';
                itemsData = null;
                checkFiles();
            }
        };
        reader.readAsText(file);
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Create a map to group items by face_id
    const itemsByFace = {};
    
    lines.slice(1).forEach(line => {
        const values = line.split(',').map(v => v.trim());
        const item = {};
        headers.forEach((header, i) => {
            item[header] = values[i];
        });
        
        // Group items by face_id
        if (!itemsByFace[item.face_id]) {
            itemsByFace[item.face_id] = {
                face_id: item.face_id,
                section_name: item.section_name,
                category: item.category,
                items: []
            };
        }
        itemsByFace[item.face_id].items.push(item);
    });
    
    // Convert the map to an array
    return Object.values(itemsByFace);
}

function checkFiles() {
    loadButton.disabled = !(verticesData && itemsData);
    uploadError.textContent = '';
}

function initializeMap() {
    try {
        // Set the store layout
        storeLayout = verticesData;
        items = itemsData;
        
        // Generate faces from vertices
        generateFaces();
        
        // Show the map and item display
        canvas.style.display = 'block';
        itemDisplay.style.display = 'block';
        
        // Initial render
        drawMap();
        
        console.log('Available face IDs:', faces.map(f => f.face_id));
        console.log('Available items face IDs:', [...new Set(items.map(i => i.face_id))]);
        
    } catch (error) {
        console.error('Error in initializeMap:', error);
        uploadError.textContent = 'Error initializing map: ' + error.message;
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

// Draw the store map
function drawMap(highlightedFace = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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

// Handle mouse move for hover effect
function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
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
function handleClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find the face under the cursor with a 3-pixel buffer
    const face = faces.find(f => {
        const A = x - f.start_x;
        const B = y - f.start_y;
        const C = f.end_x - f.start_x;
        const D = f.end_y - f.start_y;
        
        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        
        if (len_sq !== 0) {
            param = dot / len_sq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = f.start_x;
            yy = f.start_y;
        } else if (param > 1) {
            xx = f.end_x;
            yy = f.end_y;
        } else {
            xx = f.start_x + param * C;
            yy = f.start_y + param * D;
        }
        
        const dx = x - xx;
        const dy = y - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < 3;
    });
    
    if (face) {
        displayItems(face.face_id);
    }
}

// Display items for selected face
function displayItems(faceId) {
    const itemList = document.getElementById('itemList');
    const itemDisplay = document.getElementById('itemDisplay');
    
    // Find items for the selected face
    const faceItems = items.find(item => item.face_id === faceId);
    
    if (faceItems && faceItems.items && faceItems.items.length > 0) {
        // Create a list of items
        const itemsHTML = faceItems.items.map(item => `
            <div class="item">
                <h3>${item.item_name}</h3>
                <p>Category: ${item.category}</p>
                <p>Price: $${item.price}</p>
            </div>
        `).join('');
        
        itemList.innerHTML = itemsHTML;
    } else {
        // Always show a message for empty sections
        itemList.innerHTML = '<p>There are no items in this section</p>';
    }
    
    // Make sure the display is visible
    itemDisplay.style.display = 'block';
}

// Update the event listeners
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('click', handleClick); 