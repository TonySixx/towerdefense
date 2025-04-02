// Map Editor for Tower Defense Game
import { TILE_SIZE, ROWS, COLS } from './constants.js';
import { getGridCoords, getCanvasCoords, createGrid } from './utils.js';

// Editor state
export const editorState = {
    isActive: false,
    editMode: 'path', // 'path', 'start', 'end', 'erase'
    grid: null,
    path: [],
    startPoint: null,
    endPoint: null,
    isDragging: false,
    lastPoint: null, // Track last point for continuous line drawing
    currentMapName: '',
    validationMessage: '',
    isValid: false
};

// Initialize the map editor
export function initEditor(existingMapName = null, existingMap = null) {
    editorState.isActive = true;
    editorState.grid = createGrid();
    editorState.path = [];
    editorState.startPoint = null;
    editorState.endPoint = null;
    editorState.isDragging = false;
    editorState.validationMessage = '';
    editorState.isValid = false;
    
    // Show editor UI
    document.getElementById('map-editor').style.display = 'flex';
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'none';
    
    // Reset editor canvas
    const canvas = document.getElementById('editorCanvas');
    canvas.width = COLS * TILE_SIZE;
    canvas.height = ROWS * TILE_SIZE;
    
    // Update editor header to show editing mode if applicable
    const editorHeader = document.querySelector('.editor-header h2');
    const saveButton = document.getElementById('save-map-btn');
    
    if (existingMap) {
        // Load existing map data
        editorState.currentMapName = existingMapName;
        
        // Find start and end points in the path
        let startIndex = -1;
        let endIndex = -1;
        
        // Load difficulty settings
        const difficultySelect = document.getElementById('difficulty-select');
        
        if (existingMap.startMoney === 150 && existingMap.startHealth === 25) {
            difficultySelect.value = 'easy';
        } else if (existingMap.startMoney === 90 && existingMap.startHealth === 15) {
            difficultySelect.value = 'hard';
        } else {
            difficultySelect.value = 'medium';
        }
        
        // Load map name
        document.getElementById('map-name').value = existingMapName;
        
        // Load path data
        for (const point of existingMap.path) {
            addPathTile(point.x, point.y);
        }
        
        // Check if the first point in the path is the start
        if (existingMap.path.length > 0) {
            setStartPoint(existingMap.path[0].x, existingMap.path[0].y);
            
            // Check if the last point in the path is the end
            if (existingMap.path.length > 1) {
                const lastPoint = existingMap.path[existingMap.path.length - 1];
                setEndPoint(lastPoint.x, lastPoint.y);
            }
        }
        
        // Update editor header and save button
        editorHeader.textContent = `Editing Map: ${existingMapName}`;
        saveButton.textContent = 'Update Map';
    } else {
        // Reset for new map creation
        editorState.currentMapName = '';
        document.getElementById('map-name').value = '';
        document.getElementById('difficulty-select').value = 'medium';
        
        // Update editor header and save button
        editorHeader.textContent = 'Map Editor';
        saveButton.textContent = 'Save Map';
    }
    
    // Initial render
    renderEditor();
}

// Handle editor mouse down event
export function handleEditorMouseDown(e) {
    const canvas = document.getElementById('editorCanvas');
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const { x: gridX, y: gridY } = getGridCoords(mouseX, mouseY);
    
    editorState.isDragging = true;
    editorState.lastPoint = { x: gridX, y: gridY }; // Initialize last point
    
    // Different actions based on edit mode
    switch(editorState.editMode) {
        case 'path':
            addPathTile(gridX, gridY);
            break;
        case 'start':
            setStartPoint(gridX, gridY);
            break;
        case 'end':
            setEndPoint(gridX, gridY);
            break;
        case 'erase':
            erasePathTile(gridX, gridY);
            break;
    }
    
    renderEditor();
    validatePath();
    updateValidationMessage();
}

