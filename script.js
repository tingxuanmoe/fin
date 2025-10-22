document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const canvasLeft = document.getElementById('canvas-left');
    const canvasRight = document.getElementById('canvas-right');
    const ctxLeft = canvasLeft.getContext('2d');
    const ctxRight = canvasRight.getContext('2d');

    const levelDisplay = document.getElementById('level');
    const diffCountDisplay = document.getElementById('diff-count');
    const winModal = document.getElementById('win-modal');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const canvasArea = document.getElementById('canvas-area');

    // 游戏状态
    let currentLevel = 0;
    let differences = [];
    let foundDifferences = 0;

    // --- 关卡数据 ---
    const levels = [
        // 关卡 1: 一个简单的不同颜色的圆
        {
            baseShapes: [
                { type: 'circle', color: '#4682B4', x: 200, y: 200, radius: 50 },
                { type: 'circle', color: '#6A5ACD', x: 100, y: 150, radius: 30 },
                { type: 'circle', color: '#6A5ACD', x: 300, y: 250, radius: 40 },
            ],
            differences: [
                { type: 'color', x: 100, y: 150, radius: 30, newColor: '#FF6347' }
            ]
        },
        // 关卡 2: 增加一个形状 & 颜色不同
        {
            baseShapes: [
                { type: 'rect', color: '#87CEEB', x: 50, y: 50, width: 80, height: 80 },
                { type: 'rect', color: '#87CEEB', x: 250, y: 280, width: 100, height: 60 },
                { type: 'smiley', x: 200, y: 180, size: 50 },
            ],
            differences: [
                { type: 'add', shape: { type: 'circle', color: '#32CD32', x: 320, y: 100, radius: 25 } },
                { type: 'color', x: 50, y: 50, width: 80, height: 80, newColor: '#9370DB' }
            ]
        },
         // 关卡 3: 更多细微差别
        {
            baseShapes: [
                { type: 'smiley', x: 100, y: 100, size: 40, color: '#FFD700' },
                { type: 'smiley', x: 300, y: 300, size: 60, color: '#FFD700' },
                { type: 'smiley', x: 150, y: 250, size: 30, color: '#FFD700' },
                { type: 'smiley', x: 280, y: 120, size: 35, color: '#FFD700' },
            ],
            differences: [
                // 嘴巴不一样
                { type: 'mouth', x: 100, y: 100, size: 40, newMouth: 'sad' },
                // 眼睛颜色不一样
                { type: 'eyeColor', x: 300, y: 300, size: 60, newColor: 'blue' },
                 // 多了一个小装饰
                { type: 'add', shape: {type: 'rect', color: '#FF69B4', x: 145, y: 230, width: 10, height: 10 } }
            ]
        },
        // 关卡 4: 位移和大小变化
        {
            baseShapes: [
                { type: 'rect', color: '#00CED1', x: 50, y: 50, width: 50, height: 50 },
                { type: 'rect', color: '#00CED1', x: 150, y: 150, width: 50, height: 50 },
                { type: 'rect', color: '#00CED1', x: 250, y: 250, width: 50, height: 50 },
                { type: 'rect', color: '#00CED1', x: 350, y: 50, width: 50, height: 50 },
                { type: 'rect', color: '#00CED1', x: 50, y: 350, width: 50, height: 50 },
            ],
            differences: [
                { type: 'move', x: 150, y: 150, newX: 155, newY: 155, width: 50, height: 50 },
                { type: 'size', x: 250, y: 250, newWidth: 45, newHeight: 45, width: 50, height: 50 },
                { type: 'color', x: 350, y: 50, newColor: '#00BFFF', width: 50, height: 50 },
            ]
        },
        // 关卡 5: 综合高难度
        {
            baseShapes: [
                { type: 'circle', color: '#FFC0CB', x: 50, y: 50, radius: 10 },
                { type: 'circle', color: '#FFC0CB', x: 100, y: 100, radius: 10 },
                { type: 'circle', color: '#FFC0CB', x: 150, y: 150, radius: 10 },
                { type: 'circle', color: '#FFC0CB', x: 200, y: 200, radius: 10 },
                { type: 'circle', color: '#FFC0CB', x: 250, y: 250, radius: 10 },
                { type: 'circle', color: '#FFC0CB', x: 300, y: 300, radius: 10 },
                { type: 'circle', color: '#FFC0CB', x: 350, y: 350, radius: 10 },
                { type: 'smiley', x: 200, y: 100, size: 30 },
            ],
            differences: [
                { type: 'add', shape: { type: 'circle', color: '#FFC0CB', x: 50, y: 350, radius: 10 } },
                { type: 'color', x: 200, y: 200, radius: 10, newColor: '#FFB6C1' }, // very slight color change
                { type: 'move', x: 300, y: 300, radius: 10, newX: 302, newY: 302 },
                { type: 'mouth', x: 200, y: 100, size: 30, newMouth: 'sad' },
            ]
        }
    ];

    // --- 绘图函数 ---
    function drawShape(ctx, shape) {
        ctx.fillStyle = shape.color || '#333';
        switch (shape.type) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'rect':
                ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
                break;
            case 'smiley':
                drawSmiley(ctx, shape.x, shape.y, shape.size, shape.color, shape.eyeColor, shape.mouth);
                break;
        }
    }

    function drawSmiley(ctx, x, y, size, color, eyeColor = 'black', mouth = 'happy') {
        // Face
        ctx.fillStyle = color || '#FFD700';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(x - size * 0.4, y - size * 0.2, size * 0.1, 0, Math.PI * 2); // Left eye
        ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.1, 0, Math.PI * 2); // Right eye
        ctx.fill();

        // Mouth
        ctx.strokeStyle = 'black';
        ctx.lineWidth = size * 0.05;
        ctx.beginPath();
        if (mouth === 'sad') {
             ctx.arc(x, y + size * 0.5, size * 0.4, Math.PI, 2*Math.PI);
        } else {
             ctx.arc(x, y + size * 0.2, size * 0.6, 0.2 * Math.PI, 0.8 * Math.PI);
        }
        ctx.stroke();
    }

    function drawLevel(levelData) {
        // 清空画布
        ctxLeft.clearRect(0, 0, canvasLeft.width, canvasLeft.height);
        ctxRight.clearRect(0, 0, canvasRight.width, canvasRight.height);

        // 绘制基础图形
        levelData.baseShapes.forEach(shape => {
            drawShape(ctxLeft, shape);
            drawShape(ctxRight, shape);
        });

        // 在右侧画布上绘制不同点
        levelData.differences.forEach(diff => {
            if (diff.type === 'add') {
                drawShape(ctxRight, diff.shape);
            } else if (diff.type === 'color') {
                const originalShape = levelData.baseShapes.find(s => s.x === diff.x && s.y === diff.y);
                if (originalShape) {
                    const modifiedShape = { ...originalShape, color: diff.newColor };
                    drawShape(ctxRight, modifiedShape);
                }
            } else if (diff.type === 'mouth') {
                 const originalShape = levelData.baseShapes.find(s => s.x === diff.x && s.y === diff.y);
                 if (originalShape) {
                     drawSmiley(ctxRight, diff.x, diff.y, diff.size, originalShape.color, 'black', 'sad');
                 }
            } else if (diff.type === 'eyeColor') {
                const originalShape = levelData.baseShapes.find(s => s.x === diff.x && s.y === diff.y);
                 if (originalShape) {
                     drawSmiley(ctxRight, diff.x, diff.y, diff.size, originalShape.color, 'blue', 'happy');
                 }
            } else if (diff.type === 'move') {
                const originalShape = levelData.baseShapes.find(s => s.x === diff.x && s.y === diff.y);
                if (originalShape) {
                    const modifiedShape = { ...originalShape, x: diff.newX, y: diff.newY };
                    drawShape(ctxRight, modifiedShape);
                }
            } else if (diff.type === 'size') {
                const originalShape = levelData.baseShapes.find(s => s.x === diff.x && s.y === diff.y);
                if (originalShape) {
                    const modifiedShape = { ...originalShape, width: diff.newWidth, height: diff.newHeight };
                    drawShape(ctxRight, modifiedShape);
                }
            }
        });
    }

    // --- 游戏逻辑 ---
    function loadLevel(levelIndex) {
        if (levelIndex >= levels.length) {
            alert('恭喜你！已通关所有关卡！');
            return;
        }

        currentLevel = levelIndex;
        const levelData = levels[currentLevel];
        differences = levelData.differences.map(d => ({ ...d, found: false }));
        foundDifferences = 0;

        // 更新UI
        levelDisplay.textContent = currentLevel + 1;
        diffCountDisplay.textContent = differences.length;

        // 清除上一关的标记
        document.querySelectorAll('.marker').forEach(m => m.remove());

        drawLevel(levelData);
        winModal.classList.add('hidden');
    }

    function handleCanvasClick(event) {
        const rect = canvasRight.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        differences.forEach((diff, index) => {
            if (diff.found) return;

            // 确定点击区域
            let hit = false;
            const hitboxSize = (diff.radius || (diff.shape ? diff.shape.radius : 0) || (diff.width ? Math.max(diff.width, diff.height) : 0) || 30) * 1.2;

            const checkX = diff.newX || (diff.shape ? diff.shape.x : diff.x);
            const checkY = diff.newY || (diff.shape ? diff.shape.y : diff.y);

            const distance = Math.sqrt((x - checkX) ** 2 + (y - checkY) ** 2);

            if(distance < hitboxSize / 1.5) { // 使用简化的圆形检测
                hit = true;
            }

            if (hit) {
                diff.found = true;
                foundDifferences++;
                diffCountDisplay.textContent = differences.length - foundDifferences;

                // 在点击位置添加标记
                const marker = document.createElement('div');
                marker.classList.add('marker');
                marker.style.left = `${rect.left + checkX - hitboxSize / 2}px`;
                marker.style.top = `${rect.top + checkY - hitboxSize / 2}px`;
                marker.style.width = `${hitboxSize}px`;
                marker.style.height = `${hitboxSize}px`;
                document.body.appendChild(marker);


                if (foundDifferences === differences.length) {
                    setTimeout(() => winModal.classList.remove('hidden'), 500);
                }
            }
        });
    }

    // --- 事件监听 ---
    canvasRight.addEventListener('click', handleCanvasClick);
    nextLevelBtn.addEventListener('click', () => {
        loadLevel(currentLevel + 1);
    });

    // 启动游戏
    loadLevel(0);
});
