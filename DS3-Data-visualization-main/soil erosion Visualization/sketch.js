// 5-Layer Erosion Visualization System
// Drag mouse to reveal next layer
// Green rectangles appear as animation on hover

// Layer images array (from top to bottom)
let layers = [];

// Brush settings - will be randomized for each reveal
let minBrushWidth = 10;
let maxBrushWidth = 60;
let minBrushHeight = 10;
let maxBrushHeight = 60;

// Canvas to store the current revealed state
let revealCanvas;

// Grid to track which layer is visible at each position
let layerGrid = [];
let gridSize = 20; // Size of each grid cell for tracking layer

// Track which cells have been dragged this frame to prevent multiple reveals per drag
let draggedCells = new Set();

// Green animation rectangles
let greenRects = [];
const GREEN_ANIMATION_INTERVAL = 4; // Show green rect every 0.2 seconds
let greenAnimationTimer = 0;

function preload() {
  // Load 5 layers of images from assets folder
  // Layer 0 (top) to Layer 4 (bottom)
  layers[0] = loadImage('assets/1.jpg');
  layers[1] = loadImage('assets/2.png');
  layers[2] = loadImage('assets/3.jpg');
  layers[3] = loadImage('assets/4.JPG');
  layers[4] = loadImage('assets/5.JPG');

  // Load cursor image (optional)
  // cursorImg = loadImage('glass.png');
}

function setup() {
  describe('A 5-layer interactive visualization that reveals deeper layers on mouse drag');

  // Create fullscreen canvas
  createCanvas(windowWidth, windowHeight);

  // Hide cursor
  noCursor();

  // Resize all layer images
  for (let i = 0; i < layers.length; i++) {
    layers[i].resize(width, height);
  }

  // Create a graphics buffer to store the revealed state
  revealCanvas = createGraphics(width, height);

  // Set willReadFrequently for better performance with frequent copy operations
  revealCanvas.drawingContext.willReadFrequently = true;

  // Initialize layer grid
  let cols = Math.ceil(width / gridSize);
  let rows = Math.ceil(height / gridSize);

  for (let x = 0; x < cols; x++) {
    layerGrid[x] = [];
    for (let y = 0; y < rows; y++) {
      layerGrid[x][y] = {
        currentLayer: 0 // Track which layer is currently visible
      };
    }
  }

  // Set initial state - show orange background with text
  revealCanvas.background('#ff4200');

  // Draw "drag here" text in the center
  revealCanvas.push();
  revealCanvas.fill(255);
  revealCanvas.textAlign(CENTER, CENTER);
  revealCanvas.textSize(48);
  revealCanvas.textFont('Arial');
  revealCanvas.text('drag here', width / 2, height / 2);
  revealCanvas.pop();

  frameRate(20);
}

function draw() {
  // Display the current reveal canvas state
  image(revealCanvas, 0, 0);

  // Update layer indicator based on mouse position
  updateLayerIndicatorByMousePosition();

  // Draw green animation rectangles on hover
  greenAnimationTimer++;
  if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
    if (greenAnimationTimer >= GREEN_ANIMATION_INTERVAL) {
      greenAnimationTimer = 0;
      addGreenRect(mouseX, mouseY);
    }
  }

  // Draw and update green rectangles
  drawGreenRects();

  // Draw cursor indicator
  drawCursorIndicator();
}

function mouseDragged() {
  // Calculate grid position
  let gridX = Math.floor(mouseX / gridSize);
  let gridY = Math.floor(mouseY / gridSize);

  // Create unique cell ID
  let cellID = `${gridX},${gridY}`;

  // Ensure grid position is valid and this cell hasn't been dragged yet in this drag session
  if (gridX >= 0 && gridX < layerGrid.length &&
      gridY >= 0 && gridY < layerGrid[0].length &&
      !draggedCells.has(cellID)) {

    let cell = layerGrid[gridX][gridY];

    // Get the next layer to reveal (the one underneath)
    let nextLayerIndex = cell.currentLayer + 1;

    // Only reveal if there's a next layer available
    // Layer 0 is visible initially, dragging reveals layer 1, then 2, etc.
    if (nextLayerIndex < layers.length) {
      // Erase current layer by copying the next layer underneath
      revealNextLayer(mouseX, mouseY, nextLayerIndex);

      // Mark this cell as dragged
      draggedCells.add(cellID);
    }
  }
}

function mouseReleased() {
  // When mouse is released, update all dragged cells to next layer
  draggedCells.forEach(cellID => {
    let [gridX, gridY] = cellID.split(',').map(Number);
    if (gridX >= 0 && gridX < layerGrid.length &&
        gridY >= 0 && gridY < layerGrid[0].length) {
      layerGrid[gridX][gridY].currentLayer++;
    }
  });

  // Clear dragged cells for next drag session
  draggedCells.clear();
}

function addGreenRect(x, y) {
  // Generate random width and height
  let w = random(minBrushWidth, maxBrushWidth);
  let h = random(minBrushHeight, maxBrushHeight);

  // Generate random offset
  let offsetX = random(-5, 5);
  let offsetY = random(-5, 5);

  // Add new green rectangle
  greenRects.push({
    x: x + offsetX,
    y: y + offsetY,
    w: w,
    h: h,
    alpha: 255,
    life: 20 // Frames to live
  });
}