// Handle editor mouse move event with line drawing
export function handleEditorMouseMove(e) {
    if (!editorState.isDragging) return;
    
    const canvas = document.getElementById('editorCanvas');
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const { x: gridX, y: gridY } = getGridCoords(mouseX, mouseY);
    
    // Get previous position
    const lastPoint = editorState.lastPoint || { x: gridX, y: gridY };
    
    // Different actions based on edit mode
    if (editorState.editMode === 'path') {
        // Use line algorithm to ensure continuous path
        const points = getPointsOnLine(lastPoint.x, lastPoint.y, gridX, gridY);
        for (const point of points) {
            addPathTile(point.x, point.y);
        }
    } else if (editorState.editMode === 'erase') {
        // Use line algorithm for erasing too
        const points = getPointsOnLine(lastPoint.x, lastPoint.y, gridX, gridY);
        for (const point of points) {
            erasePathTile(point.x, point.y);
        }
    }
    
    // Update last point
    editorState.lastPoint = { x: gridX, y: gridY };
    
    renderEditor();
    validatePath();
    updateValidationMessage();
}

// Handle editor mouse up event
export function handleEditorMouseUp() {
    editorState.isDragging = false;
    editorState.lastPoint = null; // Clear last point
    validatePath();
    updateValidationMessage();
}

// Add a tile to the path
function addPathTile(gridX, gridY) {
    // Check if coordinates are valid
    if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return;
    
    // Check if position already exists in path
    const exists = editorState.path.some(point => point.x === gridX && point.y === gridY);
    if (exists) return;
    
    // Check for crossings by examining neighbors
    // Each cell should not have more than 2 adjacent path cells unless it's at the end of a path
    const adjacentPathCells = countAdjacentPathCells(gridX, gridY);
    
    // If this would create a crossing point (more than 2 adjacent path cells), don't add it
    if (adjacentPathCells > 2) {
        return; // This would create a crossing, so don't add it
    }
    
    // Add to path
    editorState.path.push({ x: gridX, y: gridY });
    
    // Update grid
    editorState.grid[gridY][gridX].isPath = true;
}

// Count adjacent path cells to detect potential crossings
function countAdjacentPathCells(x, y) {
    let count = 0;
    const adjacentCells = [
        { x: x + 1, y: y },
        { x: x - 1, y: y },
        { x: x, y: y + 1 },
        { x: x, y: y - 1 }
    ];
    
    for (const cell of adjacentCells) {
        if (cell.x >= 0 && cell.x < COLS && cell.y >= 0 && cell.y < ROWS) {
            if (editorState.grid[cell.y][cell.x].isPath) {
                count++;
            }
        }
    }
    
    return count;
}

// Set start point
function setStartPoint(gridX, gridY) {
    // Check if coordinates are valid
    if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return;
    
    // Check if this position is in the path
    const pathIndex = editorState.path.findIndex(point => point.x === gridX && point.y === gridY);
    if (pathIndex === -1) return; // Can only set start on a path tile
    
    editorState.startPoint = { x: gridX, y: gridY };
}

// Set end point
function setEndPoint(gridX, gridY) {
    // Check if coordinates are valid
    if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return;
    
    // Check if this position is in the path
    const pathIndex = editorState.path.findIndex(point => point.x === gridX && point.y === gridY);
    if (pathIndex === -1) return; // Can only set end on a path tile
    
    editorState.endPoint = { x: gridX, y: gridY };
}

// Erase a tile from the path
function erasePathTile(gridX, gridY) {
    // Check if coordinates are valid
    if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return;
    
    // If it's the start or end point, clear that too
    if (editorState.startPoint && editorState.startPoint.x === gridX && editorState.startPoint.y === gridY) {
        editorState.startPoint = null;
    }
    
    if (editorState.endPoint && editorState.endPoint.x === gridX && editorState.endPoint.y === gridY) {
        editorState.endPoint = null;
    }
    
    // Remove from path
    const pathIndex = editorState.path.findIndex(point => point.x === gridX && point.y === gridY);
    if (pathIndex !== -1) {
        editorState.path.splice(pathIndex, 1);
        // Update grid
        editorState.grid[gridY][gridX].isPath = false;
    }
}

