document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const canvasLeft = document.getElementById('canvas-left');
    const canvasRight = document.getElementById('canvas-right');
    const ctxLeft = canvasLeft.getContext('2d');
    const ctxRight = canvasRight.getContext('2d');

    const levelDisplay = document.getElementById('level');
    const diffCountDisplay = document.getElementById('diff-count');
    const livesDisplay = document.getElementById('lives');
    const winModal = document.getElementById('win-modal');
    const gameOverModal = document.getElementById('game-over-modal');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const canvasArea = document.getElementById('canvas-area');

    // 游戏状态
    let currentLevel = 0;
    let differences = [];
    let foundDifferences = 0;
    let lives = 5;

    // --- 随机关卡生成器 ---
    function generateLevel(levelNumber) {
        const baseShapes = [];
        const differences = [];
        const canvasWidth = canvasLeft.width;
        const canvasHeight = canvasLeft.height;

        // 难度参数 (简单模式)
        const numShapes = Math.min(3 + levelNumber, 12); // 基础图形数量
        const numDiffs = Math.min(1 + Math.floor(levelNumber / 3), 4); // 不同点数量

        // --- 辅助函数 ---
        const getRandom = (min, max) => Math.random() * (max - min) + min;
        const getRandomColor = () => `hsl(${getRandom(0, 360)}, 70%, 60%)`;
        const shapeTypes = ['circle', 'rect', 'smiley'];

        // --- 生成基础图形 (使用比例) ---
        for (let i = 0; i < numShapes; i++) {
            let shape;
            let overlapping;
            do {
                overlapping = false;
                const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
                const size = getRandom(canvasWidth * 0.05, canvasWidth * 0.15); // Size as a factor of canvas width
                shape = {
                    type: type,
                    color: getRandomColor(),
                    x: getRandom(size, canvasWidth - size),
                    y: getRandom(size, canvasHeight - size),
                };
                if (type === 'circle') {
                    shape.radius = size;
                } else if (type === 'rect') {
                    shape.width = size;
                    shape.height = size;
                } else if (type === 'smiley') {
                    shape.size = size;
                }

                // 简单的碰撞检测
                for (const existingShape of baseShapes) {
                    const dist = Math.sqrt((shape.x - existingShape.x)**2 + (shape.y - existingShape.y)**2);
                    if (dist < (shape.radius || size) + (existingShape.radius || existingShape.size || existingShape.width)) {
                        overlapping = true;
                        break;
                    }
                }
            } while (overlapping);
            baseShapes.push(shape);
        }

        // --- 从基础图形中挑选并生成不同点 ---
        const shapesToModify = [...baseShapes].sort(() => 0.5 - Math.random()).slice(0, numDiffs);

        shapesToModify.forEach(shape => {
            const diffType = 'move'; // 只生成 'move' 类型的不同点
            let difference = { ...shape }; // 复制一份以备修改

            const moveX = getRandom(canvasWidth * 0.04, canvasWidth * 0.08) * (Math.random() > 0.5 ? 1 : -1);
            const moveY = getRandom(canvasHeight * 0.04, canvasHeight * 0.08) * (Math.random() > 0.5 ? 1 : -1);
            const size = shape.radius || shape.size || shape.width;
            // 确保移动后不会超出边界
            difference.newX = Math.max(size, Math.min(canvasWidth - size, shape.x + moveX));
            difference.newY = Math.max(size, Math.min(canvasHeight - size, shape.y + moveY));

            differences.push({ type: 'move', ...difference });
        });

        return { baseShapes, differences };
    }

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

        // 绘制左边画布（所有基础图形）
        levelData.baseShapes.forEach(shape => {
            drawShape(ctxLeft, shape);
        });

        // 绘制右边画布（应用不同点）
        levelData.baseShapes.forEach(shape => {
            const difference = levelData.differences.find(d => d.x === shape.x && d.y === shape.y);
            if (difference) {
                // 如果是不同点，使用新坐标绘制
                const modifiedShape = { ...shape, x: difference.newX, y: difference.newY };
                drawShape(ctxRight, modifiedShape);
            } else {
                // 否则，按原样绘制
                drawShape(ctxRight, shape);
            }
        });
    }

    // --- 游戏逻辑 ---
    function loadLevel(levelIndex) {
        if (levelIndex >= 10) { // 关卡上限为10
            alert('恭喜你！已通关所有关卡！');
            // 游戏结束，不再重启
            return;
        }

        currentLevel = levelIndex;

        // 关键：先调整画布尺寸，再生成关卡
        const size = document.body.clientWidth > 850 ? 400 : document.body.clientWidth * 0.4;
        canvasLeft.width = size;
        canvasLeft.height = size;
        canvasRight.width = size;
        canvasRight.height = size;

        const levelData = generateLevel(currentLevel);
        lastLevelData = levelData; // 保存数据用于重绘
        differences = levelData.differences.map(d => ({ ...d, found: false }));
        foundDifferences = 0;

        // 更新UI
        levelDisplay.textContent = currentLevel + 1;
        diffCountDisplay.textContent = differences.length;

        // 清除上一关的标记
        document.querySelectorAll('.marker').forEach(m => m.remove());

        drawLevel(levelData);
        winModal.classList.add('hidden');
        gameOverModal.classList.add('hidden');
    }

    function revealMissedDifferences() {
        const rect = canvasRight.getBoundingClientRect();
        differences.forEach(diff => {
            if (!diff.found) {
                const hitboxSize = (diff.radius || diff.size || (diff.shape ? diff.shape.radius : 0) || (diff.width ? Math.max(diff.width, diff.height) : 0) || 30) * 1.2;
                const checkX = diff.newX || (diff.shape ? diff.shape.x : diff.x);
                const checkY = diff.newY || (diff.shape ? diff.shape.y : diff.y);

                const marker = document.createElement('div');
                marker.classList.add('missed-marker');
                marker.style.left = `${rect.left + checkX - hitboxSize / 2}px`;
                marker.style.top = `${rect.top + checkY - hitboxSize / 2}px`;
                marker.style.width = `${hitboxSize}px`;
                marker.style.height = `${hitboxSize}px`;
                document.body.appendChild(marker);
            }
        });
    }

    function handleCanvasClick(event) {
        if (lives <= 0) return; // 生命值为0时禁用点击
        const rect = canvasRight.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        let hitDetected = false;

        differences.forEach((diff, index) => {
            if (diff.found) return;

            // 确定点击区域
            let hit = false;
            const hitboxSize = (diff.radius || diff.size || (diff.shape ? diff.shape.radius : 0) || (diff.width ? Math.max(diff.width, diff.height) : 0) || 30) * 1.2;

            const checkX = diff.newX || (diff.shape ? diff.shape.x : diff.x);
            const checkY = diff.newY || (diff.shape ? diff.shape.y : diff.y);

            const distance = Math.sqrt((x - checkX) ** 2 + (y - checkY) ** 2);

            if(distance < hitboxSize / 1.5) { // 使用简化的圆形检测
                hit = true;
            }

            if (hit) {
                hitDetected = true;
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

        if (!hitDetected) {
            lives--;
            livesDisplay.textContent = lives;
            if (lives <= 0) {
                revealMissedDifferences();
                gameOverModal.classList.remove('hidden');
            }
        }
    }

    // --- 事件监听 ---
    canvasRight.addEventListener('click', handleCanvasClick);
    nextLevelBtn.addEventListener('click', () => {
        loadLevel(currentLevel + 1);
    });

    // --- 响应式画布处理 ---
    let lastLevelData = null; // 存储当前关卡的原始数据

    function resizeAndDraw() {
        const size = canvasLeft.clientWidth;
        canvasLeft.width = size;
        canvasLeft.height = size;
        canvasRight.width = size;
        canvasRight.height = size;

        if (lastLevelData) {
            drawLevel(lastLevelData);
        }
    }


    // 启动游戏
    loadLevel(0);
});
