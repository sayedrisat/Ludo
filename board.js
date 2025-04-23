const canvas = document.getElementById('ludo-board');
const ctx = canvas.getContext('2d');
const boardSize = 600;
const cellSize = boardSize / 15;
const colors = { red: '#ff0000', green: '#00ff00', yellow: '#ffff00', blue: '#0000ff' };
const safeZones = [8, 13, 21, 26, 34, 39, 47, 52]; // Safe zone indices on the path

let boardState = initializeBoard();
let tokenPositions = initializeTokenPositions();

function initializeBoard() {
  const board = {
    red: { home: [0, 1, 2, 3], path: [], homePath: [] },
    green: { home: [0, 1, 2, 3], path: [], homePath: [] },
    yellow: { home: [0, 1, 2, 3], path: [], homePath: [] },
    blue: { home: [0, 1, 2, 3], path: [], homePath: [] },
    path: Array(52).fill(null) // Main path (0-51)
  };
  return board;
}

function initializeTokenPositions() {
  const positions = {};
  Object.keys(colors).forEach(color => {
    positions[color] = {};
    [0, 1, 2, 3].forEach(token => {
      positions[color][token] = { x: 0, y: 0, targetX: 0, targetY: 0, moving: false, stepsLeft: 0 };
    });
  });
  return positions;
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw outer square
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, boardSize, boardSize);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(0, 0, boardSize, boardSize);

  // Draw home squares
  drawHomeSquare(0, 0, colors.red);
  drawHomeSquare(9 * cellSize, 0, colors.green);
  drawHomeSquare(0, 9 * cellSize, colors.blue);
  drawHomeSquare(9 * cellSize, 9 * cellSize, colors.yellow);

  // Draw main path
  const path = [];
  for (let i = 0; i < 13; i++) path.push({ x: 6, y: i }); // Down (red start)
  for (let i = 0; i < 6; i++) path.push({ x: 7 + i, y: 12 }); // Right
  for (let i = 0; i < 13; i++) path.push({ x: 12, y: 12 - i }); // Up (green start)
  for (let i = 0; i < 6; i++) path.push({ x: 11 - i, y: 0 }); // Left
  for (let i = 0; i < 13; i++) path.push({ x: 6, y: i }); // Down (yellow start)
  for (let i = 0; i < 6; i++) path.push({ x: 5 - i, y: 12 }); // Left
  for (let i = 0; i < 13; i++) path.push({ x: 0, y: 12 - i }); // Up (blue start)
  for (let i = 0; i < 6; i++) path.push({ x: 1 + i, y: 0 }); // Right

  path.forEach((pos, i) => {
    ctx.fillStyle = safeZones.includes(i) ? '#ddd' : '#fff';
    ctx.fillRect(pos.x * cellSize, pos.y * cellSize, cellSize, cellSize);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(pos.x * cellSize, pos.y * cellSize, cellSize, cellSize);
  });

  // Draw home paths
  drawHomePath(6, 1, colors.red, 'vertical');
  drawHomePath(8, 6, colors.green, 'horizontal');
  drawHomePath(6, 8, colors.yellow, 'vertical');
  drawHomePath(1, 6, colors.blue, 'horizontal');

  // Draw center home triangle
  drawCenterHome();

  // Draw tokens
  drawTokens();
}

function drawHomeSquare(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 6 * cellSize, 6 * cellSize);
  ctx.strokeRect(x, y, 6 * cellSize, 6 * cellSize);
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      ctx.beginPath();
      ctx.arc(
        x + (2 + i * 2) * cellSize,
        y + (2 + j * 2) * cellSize,
        cellSize / 2,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.stroke();
    }
  }
}