// Check if the path is continuous (no gaps)
function isPathContinuous() {
    if (editorState.path.length < 2) return false;
    if (!editorState.startPoint || !editorState.endPoint) return false;
    
    // Create a graph representation of the path
    const graph = {};
    for (const point of editorState.path) {
        const key = `${point.x},${point.y}`;
        graph[key] = [];
    }
    
    // Add edges between adjacent points
    for (const point of editorState.path) {
        const key = `${point.x},${point.y}`;
        
        // Check 4 adjacent cells
        const adjacent = [
            { x: point.x + 1, y: point.y },
            { x: point.x - 1, y: point.y },
            { x: point.x, y: point.y + 1 },
            { x: point.x, y: point.y - 1 }
        ];
        
        for (const adj of adjacent) {
            const adjKey = `${adj.x},${adj.y}`;
            if (graph[adjKey]) {
                graph[key].push(adjKey);
            }
        }
    }
    
    // Use BFS to check if there is a path from start to end
    const startKey = `${editorState.startPoint.x},${editorState.startPoint.y}`;
    const endKey = `${editorState.endPoint.x},${editorState.endPoint.y}`;
    
    const visited = new Set();
    const queue = [startKey];
    visited.add(startKey);
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        if (current === endKey) {
            return true; // Found path from start to end
        }
        
        const neighbors = graph[current] || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }
    
    return false; // No path found from start to end
}

// Bresenham's line algorithm to get all points on a line
function getPointsOnLine(x0, y0, x1, y1) {
    const points = [];
    
    // Ensure x0,y0 and x1,y1 are valid
    if (
        x0 < 0 || x0 >= COLS || y0 < 0 || y0 >= ROWS ||
        x1 < 0 || x1 >= COLS || y1 < 0 || y1 >= ROWS
    ) {
        return points;
    }
    
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    
    while (true) {
        points.push({ x: x0, y: y0 });
        
        if (x0 === x1 && y0 === y1) break;
        
        const e2 = 2 * err;
        if (e2 > -dy) {
            if (x0 === x1) break;
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            if (y0 === y1) break;
            err += dx;
            y0 += sy;
        }
    }
    
    return points;
}

// Validate the current path
export function validatePath() {
    if (editorState.path.length < 2) {
        editorState.validationMessage = 'Path must have at least 2 points';
        editorState.isValid = false;
        return false;
    }
    
    if (!editorState.startPoint) {
        editorState.validationMessage = 'Start point must be set';
        editorState.isValid = false;
        return false;
    }
    
    if (!editorState.endPoint) {
        editorState.validationMessage = 'End point must be set';
        editorState.isValid = false;
        return false;
    }
    
    if (!isPathContinuous()) {
        editorState.validationMessage = 'Path must be continuous from start to end';
        editorState.isValid = false;
        return false;
    }
    
    // Check for crossings in the path
    if (hasPathCrossings()) {
        editorState.validationMessage = 'Path cannot cross itself';
        editorState.isValid = false;
        return false;
    }
    
    editorState.validationMessage = 'Path is valid';
    editorState.isValid = true;
    return true;
}

// Check if the path has any crossings
function hasPathCrossings() {
    // For each path cell that's not a start or end point, 
    // check that it doesn't have more than 2 adjacent path cells
    for (const point of editorState.path) {
        // Skip start and end points as they can have only one adjacent path cell
        if ((editorState.startPoint && point.x === editorState.startPoint.x && point.y === editorState.startPoint.y) ||
            (editorState.endPoint && point.x === editorState.endPoint.x && point.y === editorState.endPoint.y)) {
            continue;
        }
        
        // Count adjacent path cells
        let adjacentPathCells = 0;
        const adjacentCells = [
            { x: point.x + 1, y: point.y },
            { x: point.x - 1, y: point.y },
            { x: point.x, y: point.y + 1 },
            { x: point.x, y: point.y - 1 }
        ];
        
        for (const cell of adjacentCells) {
            if (editorState.path.some(p => p.x === cell.x && p.y === cell.y)) {
                adjacentPathCells++;
            }
        }
        
        // If more than 2 adjacent path cells, it's a crossing
        if (adjacentPathCells > 2) {
            return true;
        }
    }
    
    return false;
}

