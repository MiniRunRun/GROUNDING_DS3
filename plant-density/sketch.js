const url = 'https://raw.githubusercontent.com/cansik/p5js-pointcloud/master/data/forest-blk360_centered.ply';
const pointSize = 3.1;

// 自动旋转控制
let autoRotate = true;
let rotationSpeed = 0.003; 
let totalRotation = 2 * Math.PI; 

// 手动拖拽控制
let isDragging = false; 
let lastMouseX = 0;
let currentAngle = 0; 

// 分段显示容器
const totalSegments = 10; 
const segmentAngle = (2 * Math.PI) / totalSegments; 
let currentSegment = 0; 
let previousSegment = -1; 

var program, renderer;
var vertices = [];
var colors = [];

function setup() {
    renderer = createCanvas(windowWidth, windowHeight, WEBGL);
    camera(0, 0, 500);
    
    // 隐藏 HTML 中的静态文字
    const introText = document.getElementById('intro-text');
    if (introText) introText.classList.remove('active');
    
    // 禁用滚轮缩放
    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, { passive: false });

    // --- Shader Setup ---
    const vert = `
  attribute vec3 aPosition;
  attribute vec3 aColor;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
  varying vec4 color;
    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
        gl_PointSize = ${pointSize};
        color = vec4(aColor, 1.0);
    }
    `;
    const frag = `
    #ifdef GL_ES
    precision highp float;
    #endif
  varying vec4 color;
    void main() {
        gl_FragColor = color;
    }
    `;
    
    var vs = drawingContext.createShader(drawingContext.VERTEX_SHADER);
    drawingContext.shaderSource(vs, vert);
    drawingContext.compileShader(vs);
    var fs = drawingContext.createShader(drawingContext.FRAGMENT_SHADER);
    drawingContext.shaderSource(fs, frag);
    drawingContext.compileShader(fs);
    program = drawingContext.createProgram();
    drawingContext.attachShader(program, vs);
    drawingContext.attachShader(program, fs);
    drawingContext.linkProgram(program);
    drawingContext.useProgram(program);
    
    program.uModelViewMatrix = drawingContext.getUniformLocation(program, "uModelViewMatrix");
    program.uProjectionMatrix = drawingContext.getUniformLocation(program, "uProjectionMatrix");
    program.aPosition = drawingContext.getAttribLocation(program, "aPosition");
    drawingContext.enableVertexAttribArray(program.aPosition);
    program.aColor = drawingContext.getAttribLocation(program, "aColor");
    drawingContext.enableVertexAttribArray(program.aColor);
    
    // Load Data
    httpGet(url, 'text', function(response) {
        parsePointCloud(response, 2500, 0, 500, 0);
        
        program.positionBuffer = drawingContext.createBuffer();
        drawingContext.bindBuffer(drawingContext.ARRAY_BUFFER, program.positionBuffer);
        drawingContext.bufferData(drawingContext.ARRAY_BUFFER, new Float32Array(vertices), drawingContext.STATIC_DRAW);

        program.colorBuffer = drawingContext.createBuffer();
        drawingContext.bindBuffer(drawingContext.ARRAY_BUFFER, program.colorBuffer);
        drawingContext.bufferData(drawingContext.ARRAY_BUFFER, new Float32Array(colors), drawingContext.STATIC_DRAW);
    });
}

function draw() {
    background(107, 186, 255); 
    
    // 1. 计算角度
    if (autoRotate) {
        currentAngle += rotationSpeed;
        if (currentAngle >= totalRotation) {
            currentAngle = 0; 
        }
    } else if (isDragging) {
        let deltaX = mouseX - lastMouseX;
        currentAngle += deltaX * 0.005;
        lastMouseX = mouseX;
    }

    // 2. 计算当前段落
    let normalizedAngle = (currentAngle % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
    currentSegment = Math.floor(normalizedAngle / segmentAngle) % totalSegments;
    
    // 3. 更新容器状态
    if (currentSegment !== previousSegment) {
        updateContainers(currentSegment);
        previousSegment = currentSegment;
    }

    // 应用旋转并绘制
    rotateY(currentAngle);
    
    if(vertices.length == 0) return;
    
    drawingContext.useProgram(program);
    drawingContext.bindBuffer(drawingContext.ARRAY_BUFFER, program.positionBuffer);
    drawingContext.vertexAttribPointer(program.aPosition, 3, drawingContext.FLOAT, false, 0, 0);
    drawingContext.bindBuffer(drawingContext.ARRAY_BUFFER, program.colorBuffer);
    drawingContext.vertexAttribPointer(program.aColor, 3, drawingContext.FLOAT, false, 0, 0);
    drawingContext.uniformMatrix4fv(program.uModelViewMatrix, false, renderer.uMVMatrix.mat4);
    drawingContext.uniformMatrix4fv(program.uProjectionMatrix, false, renderer.uPMatrix.mat4);
    drawingContext.drawArrays(drawingContext.POINTS, 0, vertices.length/3);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function parsePointCloud(data, scale, xAdd, yAdd, zAdd) {
    let lines = data.split("\n");
    let header = true;
    for (var i = 0; i < lines.length - 1; i++) {
        if(lines[i].includes("end_header")) {
            header = false;
            continue;
        }
        if(!header) {
            let data = lines[i].split(" ");
            let x = parseFloat(data[0]);
            let y = -parseFloat(data[1]);
            let z = parseFloat(data[2]);
            if(isNaN(x) || isNaN(y) || isNaN(z)) continue;
            vertices.push(x * scale + xAdd);
            vertices.push(y * scale + yAdd);
            vertices.push(z * scale + zAdd);
            colors.push(1.0); colors.push(1.0); colors.push(1.0);
        }
    }
}

// 核心功能：控制容器显示
function updateContainers(segment) {
    // 1. 隐藏所有
    for (let i = 0; i < totalSegments; i++) {
        const topContainer = document.getElementById(`container-${i + 1}-top`);
        const bottomContainer = document.getElementById(`container-${i + 1}-bottom`);
        if (topContainer) topContainer.classList.remove('active');
        if (bottomContainer) bottomContainer.classList.remove('active');
    }

    // 2. 如果正在自动旋转，不显示任何新容器
    if (autoRotate) {
        return; 
    }
    
    // 3. 只有交互后才显示
    const currentTopContainer = document.getElementById(`container-${segment + 1}-top`);
    const currentBottomContainer = document.getElementById(`container-${segment + 1}-bottom`);
    
    if (currentTopContainer) currentTopContainer.classList.add('active');
    if (currentBottomContainer) currentBottomContainer.classList.add('active');
}

// 交互逻辑
function mousePressed() {
    autoRotate = false; 
    isDragging = true;
    lastMouseX = mouseX;
    updateContainers(currentSegment);
}

function mouseReleased() {
    isDragging = false;
}

function touchStarted() {
    autoRotate = false;
    isDragging = true;
    lastMouseX = touches[0].x;
    updateContainers(currentSegment);
    return false;
}

function touchEnded() {
    isDragging = false;
}

function touchMoved() {
    if(isDragging) {
        let deltaX = touches[0].x - lastMouseX;
        currentAngle += deltaX * 0.005;
        lastMouseX = touches[0].x;
    }
    return false;
}