/* ==========================================================================
   SOUND VISUALIZATION - Interactive Audio-Reactive Grid Animation
   Blackstone Conservation District
   ========================================================================== */

/* ==========================================================================
   GLOBAL VARIABLES
   ========================================================================== */

let globalAudioEnabled = true;
let sharedAudioContext = null;

/* ==========================================================================
   PULSING GRID ANIMATION
   Audio-reactive grid animation displayed on point hover
   ========================================================================== */

function setupPulsingGridOnPoints() {
  const points = document.querySelectorAll('.point');

  points.forEach(point => {
    // 为每个点创建 canvas 容器
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 720;
    canvas.style.position = 'absolute';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
    canvas.style.pointerEvents = 'none';
    canvas.style.opacity = '0';
    canvas.style.transition = 'opacity 0.3s ease';
    canvas.style.zIndex = '3';

    point.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let time = 0;
    let lastTime = 0;
    let animationFrame = null;
    let isHovered = false;

    // 音频相关
    let audio = null;
    let audioContext = null;
    let analyser = null;
    let dataArray = null;
    let currentVolume = 0;
    let isPlaying = false;
    let audioInitialized = false;

    // Grid parameters
    const gridSize = 30;
    const spacing = 10;

    // Animation parameters
    const breathingSpeed = 0.5; // Speed of expansion/contraction - 基础速度
    const colorPulseSpeed = 1.0; // Speed of color pulsing

    function animate(timestamp) {
      if (!isHovered) return;

      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.001;

      // 更新音量
      updateVolume();

      // 整个animation的大小根据音量变化 - 缩放整个canvas
      const scale = 0.7 + currentVolume * 0.6; // 0.7 到 1.3 倍缩放
      canvas.style.transform = `translate(-50%, -50%) scale(${scale})`;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate breathing effect - grid expands and contracts - 根据音量调整
      const breathingAmplitude = 0.2 + currentVolume * 0.4; // 0.2 到 0.6，音量越大振幅越大
      const breathingSpeedMultiplier = 1 + currentVolume * 1.5; // 1 到 2.5，音量越大速度越快
      const breathingFactor = Math.sin(time * breathingSpeed * breathingSpeedMultiplier) * breathingAmplitude + 1.0;

      // Draw center square
      ctx.fillStyle = "rgb(255, 255, 255)";
      ctx.fillRect(centerX - 3, centerY - 3, 6, 6);

      // 定义最大距离 - 根据音量动态调整圆形范围
      const baseMaxDistance = (spacing * (gridSize - 1)) / 2;
      const volumeMultiplier = 0.5 + currentVolume * 1.5; // 0.5 到 2.0
      const maxDistance = baseMaxDistance * volumeMultiplier;

      // Draw pulsing grid pattern
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          // Skip center point
          if (
            row === Math.floor(gridSize / 2) &&
            col === Math.floor(gridSize / 2)
          )
            continue;

          // Calculate base position
          const baseX = (col - (gridSize - 1) / 2) * spacing;
          const baseY = (row - (gridSize - 1) / 2) * spacing;

          // 使用伪随机决定是否在空隙中添加额外的方块
          const seed = row * gridSize + col;
          const shouldAddGap = (Math.sin(seed * 45.678) * 43758.5453 % 1) < 0.3; // 30%概率

          // Calculate distance and angle from center for effects
          const distance = Math.sqrt(baseX * baseX + baseY * baseY);
          const angle = Math.atan2(baseY, baseX);

          // 圆形范围 - 只绘制在圆形范围内的点
          if (distance > maxDistance) {
            continue;
          }

          const normalizedDistance = distance / maxDistance;

          // Apply complex wave effects
          // 1. Radial wave (expands from center) - 强烈跟随音量
          const radialPhase = (time - normalizedDistance) % 1;
          const waveIntensity = 2 + currentVolume * 30; // 2 到 32，音量越大波浪越强
          const radialWave = Math.sin(radialPhase * Math.PI * 2) * waveIntensity;

          // 2. Breathing effect (entire grid expands/contracts) - 也跟随音量
          const volumeBreathing = 1 + currentVolume * 0.5; // 音量增强呼吸效果
          const breathingX = baseX * breathingFactor * volumeBreathing;
          const breathingY = baseY * breathingFactor * volumeBreathing;

          // Combine all effects
          const waveX = centerX + breathingX + Math.cos(angle) * radialWave;
          const waveY = centerY + breathingY + Math.sin(angle) * radialWave;

          // Square size 变大两倍 - 也跟随音量
          const baseSize = (1.5 + (1 - normalizedDistance) * 1.5) * 2; // 基础大小 * 2
          // Complex pulsing effect - 音量越大脉冲越强，速度也越快
          const pulseSpeedMultiplier = 2 + currentVolume * 3; // 2 到 5，音量越大速度越快
          const pulseFactor =
            Math.sin(time * pulseSpeedMultiplier + normalizedDistance * 5) * (0.6 + currentVolume * 0.8) + 1;
          const size = baseSize * pulseFactor;

          // 纯白色实心方块，没有基于时间的动画
          ctx.fillStyle = "rgba(255, 255, 255, 1)";
          ctx.fillRect(waveX - size, waveY - size, size * 2, size * 2);

          // 在30%的情况下，在空隙中添加额外的小方块
          if (shouldAddGap) {
            // 在当前方块和下一个方块之间添加一个小方块
            const gapX = waveX + spacing / 2;
            const gapY = waveY + spacing / 2;
            const gapDistance = Math.sqrt(
              (gapX - centerX) * (gapX - centerX) + (gapY - centerY) * (gapY - centerY)
            );

            // 确保空隙方块也在圆形范围内
            if (gapDistance <= maxDistance) {
              const gapSize = size * 0.5; // 空隙方块更小
              ctx.fillRect(gapX - gapSize, gapY - gapSize, gapSize * 2, gapSize * 2);
            }
          }
        }
      }

      animationFrame = requestAnimationFrame(animate);
    }

    // 初始化音频分析 - 使用预初始化的音频对象
    function initAudio() {
      if (audioInitialized) return;

      // 尝试从点的预初始化属性中获取音频对象
      if (point._audioInitialized) {
        audio = point._audio;
        analyser = point._analyser;
        dataArray = point._dataArray;
        audioContext = sharedAudioContext;
        audioInitialized = true;
        return;
      }

      // 如果没有预初始化，则提示用户先点击页面
      console.warn('音频未预初始化，请先点击页面任意位置');
    }

    // 分析音频音量
    function updateVolume() {
      if (!analyser || !audio || audio.paused) {
        // 音频未播放时，音量逐渐衰减
        currentVolume *= 0.9;
        return;
      }

      analyser.getByteFrequencyData(dataArray);

      // 计算平均音量 - 重点关注低频和中频
      let sum = 0;
      let weightedSum = 0;
      let totalWeight = 0;

      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];

        // 对低频和中频给予更高权重
        let weight = 1;
        if (i < dataArray.length * 0.3) {
          weight = 2.0; // 低频权重 2倍
        } else if (i < dataArray.length * 0.6) {
          weight = 1.5; // 中频权重 1.5倍
        }

        weightedSum += dataArray[i] * weight;
        totalWeight += weight;
      }

      const weightedAverage = weightedSum / totalWeight;

      // 使用加权平均值，并增强对比度
      let normalizedVolume = weightedAverage / 255;

      // 应用平方根增强小音量的可见度，同时保持大音量的冲击力
      normalizedVolume = Math.pow(normalizedVolume, 0.7);

      // 平滑过渡，避免突变 - 提高敏感度
      const smoothing = 0.6; // 从0.3提高到0.6，响应更快
      currentVolume = currentVolume * (1 - smoothing) + normalizedVolume * smoothing;

      // 限制范围
      currentVolume = Math.min(1, Math.max(0, currentVolume));
    }

    // Hover 事件 - 播放音频并显示动画
    point.addEventListener('mouseenter', () => {
      isHovered = true;
      canvas.style.opacity = '1';
      lastTime = 0;
      time = 0;

      // 初始化并播放音频
      if (globalAudioEnabled) {
        if (!audioInitialized) {
          initAudio();
        }

        // 恢复AudioContext (如果被暂停)
        if (audioContext && audioContext.state === 'suspended') {
          audioContext.resume();
        }

        if (audio) {
          audio.currentTime = 0;
          audio.volume = 0; // 从0开始
          const playPromise = audio.play();

          if (playPromise !== undefined) {
            playPromise.then(() => {
              isPlaying = true;
              point.classList.add('playing');

              // Fade in: 音量从0渐进到1，持续0.5秒
              let fadeInStart = Date.now();
              const fadeInDuration = 500; // 0.5秒
              const fadeIn = setInterval(() => {
                const elapsed = Date.now() - fadeInStart;
                const progress = Math.min(elapsed / fadeInDuration, 1);
                audio.volume = progress;

                if (progress >= 1) {
                  clearInterval(fadeIn);
                }
              }, 20);

              // 保存interval ID用于清理
              point._fadeInInterval = fadeIn;
            }).catch(err => {
              console.error('音频播放失败:', err);
              console.warn('请先点击页面任意位置激活音频，然后再hover到点上');
            });
          }
        }
      }

      animationFrame = requestAnimationFrame(animate);
    });

    point.addEventListener('mouseleave', () => {
      isHovered = false;
      canvas.style.opacity = '0';

      // 清除fade in interval
      if (point._fadeInInterval) {
        clearInterval(point._fadeInInterval);
        point._fadeInInterval = null;
      }

      // 停止音频 - 添加fade out效果
      if (audio && isPlaying) {
        // Fade out: 音量从当前值渐进到0，持续0.3秒
        const currentVol = audio.volume;
        let fadeOutStart = Date.now();
        const fadeOutDuration = 300; // 0.3秒
        const fadeOut = setInterval(() => {
          const elapsed = Date.now() - fadeOutStart;
          const progress = Math.min(elapsed / fadeOutDuration, 1);
          audio.volume = currentVol * (1 - progress);

          if (progress >= 1) {
            clearInterval(fadeOut);
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 1; // 重置音量
            isPlaying = false;
            point.classList.remove('playing');
          }
        }, 20);
      }

      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  });
}