// Save the map to localStorage
export function saveMap(mapName) {
    if (!validatePath()) return false;
    
    // Create map object
    const map = {
        name: mapName,
        path: editorState.path,
        startMoney: 100, // Default values, could be customizable
        startHealth: 20,
        enemyHealthModifier: 1.0,
        waveModifier: 1.0
    };
    
    // Get existing custom maps
    const customMaps = getCustomMaps();
    
    // Add or update map
    customMaps[mapName] = map;
    
    // Save to localStorage
    localStorage.setItem('towerDefenseCustomMaps', JSON.stringify(customMaps));
    
    return true;
}

// Get all custom maps from localStorage
export function getCustomMaps() {
    const maps = localStorage.getItem('towerDefenseCustomMaps');
    return maps ? JSON.parse(maps) : {};
}

// Delete a custom map
export function deleteMap(mapName) {
    const customMaps = getCustomMaps();
    
    if (customMaps[mapName]) {
        delete customMaps[mapName];
        localStorage.setItem('towerDefenseCustomMaps', JSON.stringify(customMaps));
        return true;
    }
    
    return false;
}

// Order path from start to end (important for enemy movement)
export function orderPathFromStartToEnd() {
    if (!editorState.startPoint || !editorState.endPoint || editorState.path.length < 2) {
        return editorState.path; // Return original path if invalid
    }
    
    // Create a graph representation of the path
    const graph = {};
    for (const point of editorState.path) {
        const key = `${point.x},${point.y}`;
        graph[key] = [];
    }
    
    // Add edges between adjacent points
    for (const point of editorState.path) {
        const key = `${point.x},${point.y}`;
        
        // Check 4 adjacent cells
        const adjacent = [
            { x: point.x + 1, y: point.y },
            { x: point.x - 1, y: point.y },
            { x: point.x, y: point.y + 1 },
            { x: point.x, y: point.y - 1 }
        ];
        
        for (const adj of adjacent) {
            const adjKey = `${adj.x},${adj.y}`;
            if (graph[adjKey]) {
                graph[key].push({ key: adjKey, x: adj.x, y: adj.y });
            }
        }
    }
    
    // Use BFS to find the shortest path from start to end
    const startKey = `${editorState.startPoint.x},${editorState.startPoint.y}`;
    const endKey = `${editorState.endPoint.x},${editorState.endPoint.y}`;
    
    const visited = new Set();
    const queue = [{ key: startKey, path: [editorState.startPoint] }];
    visited.add(startKey);
    
    while (queue.length > 0) {
        const { key, path } = queue.shift();
        
        if (key === endKey) {
            return path; // Found path from start to end
        }
        
        const neighbors = graph[key] || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor.key)) {
                visited.add(neighbor.key);
                queue.push({ 
                    key: neighbor.key, 
                    path: [...path, { x: neighbor.x, y: neighbor.y }] 
                });
            }
        }
    }
    
    return editorState.path; // Return original path if no path found
}

// Render the editor
export function renderEditor() {
    const canvas = document.getElementById('editorCanvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#2a2d34';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
    
    // Draw path
    for (const point of editorState.path) {
        ctx.fillStyle = 'rgba(107, 107, 138, 0.7)';
        ctx.fillRect(point.x * TILE_SIZE, point.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
    
    // Draw start point
    if (editorState.startPoint) {
        const { x, y } = editorState.startPoint;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        // Draw "S" label
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
    }
    
    // Draw end point
    if (editorState.endPoint) {
        const { x, y } = editorState.endPoint;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        // Draw "E" label
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('E', x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
    }
}

// Update validation message in UI
export function updateValidationMessage() {
    const validationMsg = document.getElementById('validation-message');
    if (!validationMsg) return;
    
    validationMsg.textContent = editorState.validationMessage;
    
    if (editorState.isValid) {
        validationMsg.className = 'validation-message valid';
    } else {
        validationMsg.className = 'validation-message invalid';
    }
}

// Exit editor mode
export function exitEditor() {
    editorState.isActive = false;
    document.getElementById('map-editor').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
} 