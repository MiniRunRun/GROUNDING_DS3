# Soil Erosion Visualization - 5 Layer Interactive System

An interactive p5.js visualization that reveals 5 layers of content through mouse hover interaction.

## Features

- **5 Layers**: Progressive depth visualization with 5 distinct image layers
- **Mouse Hover Interaction**: Automatically digs deeper every 3 seconds while hovering
- **Grid-based Tracking**: Each area of the canvas independently tracks hover time
- **Visual Feedback**:
  - Cursor indicator shows brush size
  - Layer indicator dots show current depth
  - Smooth circular brush transitions

## How It Works

1. The canvas starts showing Layer 0 (the topmost layer)
2. Hover your mouse over any area
3. After 3 seconds of continuous hovering, that area reveals Layer 1
4. Keep hovering to dig through all 5 layers (0-4)
5. Different areas can be at different layer depths
6. The revealed areas remain visible permanently

## Controls

- **Mouse Hover**: Dig into layers at cursor position
- **Arrow Up**: Increase brush size
- **Arrow Down**: Decrease brush size
- **R Key**: Reset entire canvas to Layer 0

## Setup Instructions

### 1. Prepare Your Images

You need 5 images for the 5 layers. Place them in the `/assets/` folder:

```
/assets/
  ├── layer0.png  (topmost layer)
  ├── layer1.png
  ├── layer2.png
  ├── layer3.png
  └── layer4.png  (bottom layer)
```

### 2. Update Image Paths

Edit [sketch.js](sketch.js) in the `preload()` function (around line 21):

```javascript
function preload() {
  layers[0] = loadImage('/assets/layer0.png');
  layers[1] = loadImage('/assets/layer1.png');
  layers[2] = loadImage('/assets/layer2.png');
  layers[3] = loadImage('/assets/layer3.png');
  layers[4] = loadImage('/assets/layer4.png');
}
```

### 3. Run the Project

Open [index.html](index.html) in a web browser. For best results, use a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (if you have http-server installed)
npx http-server
```

Then open: `http://localhost:8000`

## Customization

### Adjust Timing

In [sketch.js](sketch.js), change the `LAYER_PROGRESSION_TIME` constant:

```javascript
const LAYER_PROGRESSION_TIME = 60; // 3 seconds at 20fps
// Increase for slower progression, decrease for faster
```

### Adjust Brush Size

Change the initial `brushRadius` variable:

```javascript
let brushRadius = 40; // Adjust this value (10-100 recommended)
```

### Adjust Grid Resolution

Change `gridSize` for hover tracking precision:

```javascript
let gridSize = 20; // Smaller = more precise, larger = better performance
```

## Technical Details

- **Framework**: p5.js
- **Canvas Size**: Responsive (windowWidth × 0.7 aspect ratio)
- **Frame Rate**: 20 FPS
- **Hover Grid**: Divides canvas into cells for independent layer tracking
- **Reveal Method**: Uses p5's `copy()` function with circular brush effect

## File Structure

```
soil erosion Visualization/
├── index.html          # Main HTML file
├── sketch.js           # p5.js sketch with all logic
├── assets/             # Image assets folder
│   ├── layer0.png
│   ├── layer1.png
│   ├── layer2.png
│   ├── layer3.png
│   └── layer4.png
└── README.md          # This file
```

## Credits

Based on the original 2-layer erosion visualization concept, expanded to 5 layers with enhanced hover interaction mechanics.
