const url = 'https://raw.githubusercontent.com/cansik/p5js-pointcloud/master/data/forest-blk360_centered.ply';
const pointSize = 3.1;

// 自动旋转控制变量
let autoRotate = true;
let rotationAngle = 0;
let rotationSpeed = 0.01; // 初始旋转速度 - 较快
let totalRotation = 2 * Math.PI; // 完整一圈
let rotationComplete = false; // 初始旋转是否完成
let isDragging = false; // 是否正在拖拽

// 手动拖拽控制
let lastMouseX = 0;
let manualRotationAngle = 0; // 手动旋转的累积角度

// 分段显示容器
const totalSegments = 10; // 总共10个段落
const segmentAngle = (2 * Math.PI) / totalSegments; // 每段角度
let currentSegment = 0; // 当前段落
let previousSegment = -1; // 上一个段落

// 渐变颜色定义
const gradientColors = [
  {r: 0x14/255, g: 0x61/255, b: 0x51/255}, // #146151 深绿
  {r: 0x29/255, g: 0xA6/255, b: 0x4F/255}, // #29A64F 绿色
  {r: 0xB4/255, g: 0xCE/255, b: 0x65/255}, // #B4CE65 黄绿
  {r: 0xDC/255, g: 0xE5/255, b: 0x28/255}, // #DCE528 黄色
  {r: 0xFE/255, g: 0x59/255, b: 0x33/255}  // #FE5933 橙色
];

var program, renderer;
var vertices = [];
var colors = [];

function setup() {
	renderer = createCanvas(windowWidth, windowHeight, WEBGL);
	
	// 设置初始camera距离
	camera(0, 0, 500);
	
	// 隐藏介绍文字（初始不显示）
	const introText = document.getElementById('intro-text');
	if (introText) {
		introText.classList.remove('active');
	}
	
	// 禁用鼠标滚轮事件来禁用zoom
	canvas.addEventListener('wheel', function(e) {
		e.preventDefault();
		e.stopPropagation();
		return false;
	}, { passive: false });
	const vert = `
  attribute vec3 aPosition;
  attribute vec3 aColor;

	// matrices
	uniform mat4 uModelViewMatrix;
	uniform mat4 uProjectionMatrix;

  varying vec4 color;

	void main() {
		gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
		gl_PointSize = ${pointSize};
		color = vec4(aColor, 1.0);
	}
	`
	
	const frag = `
	#ifdef GL_ES
	precision highp float;
	#endif

  varying vec4 color;

	void main() {
		gl_FragColor = color;
	}
	`
	
	//load shader
	var vs = drawingContext.createShader(drawingContext.VERTEX_SHADER);
	drawingContext.shaderSource(vs, vert);
	drawingContext.compileShader(vs);

	var fs = drawingContext.createShader(drawingContext.FRAGMENT_SHADER);
	drawingContext.shaderSource(fs, frag);
	drawingContext.compileShader(fs);

	//create shader
	program = drawingContext.createProgram();
	drawingContext.attachShader(program, vs);
	drawingContext.attachShader(program, fs);
	drawingContext.linkProgram(program);
	
	//validate shader
	if (!drawingContext.getShaderParameter(vs, drawingContext.COMPILE_STATUS))
		console.log(drawingContext.getShaderInfoLog(vs));

	if (!drawingContext.getShaderParameter(fs, drawingContext.COMPILE_STATUS))
		console.log(drawingContext.getShaderInfoLog(fs));

	if (!drawingContext.getProgramParameter(program, drawingContext.LINK_STATUS))
		console.log(drawingContext.getProgramInfoLog(program));
	
	//use shader
	drawingContext.useProgram(program);
	
	//create uniform pointers
	program.uModelViewMatrix = drawingContext.getUniformLocation(program, "uModelViewMatrix");
	program.uProjectionMatrix = drawingContext.getUniformLocation(program, "uProjectionMatrix");
	
	//enable attributes
	program.aPosition = drawingContext.getAttribLocation(program, "aPosition");
	drawingContext.enableVertexAttribArray(program.aPosition);
	
	program.aColor = drawingContext.getAttribLocation(program, "aColor");
	drawingContext.enableVertexAttribArray(program.aColor);
	
	//load data
	httpGet(url, 'text', function(response) {
		console.log("Raw response length:", response.length);
		parsePointCloud(response, 2500, 0, 500, 0);

		console.log("data loaded: " + (vertices.length/3) + " points");
		console.log("colors loaded: " + (colors.length/3) + " colors");
		
		//create buffers
		program.positionBuffer = drawingContext.createBuffer();
		drawingContext.bindBuffer(drawingContext.ARRAY_BUFFER, program.positionBuffer);
		drawingContext.bufferData(drawingContext.ARRAY_BUFFER, new Float32Array(vertices), drawingContext.STATIC_DRAW);

		program.colorBuffer = drawingContext.createBuffer();
		drawingContext.bindBuffer(drawingContext.ARRAY_BUFFER, program.colorBuffer);
		drawingContext.bufferData(drawingContext.ARRAY_BUFFER, new Float32Array(colors), drawingContext.STATIC_DRAW);
	});
}

function draw() {
	background(135, 206, 235); // 天蓝色 RGB(135, 206, 235)
	
	// 初始自动旋转一圈
	if (autoRotate && !rotationComplete) {
		rotationAngle += rotationSpeed;
		
		// 检查是否完成一圈
		if (rotationAngle >= totalRotation) {
			rotationAngle = 0; // 重置为0
			rotationComplete = true;
			autoRotate = false;
			manualRotationAngle = 0; // 初始化手动旋转角度
			
			// 显示第一组容器
			currentSegment = 0;
			updateContainers(currentSegment);
			previousSegment = currentSegment;
			
			console.log("初始旋转完成，显示第1组容器");
		}
		
		// 应用旋转
		rotateY(rotationAngle);
	} else if (rotationComplete) {
		// 初始旋转完成后，使用手动旋转角度
		if (isDragging) {
			// 拖拽时增加旋转角度
			let deltaX = mouseX - lastMouseX;
			manualRotationAngle += deltaX * 0.01; // 调整灵敏度
			
			// 计算当前段落
			let normalizedAngle = manualRotationAngle % (2 * Math.PI);
			if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
			currentSegment = Math.floor(normalizedAngle / segmentAngle) % totalSegments;
			
			// 检查是否进入新段落
			if (currentSegment !== previousSegment) {
				updateContainers(currentSegment);
				previousSegment = currentSegment;
			}
		}
		
		lastMouseX = mouseX;
		
		// 应用手动旋转
		rotateY(manualRotationAngle);
	}
	
	
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
	console.log("Total lines:", lines.length);

	let header = true;
	let pointCount = 0;
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

			if(isNaN(x) || isNaN(y) || isNaN(z)) {
				continue;
			}

			vertices.push(x * scale + xAdd);
			vertices.push(y * scale + yAdd);
			vertices.push(z * scale + zAdd);

			// 将所有点设置为白色
			colors.push(1.0); // r
			colors.push(1.0); // g
			colors.push(1.0); // b
			
			pointCount++;
		}
	}
	console.log("Parsed points:", pointCount);
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
	if (currentTopContainer) currentTopContainer.classList.add('active');
	if (currentBottomContainer) currentBottomContainer.classList.add('active');
	
	console.log("显示段落:", segment + 1);
}

// 添加鼠标事件处理
function mousePressed() {
	if (rotationComplete) {
		isDragging = true;
		lastMouseX = mouseX;
	}
}

function mouseReleased() {
	isDragging = false;
}
