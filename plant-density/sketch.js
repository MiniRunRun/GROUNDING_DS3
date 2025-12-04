const url = 'https://raw.githubusercontent.com/cansik/p5js-pointcloud/master/data/forest-blk360_centered.ply';
const pointSize = 3.1;

// 自动旋转控制变量
let autoRotate = true;
let rotationAngle = 0;
let rotationSpeed = 0.003; 
let totalRotation = 2 * Math.PI; 

// 手动拖拽控制
let isDragging = false; 
let lastMouseX = 0;
let currentAngle = 0; // 统一使用这个变量控制当前最终角度

// 分段显示容器
const totalSegments = 10; 
const segmentAngle = (2 * Math.PI) / totalSegments; 
let currentSegment = 0; 
let previousSegment = -1; 

// 渐变颜色定义 (保留原样)
const gradientColors = [
  {r: 0x14/255, g: 0x61/255, b: 0x51/255}, 
  {r: 0x29/255, g: 0xA6/255, b: 0x4F/255}, 
  {r: 0xB4/255, g: 0xCE/255, b: 0x65/255}, 
  {r: 0xDC/255, g: 0xE5/255, b: 0x28/255}, 
  {r: 0xFE/255, g: 0x59/255, b: 0x33/255}  
];

var program, renderer;
var vertices = [];
var colors = [];

function setup() {
    renderer = createCanvas(windowWidth, windowHeight, WEBGL);
    camera(0, 0, 500);
    
    // 隐藏介绍文字
    const introText = document.getElementById('intro-text');
    if (introText) {
        introText.classList.remove('active');
    }
    
    // 禁用滚轮
    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, { passive: false });

    // Shader Setup (保留原样)
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
    
    if (!drawingContext.getShaderParameter(vs, drawingContext.COMPILE_STATUS))
        console.log(drawingContext.getShaderInfoLog(vs));
    if (!drawingContext.getShaderParameter(fs, drawingContext.COMPILE_STATUS))
        console.log(drawingContext.getShaderInfoLog(fs));
    if (!drawingContext.getProgramParameter(program, drawingContext.LINK_STATUS))
        console.log(drawingContext.getProgramInfoLog(program));
    
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
    
    // 逻辑修正：统一处理旋转
    if (autoRotate) {
        currentAngle += rotationSpeed;
        
        // 检查是否自动完成一圈
        if (currentAngle >= totalRotation) {
            currentAngle = 0; 
            autoRotate = false; // 停止自动旋转
            
            // 自动旋转结束后，强制显示第一组
            currentSegment = 0;
            updateContainers(currentSegment);
            previousSegment = currentSegment;
        }
    } else if (isDragging) {
        // 拖拽逻辑
        let deltaX = mouseX - lastMouseX;
        currentAngle += deltaX * 0.005; // 调整灵敏度
        lastMouseX = mouseX;
    }

    // --- 关键：实时计算段落 (无论是自动还是拖拽) ---
    // 规范化角度到 0 ~ 2PI 之间，处理负数情况
    let normalizedAngle = (currentAngle % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
    
    // 计算当前属于第几段
    currentSegment = Math.floor(normalizedAngle / segmentAngle) % totalSegments;
    
    // 状态检测：只有当段落发生变化，或者正在拖拽时，才去更新容器
    // 这样可以确保拖拽时容器实时响应
    if (currentSegment !== previousSegment) {
        updateContainers(currentSegment);
        previousSegment = currentSegment;
    }

    // 应用旋转
    rotateY(currentAngle);
    
    // 绘制点云
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

// 容器更新函数
function updateContainers(segment) {
    // 隐藏所有容器
    for (let i = 0; i < totalSegments; i++) {
        const topContainer = document.getElementById(`container-${i + 1}-top`);
        const bottomContainer = document.getElementById(`container-${i + 1}-bottom`);
        if (topContainer) topContainer.classList.remove('active');
        if (bottomContainer) bottomContainer.classList.remove('active');
    }
    
    // 显示当前段落的容器
    const currentTopContainer = document.getElementById(`container-${segment + 1}-top`);
    const currentBottomContainer = document.getElementById(`container-${segment + 1}-bottom`);
    
    // 只有在非自动旋转模式，或者自动旋转模式下完成初始化后才显示
    // (如果你希望一开始转的时候就显示，可以去掉这个 if check)
    if (currentTopContainer) currentTopContainer.classList.add('active');
    if (currentBottomContainer) currentBottomContainer.classList.add('active');
}

// --- 鼠标交互核心修复 ---

function mousePressed() {
    // 无论何时按下鼠标，都立即：
    // 1. 停止自动旋转
    // 2. 开始拖拽状态
    // 3. 记录当前鼠标位置
    autoRotate = false; 
    isDragging = true;
    lastMouseX = mouseX;
}

function mouseReleased() {
    isDragging = false;
}

// 增加触摸支持 (手机/平板)
function touchStarted() {
    autoRotate = false;
    isDragging = true;
    lastMouseX = touches[0].x;
    // 防止触摸时触发默认滚动行为
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