/* ==========================================================================
   FILTER BUTTONS
   Toggle visibility of natural/unnatural sound points
   ========================================================================== */

function setupFilterButtons() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const points = document.querySelectorAll('.point');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active state
      btn.classList.toggle('active');

      // Apply filter
      const naturalActive = document.querySelector('[data-filter="natural"]').classList.contains('active');
      const unnaturalActive = document.querySelector('[data-filter="unnatural"]').classList.contains('active');

      points.forEach(point => {
        const category = point.getAttribute('data-category');

        if (category === 'natural') {
          point.style.display = naturalActive ? '' : 'none';
        } else if (category === 'unnatural') {
          point.style.display = unnaturalActive ? '' : 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  setupPulsingGridOnPoints();
  setupDescriptionBox();
  setupIntroAnimation();
  setupFootstepSystem();
  setupFilterButtons();

  // Audio Context initialization - fixes browser autoplay restrictions
  let userInteracted = false;
  const enableAudioContext = () => {
    if (!userInteracted) {
      userInteracted = true;

      // 1. 创建全局AudioContext
      if (!sharedAudioContext) {
        sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      // 2. 确保AudioContext是running状态
      if (sharedAudioContext.state === 'suspended') {
        sharedAudioContext.resume().then(() => {
          preInitializeAllAudio();
        });
      } else {
        preInitializeAllAudio();
      }
    }
  };

  // 3. 预初始化所有点的音频连接
  function preInitializeAllAudio() {
    const points = document.querySelectorAll('.point');
    points.forEach(point => {
      const audioFile = point.getAttribute('data-audio');
      if (audioFile && !point._audioInitialized) {
        try {
          const audio = new Audio(audioFile);
          audio.loop = true;
          audio.volume = 1.0;

          // 🔥 修复CORS问题 - 设置crossOrigin属性允许跨域访问音频数据
          audio.crossOrigin = "anonymous";

          const analyser = sharedAudioContext.createAnalyser();
          analyser.fftSize = 256;

          const source = sharedAudioContext.createMediaElementSource(audio);
          source.connect(analyser);
          analyser.connect(sharedAudioContext.destination);

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          // 保存到点的属性中
          point._audio = audio;
          point._analyser = analyser;
          point._dataArray = dataArray;
          point._audioInitialized = true;
        } catch (error) {
          console.error('预初始化音频失败:', audioFile, error);
        }
      }
    });
  }

  document.addEventListener('click', enableAudioContext, { once: true });
  document.addEventListener('touchstart', enableAudioContext, { once: true });
});

/* ==========================================================================
   INTRO ANIMATION
   /* ==========================================================================
   Intro typing + wipeout
   ========================================================================== */
function setupIntroAnimation() {
  const introScreen = document.getElementById('intro-screen');
  const spans = introScreen.querySelectorAll('.intro-text span');

  const charMs = 50; // typing speed (ms per char)
  let maxDuration = 0;

  spans.forEach(span => {
    const fullText = span.textContent;

    // measure final width so the box doesn't jiggle
    const measure = document.createElement('span');
    measure.style.visibility = 'hidden';
    measure.style.whiteSpace = 'pre';
    measure.style.position = 'absolute';
    measure.textContent = fullText;
    document.body.appendChild(measure);
    const finalWidth = measure.offsetWidth;
    document.body.removeChild(measure);

    span.style.display = 'inline-block';
    span.style.whiteSpace = 'pre';
    span.style.minWidth = `${finalWidth}px`;

    // record duration for this span
    const duration = fullText.length * charMs;
    if (duration > maxDuration) maxDuration = duration;

    // type
    span.textContent = '';
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        span.textContent += fullText[i++];
      } else {
        clearInterval(interval);
      }
    }, charMs);
  });

  // after all lines have finished typing, add wipeout
  const bufferAfterTyping = 400; // small pause before wipe
  const wipeAnimDurationMs = 700; // keep in sync with CSS

  setTimeout(() => {
    // start the wipe
    introScreen.classList.add('wipeout');

    // when the CSS animation ends, remove the screen
    const handleAnimEnd = () => {
      introScreen.removeEventListener('animationend', handleAnimEnd);
      introScreen.style.display = 'none';
    };
    introScreen.addEventListener('animationend', handleAnimEnd);

    // safety fallback: remove if no animationend fires
    setTimeout(() => {
      introScreen.style.display = 'none';
    }, wipeAnimDurationMs + 150);
  }, maxDuration + bufferAfterTyping);
}


