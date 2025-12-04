// Animation configuration
const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 300;
const GLOBAL_SPEED = 2.5; // Increased speed

// Monochrome fill function
function MONOCHROME_FILL(opacity) {
    return `rgba(255, 255, 255, ${opacity})`;
}

// Easing function
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Create canvas in a card element
function createCanvasInCard(cardElement) {
    // Remove any existing canvas
    const existingCanvas = cardElement.querySelector('.reveal-canvas');
    if (existingCanvas) {
        existingCanvas.remove();
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'reveal-canvas';
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Style the canvas to cover the card
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '5';

    cardElement.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    return ctx;
}

// Crystalline Refraction animation
function playCrystallineRefraction(cardElement, duration = 600) {
    const ctx = createCanvasInCard(cardElement);
    if (!ctx) return;

    let time = 0;
    let lastTime = 0;
    let animationId = null;
    const startTime = performance.now();

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const gridSize = 12; // Reduced grid size
    const spacing = CANVAS_WIDTH / (gridSize - 1);
    const squares = [];

    // Create grid of square positions
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            squares.push({ x: c * spacing, y: r * spacing });
        }
    }

    function animate(timestamp) {
        // Check if animation should stop
        if (timestamp - startTime >= duration) {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            const canvas = cardElement.querySelector('.reveal-canvas');
            if (canvas) {
                canvas.remove();
            }
            return;
        }

        if (!lastTime) lastTime = timestamp;
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        time += deltaTime * 0.16 * GLOBAL_SPEED;

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const waveRadius = time % (CANVAS_WIDTH * 1.2);
        const waveWidth = 80;

        squares.forEach((square) => {
            const dist = Math.hypot(square.x - centerX, square.y - centerY);
            const distToWave = Math.abs(dist - waveRadius);
            let displacement = 0;

            if (distToWave < waveWidth / 2) {
                const wavePhase = (distToWave / (waveWidth / 2)) * Math.PI;
                displacement = easeInOutCubic(Math.sin(wavePhase)) * 12;
            }

            const angleToCenter = Math.atan2(square.y - centerY, square.x - centerX);
            const dx = Math.cos(angleToCenter) * displacement;
            const dy = Math.sin(angleToCenter) * displacement;
            const opacity = 0.3 + (Math.abs(displacement) / 12) * 0.7;
            const size = 2 + (Math.abs(displacement) / 12) * 4;

            // Draw square instead of circle
            ctx.fillStyle = MONOCHROME_FILL(opacity);
            ctx.fillRect(square.x + dx - size/2, square.y + dy - size/2, size, size);
        });

        animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);

    // Store animation ID for cleanup
    cardElement._animationId = animationId;
}

// Export for use in other files
window.playCrystallineRefraction = playCrystallineRefraction;


