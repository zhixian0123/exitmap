// 保存當前路徑
var currentPathPoints = [];

// 調整 canvas 尺寸
function resizeCanvas() {
    var canvas = document.getElementById('routeCanvas');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // 每次調整大小後重新繪製邊界點和路徑
    drawBoundaryPoints();
    if (currentPathPoints.length > 0) {
        drawRoute(currentPathPoints);
    }
}

window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// 走廊範圍（使用百分比）
var corridor = {
    x1: 78 / 600, // 左邊界
    y1: 95 / 800, // 上邊界
    x2: 518 / 600, // 右邊界
    y2: 725 / 800  // 下邊界
};

// 定義30個邊界上的點
var boundaryPoints = [];
var numPoints = 30;
var totalLength = 2 * ((corridor.x2 - corridor.x1) + (corridor.y2 - corridor.y1));

for (var i = 0; i < numPoints; i++) {
    var distance = i * (totalLength / numPoints);
    var point = getPointAtDistance(distance);
    boundaryPoints.push(point);
}

function getPointAtDistance(distance) {
    var x1 = corridor.x1;
    var y1 = corridor.y1;
    var x2 = corridor.x2;
    var y2 = corridor.y2;

    var edgeLengths = [
        x2 - x1,     // 上邊
        y2 - y1,     // 右邊
        x2 - x1,     // 下邊
        y2 - y1      // 左邊
    ];

    distance = distance % totalLength;

    if (distance <= edgeLengths[0]) {
        // 上邊
        return { x: x1 + distance, y: y1 };
    }
    distance -= edgeLengths[0];

    if (distance <= edgeLengths[1]) {
        // 右邊
        return { x: x2, y: y1 + distance };
    }
    distance -= edgeLengths[1];

    if (distance <= edgeLengths[2]) {
        // 下邊
        return { x: x2 - distance, y: y2 };
    }
    distance -= edgeLengths[2];

    if (distance <= edgeLengths[3]) {
        // 左邊
        return { x: x1, y: y2 - distance };
    }

    // 防止超出範圍
    return { x: x1, y: y1 };
}

// 繪製30個邊界點
function drawBoundaryPoints() {
    var canvas = document.getElementById('routeCanvas');
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'purple';
    var width = canvas.width;
    var height = canvas.height;
    boundaryPoints.forEach(function(point) {
        ctx.beginPath();
        ctx.arc(point.x * width, point.y * height, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

// 繪製路徑
function drawRoute(pathPoints) {
    var canvas = document.getElementById('routeCanvas');
    var ctx = canvas.getContext('2d');
    var width = canvas.width;
    var height = canvas.height;

    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x * width, pathPoints[0].y * height);
    for (var i = 1; i < pathPoints.length; i++) {
        ctx.lineTo(pathPoints[i].x * width, pathPoints[i].y * height);
    }
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 5;
    ctx.stroke();
}

// 加載使用者圖標
var userIcon = new Image();
userIcon.src = 'user-unscreen.gif'; // 請將 'user-unscreen.gif' 替換為您的 GIF 圖片路徑

// 在頁面加載時繪製點
window.onload = function() {
    resizeCanvas();
    drawBoundaryPoints();
}

function calculateRoute() {
    // 取得使用者輸入的座標
    var xInput = parseFloat(document.getElementById('x-coordinate').value);
    var yInput = parseFloat(document.getElementById('y-coordinate').value);

    var canvas = document.getElementById('routeCanvas');
    var width = canvas.width;
    var height = canvas.height;

    var x = xInput / 600; // 將座標轉換為百分比
    var y = yInput / 800;

    if (isNaN(xInput) || isNaN(yInput) || xInput < 0 || xInput > 600 || yInput < 0 || yInput > 800) {
        alert('請輸入有效的座標（X: 0-600, Y: 0-800）');
        return;
    }

    // 出口位置（使用百分比）
    var exits = [
        { x: 25 / 600, y: 25 / 800 },     // 出口1
        { x: 565 / 600, y: 25 / 800 },    // 出口2
        { x: 25 / 600, y: 765 / 800 },    // 出口3
        { x: 565 / 600, y: 765 / 800 }    // 出口4
    ];

    // 定義走廊出口點（走廊邊緣，靠近房間）
    var corridorExits = [
        { x: corridor.x1, y: corridor.y1 }, // 左上角
        { x: corridor.x2, y: corridor.y1 }, // 右上角
        { x: corridor.x1, y: corridor.y2 }, // 左下角
        { x: corridor.x2, y: corridor.y2 }  // 右下角
    ];

    // 找到最近的出口和對應的走廊出口點
    var minDistance = Infinity;
    var nearestExit = null;
    var corridorExitPoint = null;

    for (var i = 0; i < exits.length; i++) {
        // 計算走廊出口點到出口的距離
        var ce = corridorExits[i];
        var e = exits[i];
        var distance = Math.hypot(ce.x - e.x, ce.y - e.y);
        // 計算使用者到走廊出口點的距離
        var userToCorridorExit = Math.hypot(x - ce.x, y - ce.y);
        // 總距離
        var totalDistance = distance + userToCorridorExit;

        if (totalDistance < minDistance) {
            minDistance = totalDistance;
            nearestExit = e;
            corridorExitPoint = ce;
        }
    }

    // 路線點集合
    var pathPoints = [{ x: x, y: y }];

    // 定義靠近房間的走廊邊緣位置（左或右）
    var corridorEdgeX = x < (corridor.x1 + corridor.x2) / 2 ? corridor.x1 : corridor.x2;

    // 如果使用者不在走廊內，先移動到走廊入口
    var userInCorridor = x >= corridor.x1 && x <= corridor.x2 && y >= corridor.y1 && y <= corridor.y2;

    if (!userInCorridor) {
        // 計算使用者位置與走廊邊緣的最近點
        var nearestX = corridorEdgeX;
        var nearestY = Math.max(corridor.y1, Math.min(y, corridor.y2));
        pathPoints.push({ x: nearestX, y: nearestY });
    } else {
        // 使用者在走廊內，先移動到走廊邊緣
        if (x !== corridorEdgeX) {
            pathPoints.push({ x: corridorEdgeX, y: y });
        }
    }

    // 沿著走廊邊緣移動到走廊出口點
    if (pathPoints[pathPoints.length - 1].y !== corridorExitPoint.y) {
        pathPoints.push({ x: corridorEdgeX, y: corridorExitPoint.y });
    }

    // 從走廊出口點移動到出口
    pathPoints.push(nearestExit);

    // 儲存當前路徑點以便重新繪製
    currentPathPoints = pathPoints;

    // 繪製路線
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height); // 清除之前的繪圖

    // 重新繪製30個邊界點
    drawBoundaryPoints();

    // 繪製路線
    drawRoute(pathPoints);

    // 移動使用者圖標，貼齊右下角
    var userIconElement = document.getElementById('userIcon');
    userIconElement.style.left = (x * 100) + '%';
    userIconElement.style.top = ((y+0.03) * 100) + '%';
    userIconElement.style.transform = 'translate(-50%, -100%)'; /* 使圖標底部中心對齊座標 */
    userIconElement.style.display = 'block';

    // 繪製出口位置
    ctx.beginPath();
    ctx.arc(nearestExit.x * width, nearestExit.y * height, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'green';
    ctx.fill();
}