function drawGreenRects() {
  // Draw all green rectangles and remove them after a set time
  push();
  noStroke();

  for (let i = greenRects.length - 1; i >= 0; i--) {
    let r = greenRects[i];

    // Draw green rectangle with full opacity (no fading)
    fill(0, 255, 0);
    rect(r.x, r.y, r.w, r.h);

    // Decrease life
    r.life--;

    // Remove if dead (directly disappear)
    if (r.life <= 0) {
      greenRects.splice(i, 1);
    }
  }

  pop();
}

function revealNextLayer(x, y, layerIndex) {
  // Generate random width and height separately for rectangular reveal
  let randomWidth = random(minBrushWidth, maxBrushWidth);
  let randomHeight = random(minBrushHeight, maxBrushHeight);

  // Generate random offset to make position vary slightly
  let offsetX = random(-5, 5);
  let offsetY = random(-5, 5);

  let revealX = x + offsetX;
  let revealY = y + offsetY;

  // Copy from the actual image layer to the reveal canvas
  revealCanvas.copy(
    layers[layerIndex],
    revealX, revealY, randomWidth, randomHeight,
    revealX, revealY, randomWidth, randomHeight
  );
}

function drawCursorIndicator() {
  // Draw a simple circle cursor with average brush size
  let avgBrushWidth = (minBrushWidth + maxBrushWidth) / 2;
  let avgBrushHeight = (minBrushHeight + maxBrushHeight) / 2;
  let avgSize = (avgBrushWidth + avgBrushHeight) / 2;

  push();
  noFill();
  stroke(255, 200);
  strokeWeight(2);
  circle(mouseX, mouseY, avgSize);
  pop();
}

function updateLayerIndicatorByMousePosition() {
  // Get current layer at mouse position
  if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
    let gridX = Math.floor(mouseX / gridSize);
    let gridY = Math.floor(mouseY / gridSize);

    if (gridX >= 0 && gridX < layerGrid.length &&
        gridY >= 0 && gridY < layerGrid[0].length) {

      let currentLayer = layerGrid[gridX][gridY].currentLayer;

      // Update UI to show only the current layer at mouse position
      let layerTexts = document.querySelectorAll('.layer-text');
      layerTexts.forEach((text, index) => {
        if (index === currentLayer) {
          text.classList.add('active');
        } else {
          text.classList.remove('active');
        }
      });
    }
  }
}

function updateLayerIndicator(layer) {
  // Update the UI layer indicator text (used during drag)
  let layerTexts = document.querySelectorAll('.layer-text');
  layerTexts.forEach((text, index) => {
    if (index === layer) {
      text.classList.add('active');
    } else {
      text.classList.remove('active');
    }
  });
}

function windowResized() {
  // Handle window resize to fullscreen
  resizeCanvas(windowWidth, windowHeight);

  // Resize all layers
  for (let i = 0; i < layers.length; i++) {
    layers[i].resize(width, height);
  }

  // Recreate reveal canvas
  revealCanvas = createGraphics(width, height);

  // Set willReadFrequently for better performance
  revealCanvas.drawingContext.willReadFrequently = true;

  // Redraw orange background with text
  revealCanvas.background('#ff4200');
  revealCanvas.push();
  revealCanvas.fill(255);
  revealCanvas.textAlign(CENTER, CENTER);
  revealCanvas.textSize(48);
  revealCanvas.textFont('Arial');
  revealCanvas.text('drag here', width / 2, height / 2);
  revealCanvas.pop();

  // Reinitialize layer grid
  let cols = Math.ceil(width / gridSize);
  let rows = Math.ceil(height / gridSize);

  layerGrid = [];
  for (let x = 0; x < cols; x++) {
    layerGrid[x] = [];
    for (let y = 0; y < rows; y++) {
      layerGrid[x][y] = {
        currentLayer: 0
      };
    }
  }
}

// Optional: Add keyboard controls for testing
function keyPressed() {
  if (key === 'r' || key === 'R') {
    // Reset to initial state - orange background with text
    revealCanvas.background('#ff4200');
    revealCanvas.push();
    revealCanvas.fill(255);
    revealCanvas.textAlign(CENTER, CENTER);
    revealCanvas.textSize(48);
    revealCanvas.textFont('Arial');
    revealCanvas.text('drag here', width / 2, height / 2);
    revealCanvas.pop();

    // Reset layer grid
    for (let x = 0; x < layerGrid.length; x++) {
      for (let y = 0; y < layerGrid[0].length; y++) {
        layerGrid[x][y].currentLayer = 0;
      }
    }

    // Clear green rectangles
    greenRects = [];

    // Reset layer indicator
    let layerTexts = document.querySelectorAll('.layer-text');
    layerTexts.forEach((text, index) => {
      if (index === 0) {
        text.classList.add('active');
      } else {
        text.classList.remove('active');
      }
    });
  }

  // Adjust brush size with arrow keys
  if (keyCode === UP_ARROW) {
    maxBrushWidth = min(maxBrushWidth + 5, 100);
    maxBrushHeight = min(maxBrushHeight + 5, 100);
  } else if (keyCode === DOWN_ARROW) {
    minBrushWidth = max(minBrushWidth - 5, 5);
    minBrushHeight = max(minBrushHeight - 5, 5);
  }
}