/* ==========================================================================
   DESCRIPTION BOX
   Interactive description boxes for data points
   ========================================================================== */

function setupDescriptionBox() {
  const points = document.querySelectorAll('.point');
  const descriptionBox = document.getElementById('description-box');
  const descriptionTitle = document.getElementById('description-title');
  const descriptionBody = document.getElementById('description-body');

  // 确保主description box初始隐藏
  descriptionBox.classList.remove('visible');

  // 创建第二个description box用于镜像光标
  const mirrorDescriptionBox = document.createElement('div');
  mirrorDescriptionBox.className = 'description-box';
  mirrorDescriptionBox.id = 'mirror-description-box';
  mirrorDescriptionBox.innerHTML = `
    <div class="title" id="mirror-description-title"></div>
    <div class="body" id="mirror-description-body"></div>
  `;
  document.body.appendChild(mirrorDescriptionBox);

  const mirrorDescriptionTitle = document.getElementById('mirror-description-title');
  const mirrorDescriptionBody = document.getElementById('mirror-description-body');

  let currentPoint = null;
  let currentMirrorPoint = null;

  // 更新description框位置的函数 - 始终在光标下方
  function updateDescriptionPosition(mouseX, mouseY, box) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // 先设置位置为屏幕外，然后立即获取实际尺寸
    box.style.left = '0px';
    box.style.top = '0px';
    box.style.visibility = 'hidden';
    box.style.opacity = '1';

    // 强制重排以获取准确尺寸
    const boxWidth = box.offsetWidth || 300;
    const boxHeight = box.offsetHeight || 100;

    // 恢复visibility
    box.style.visibility = 'visible';

    const offsetX = 15; // 距离鼠标的水平偏移量
    const offsetY = 15; // 距离鼠标的垂直偏移量

    let left, top;

    // 水平位置：根据鼠标位置决定框在左边还是右边
    if (mouseX > screenWidth / 2) {
      // 鼠标在右边，框显示在左边
      left = mouseX - boxWidth - offsetX;
    } else {
      // 鼠标在左边，框显示在右边
      left = mouseX + offsetX;
    }

    // 垂直位置：始终在光标下方
    top = mouseY + offsetY;

    // 确保不超出屏幕边界
    if (left < 20) left = 20;
    if (left + boxWidth > screenWidth - 20) left = screenWidth - boxWidth - 20;

    // 如果下方空间不够，放在上方
    if (top + boxHeight > screenHeight - 20) {
      top = mouseY - boxHeight - offsetY;
      // 如果上方也不够，保持在下方但调整到边界
      if (top < 20) {
        top = screenHeight - boxHeight - 20;
      }
    }

    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
  }

  // 真实鼠标的description处理
  points.forEach(point => {
    point.addEventListener('mouseenter', (e) => {
      const label = point.getAttribute('data-label');
      const description = point.getAttribute('data-description');

      // 检查是否是镜像触发的事件
      const isMirrorEvent = e.isMirrorEvent === true;

      if (label && description) {
        if (isMirrorEvent) {
          // 镜像光标触发
          currentMirrorPoint = point;
          mirrorDescriptionTitle.textContent = label;
          mirrorDescriptionBody.textContent = description;
          // 先更新位置再显示
          updateDescriptionPosition(e.clientX, e.clientY, mirrorDescriptionBox);
          mirrorDescriptionBox.classList.add('visible');
        } else {
          // 真实鼠标触发
          currentPoint = point;
          descriptionTitle.textContent = label;
          descriptionBody.textContent = description;
          // 先更新位置再显示
          updateDescriptionPosition(e.clientX, e.clientY, descriptionBox);
          descriptionBox.classList.add('visible');
        }
      }
    });

    point.addEventListener('mousemove', (e) => {
      // 只处理真实鼠标的移动
      if (currentPoint === point && !e.isMirrorEvent) {
        updateDescriptionPosition(e.clientX, e.clientY, descriptionBox);
      }
    });

    point.addEventListener('mouseleave', (e) => {
      const isMirrorEvent = e.isMirrorEvent === true;

      if (isMirrorEvent) {
        if (currentMirrorPoint === point) {
          mirrorDescriptionBox.classList.remove('visible');
          currentMirrorPoint = null;
        }
      } else {
        if (currentPoint === point) {
          descriptionBox.classList.remove('visible');
          currentPoint = null;
        }
      }
    });
  });

  // 监听真实鼠标移动，严格检查是否在点上
  document.addEventListener('mousemove', (e) => {
    // 检查镜像光标
    if (window.mirrorCursorSystem) {
      const hoveredPointsByMirror = window.mirrorCursorSystem.hoveredPointsByMirror();
      if (currentMirrorPoint && hoveredPointsByMirror.has(currentMirrorPoint)) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const offsetX = e.clientX - centerX;
        const offsetY = e.clientY - centerY;
        const mirrorX = centerX - offsetX;
        const mirrorY = centerY - offsetY;
        updateDescriptionPosition(mirrorX, mirrorY, mirrorDescriptionBox);
      } else if (currentMirrorPoint) {
        // 镜像光标不在点上，立即隐藏
        mirrorDescriptionBox.classList.remove('visible');
        currentMirrorPoint = null;
      }
    }

    // 严格检查真实鼠标 - 每次移动都检查
    let mouseIsOnAnyPoint = false;

    points.forEach(point => {
      const rect = point.getBoundingClientRect();
      const pointCenterX = rect.left + rect.width / 2;
      const pointCenterY = rect.top + rect.height / 2;
      const distance = Math.sqrt(
        Math.pow(e.clientX - pointCenterX, 2) +
        Math.pow(e.clientY - pointCenterY, 2)
      );

      // 使用点的半径作为判断标准
      if (distance < rect.width / 2) {
        mouseIsOnAnyPoint = true;
        // 如果这是当前正在hover的点，更新位置
        if (currentPoint === point) {
          updateDescriptionPosition(e.clientX, e.clientY, descriptionBox);
        }
      }
    });

    // 如果鼠标不在任何点上，立即隐藏description
    if (!mouseIsOnAnyPoint && currentPoint) {
      descriptionBox.classList.remove('visible');
      currentPoint = null;
    }
  });
}