function drawHomePath(x, y, color, direction) {
  ctx.fillStyle = color;
  if (direction === 'vertical') {
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(x * cellSize, (y + i) * cellSize, cellSize, cellSize);
      ctx.strokeRect(x * cellSize, (y + i) * cellSize, cellSize, cellSize);
    }
  } else {
    for (let i = 0; i < 5; i++) {
      ctx.fillRect((x + i) * cellSize, y * cellSize, cellSize, cellSize);
      ctx.strokeRect((x + i) * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
}

function drawCenterHome() {
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(6 * cellSize, 6 * cellSize);
  ctx.lineTo(9 * cellSize, 6 * cellSize);
  ctx.lineTo(7.5 * cellSize, 9 * cellSize);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawTokens() {
  Object.keys(boardState).slice(0, 4).forEach(color => {
    // Draw tokens in home
    boardState[color].home.forEach((token, i) => {
      let x, y;
      if (color === 'red') { x = 2 + (i % 2) * 2; y = 2 + Math.floor(i / 2) * 2; }
      else if (color === 'green') { x = 11 + (i % 2) * 2; y = 2 + Math.floor(i / 2) * 2; }
      else if (color === 'blue') { x = 2 + (i % 2) * 2; y = 11 + Math.floor(i / 2) * 2; }
      else { x = 11 + (i % 2) * 2; y = 11 + Math.floor(i / 2) * 2; }
      tokenPositions[color][token].x = x * cellSize + cellSize / 2;
      tokenPositions[color][token].y = y * cellSize + cellSize / 2;
      drawToken(tokenPositions[color][token].x, tokenPositions[color][token].y, colors[color]);
    });

    // Draw tokens on path
    boardState[color].path.forEach(({ token, index }) => {
      const pos = getPathPosition(index, color);
      tokenPositions[color][token].targetX = pos.x * cellSize + cellSize / 2;
      tokenPositions[color][token].targetY = pos.y * cellSize + cellSize / 2;
      if (!tokenPositions[color][token].moving) {
        tokenPositions[color][token].x = tokenPositions[color][token].targetX;
        tokenPositions[color][token].y = tokenPositions[color][token].targetY;
      }
      drawToken(tokenPositions[color][token].x, tokenPositions[color][token].y, colors[color]);
    });

    // Draw tokens in home path
    boardState[color].homePath.forEach(({ token, index }) => {
      const pos = getHomePathPosition(index, color);
      tokenPositions[color][token].targetX = pos.x * cellSize + cellSize / 2;
      tokenPositions[color][token].targetY = pos.y * cellSize + cellSize / 2;
      if (!tokenPositions[color][token].moving) {
        tokenPositions[color][token].x = tokenPositions[color][token].targetX;
        tokenPositions[color][token].y = tokenPositions[color][token].targetY;
      }
      drawToken(tokenPositions[color][token].x, tokenPositions[color][token].y, colors[color]);
    });
  });

  // Animate token movement
  let anyMoving = false;
  Object.keys(tokenPositions).forEach(color => {
    Object.keys(tokenPositions[color]).forEach(token => {
      const pos = tokenPositions[color][token];
      if (pos.moving && pos.stepsLeft > 0) {
        anyMoving = true;
        const dx = (pos.targetX - pos.x) / pos.stepsLeft;
        const dy = (pos.targetY - pos.y) / pos.stepsLeft;
        pos.x += dx;
        pos.y += dy;
        pos.stepsLeft--;
        if (pos.stepsLeft <= 0) {
          pos.moving = false;
          pos.x = pos.targetX;
          pos.y = pos.targetY;
        }
      }
    });
  });

  if (anyMoving) {
    requestAnimationFrame(drawBoard);
  }
}

function drawToken(x, y, color) {
  ctx.beginPath();
  ctx.arc(x, y, cellSize / 3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, cellSize / 6, 0, Math.PI * 2);
  ctx.fill();
}

function getPathPosition(index, color) {
  const path = [];
  for (let i = 0; i < 13; i++) path.push({ x: 6, y: i });
  for (let i = 0; i < 6; i++) path.push({ x: 7 + i, y: 12 });
  for (let i = 0; i < 13; i++) path.push({ x: 12, y: 12 - i });
  for (let i = 0; i < 6; i++) path.push({ x: 11 - i, y: 0 });
  for (let i = 0; i < 13; i++) path.push({ x: 6, y: i });
  for (let i = 0; i < 6; i++) path.push({ x: 5 - i, y: 12 });
  for (let i = 0; i < 13; i++) path.push({ x: 0, y: 12 - i });
  for (let i = 0; i < 6; i++) path.push({ x: 1 + i, y: 0 });

  const startIndices = { red: 0, green: 13, yellow: 26, blue: 39 };
  const adjustedIndex = (startIndices[color] + index) % 52;
  return path[adjustedIndex];
}

function getHomePathPosition(index, color) {
  const homePaths = {
    red: Array.from({ length: 5 }, (_, i) => ({ x: 6, y: 1 + i })),
    green: Array.from({ length: 5 }, (_, i) => ({ x: 8 + i, y: 6 })),
    yellow: Array.from({ length: 5 }, (_, i) => ({ x: 6, y: 8 + i })),
    blue: Array.from({ length: 5 }, (_, i) => ({ x: 1 + i, y: 6 }))
  };
  return homePaths[color][index];
}

drawBoard();