/* ==========================================================================
   FOOTSTEP SYSTEM
   Animated footsteps walking across screen from edges
   ========================================================================== */

function setupFootstepSystem() {
  const footsteps = [
    { image: 'footstep asset/Dog.png', audio: 'sound Assets/dogs walking.mp3' },
    { image: 'footstep asset/Duck.png', audio: 'sound Assets/duck.wav' },
    { image: 'footstep asset/Human.png', audio: 'sound Assets/human foot step.mp3' },
    { image: 'footstep asset/Squirrel.png', audio: 'sound Assets/squirrel.mp3' }
  ];

  function createFootstepTrail() {
    // 随机选择一个footstep图案
    const footstep = footsteps[Math.floor(Math.random() * footsteps.length)];

    // 随机选择从哪个边缘开始
    const edges = ['top', 'bottom', 'left', 'right'];
    const edge = edges[Math.floor(Math.random() * edges.length)];

    // 根据边缘确定起始位置和方向
    let startX, startY, directionX, directionY, rotation;

    switch(edge) {
      case 'top':
        startX = Math.random() * window.innerWidth;
        startY = -100;
        directionX = (Math.random() - 0.5) * 0.5; // 轻微左右偏移
        directionY = 1; // 向下
        rotation = 180; // 朝下
        break;
      case 'bottom':
        startX = Math.random() * window.innerWidth;
        startY = window.innerHeight + 100;
        directionX = (Math.random() - 0.5) * 0.5;
        directionY = -1; // 向上
        rotation = 0; // 朝上
        break;
      case 'left':
        startX = -100;
        startY = Math.random() * window.innerHeight;
        directionX = 1; // 向右
        directionY = (Math.random() - 0.5) * 0.5;
        rotation = 90; // 朝右
        break;
      case 'right':
        startX = window.innerWidth + 100;
        startY = Math.random() * window.innerHeight;
        directionX = -1; // 向左
        directionY = (Math.random() - 0.5) * 0.5;
        rotation = -90; // 朝左
        break;
    }

    // 创建并播放音频 - 添加fade in效果
    const audio = new Audio(footstep.audio);
    audio.crossOrigin = "anonymous"; // 修复CORS问题
    audio.volume = 0; // 从0开始
    if (globalAudioEnabled) {
      audio.play().then(() => {
        // Fade in: 音量从0渐进到0.35，持续0.5秒
        let fadeInStart = Date.now();
        const fadeInDuration = 500; // 0.5秒
        const targetVolume = 0.35;
        const fadeIn = setInterval(() => {
          const elapsed = Date.now() - fadeInStart;
          const progress = Math.min(elapsed / fadeInDuration, 1);
          audio.volume = targetVolume * progress;

          if (progress >= 1) {
            clearInterval(fadeIn);
          }
        }, 20);
      }).catch(e => console.log('Audio play failed:', e));
    }

    // 创建一串脚印
    const stepCount = 8 + Math.floor(Math.random() * 8); // 8-15个脚印
    const stepDistance = (60 + Math.random() * 200) * 5; // 每步距离300-1300px (加大5倍)
    const stepInterval = 600 + Math.random() * 400; // 每步间隔600-1000ms (更慢)
    const footstepSize = (40 + Math.random() * 30) * 8; // 200-350px (放大5倍)

    for (let i = 0; i < stepCount; i++) {
      setTimeout(() => {
        // 创建单个脚印
        const img = document.createElement('img');
        img.src = footstep.image;
        img.className = 'footstep-img';

        // 计算位置，添加更大的随机抖动
        const x = startX + directionX * stepDistance * i + (Math.random() - 0.5) * 200; // ±100px抖动 (加大5倍)
        const y = startY + directionY * stepDistance * i + (Math.random() - 0.5) * 200; // ±100px抖动 (加大5倍)

        // 旋转角度添加更大的随机抖动
        const rotationJitter = (Math.random() - 0.5) * 60; // ±30度抖动 (加大2倍)

        img.style.left = x + 'px';
        img.style.top = y + 'px';
        img.style.width = footstepSize + 'px';
        img.style.height = footstepSize + 'px';
        img.style.transform = `rotate(${rotation + rotationJitter}deg)`;

        document.body.appendChild(img);

        // 淡入 - 完全不透明
        setTimeout(() => {
          img.style.opacity = '1';
        }, 50);

        // 添加stagger delay：后面的脚印比前面的脚印停留更久
        const staggerDelay = i * stepInterval * 0.8; // 每个脚印增加0.8倍步长的延迟
        const baseLifetime = 4 * stepInterval; // 基础停留时间为4步
        const lifetime = baseLifetime + staggerDelay;

        setTimeout(() => {
          img.style.opacity = '0';
          setTimeout(() => {
            img.remove();
          }, 500);
        }, lifetime);

      }, i * stepInterval);
    }
  }

  // 定期创建footstep trail (每5-10秒)
  function scheduleNextTrail() {
    const interval = 5000 + Math.random() * 5000;
    setTimeout(() => {
      createFootstepTrail();
      scheduleNextTrail();
    }, interval);
  }

  // 延迟5秒后启动系统
  setTimeout(() => {
    scheduleNextTrail();
    // 显示第一个footstep trail
    createFootstepTrail();
  }, 5000);
}
