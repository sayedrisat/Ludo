const canvas = document.getElementById('ludo-board');
const ctx = canvas.getContext('2d');
const boardSize = 600;
const cellSize = boardSize / 15;
const colors = { red: '#ff0000', green: '#00ff00', yellow: '#ffff00', blue: '#0000ff' };
const safeZones = [0, 13, 26, 39]; // Starting squares (marked with stars)
const coloredSquares = { 5: 'yellow', 18: 'green', 31: 'blue', 44: 'red' }; // Colored squares before home paths

let boardState = initializeBoard();
let tokenPositions = initializeTokenPositions();
let highlightedTokens = [];

function initializeBoard() {
  const board = {
    red: { home: [0, 1, 2, 3], path: [], homePath: [], locked: [0, 1, 2, 3] },
    green: { home: [0, 1, 2, 3], path: [], homePath: [], locked: [0, 1, 2, 3] },
    yellow: { home: [0, 1, 2, 3], path: [], homePath: [], locked: [0, 1, 2, 3] },
    blue: { home: [0, 1, 2, 3], path: [], homePath: [], locked: [0, 1, 2, 3] },
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

  // Draw home squares (adjusted positions)
  drawHomeSquare(0, 9 * cellSize, colors.red);    // Red: bottom-left
  drawHomeSquare(0, 0, colors.green);             // Green: top-left
  drawHomeSquare(9 * cellSize, 9 * cellSize, colors.blue); // Blue: bottom-right
  drawHomeSquare(9 * cellSize, 0, colors.yellow); // Yellow: top-right

  // Draw main path (counterclockwise from Red start at bottom-left)
  const path = [];
  // Bottom-left to top-left (Red start)
  for (let i = 0; i < 2; i++) path.push({ x: 6, y: 13 - i }); // Up
  for (let i = 0; i < 6; i++) path.push({ x: 5, y: 11 - i }); // Up
  for (let i = 0; i < 2; i++) path.push({ x: 5, y: 5 - i }); // Up
  // Top-left to top-right (Green start)
  for (let i = 0; i < 6; i++) path.push({ x: 5 + i, y: 4 }); // Right
  for (let i = 0; i < 2; i++) path.push({ x: 11 + i, y: 4 }); // Right
  for (let i = 0; i < 6; i++) path.push({ x: 13, y: 5 + i }); // Down
  // Top-right to bottom-right (Yellow start)
  for (let i = 0; i < 2; i++) path.push({ x: 13, y: 11 + i }); // Down
  for (let i = 0; i < 6; i++) path.push({ x: 12 - i, y: 13 }); // Left
  for (let i = 0; i < 2; i++) path.push({ x: 6 - i, y: 13 }); // Left
  // Bottom-right to bottom-left (Blue start)
  for (let i = 0; i < 6; i++) path.push({ x: 4, y: 12 - i }); // Up
  for (let i = 0; i < 2; i++) path.push({ x: 4, y: 6 - i }); // Up
  for (let i = 0; i < 6; i++) path.push({ x: 5 + i, y: 2 }); // Right
  for (let i = 0; i < 2; i++) path.push({ x: 11 + i, y: 2 }); // Right
  for (let i = 0; i < 6; i++) path.push({ x: 12, y: 3 + i }); // Down

  path.forEach((pos, i) => {
    ctx.fillStyle = coloredSquares[i] ? colors[coloredSquares[i]] : '#fff';
    ctx.fillRect(pos.x * cellSize, pos.y * cellSize, cellSize, cellSize);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(pos.x * cellSize, pos.y * cellSize, cellSize, cellSize);
    if (safeZones.includes(i)) {
      ctx.fillStyle = '#000';
      ctx.font = `${cellSize / 2}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', pos.x * cellSize + cellSize / 2, pos.y * cellSize + cellSize / 2);
    }
  });

  // Draw arrows on the path
  drawArrows(path);

  // Draw home paths (adjusted orientations)
  drawHomePath(6, 8, colors.red, 'vertical');    // Red: from bottom
  drawHomePath(1, 6, colors.green, 'horizontal'); // Green: from left
  drawHomePath(8, 6, colors.blue, 'horizontal');  // Blue: from right
  drawHomePath(6, 1, colors.yellow, 'vertical');  // Yellow: from top

  // Draw center home triangle (adjusted colors)
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
        cellSize,
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
  ctx.fillStyle = colors.red;
  ctx.beginPath();
  ctx.moveTo(6 * cellSize, 8 * cellSize);
  ctx.lineTo(7 * cellSize, 7 * cellSize);
  ctx.lineTo(8 * cellSize, 8 * cellSize);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = colors.green;
  ctx.beginPath();
  ctx.moveTo(6 * cellSize, 6 * cellSize);
  ctx.lineTo(7 * cellSize, 7 * cellSize);
  ctx.lineTo(6 * cellSize, 8 * cellSize);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = colors.yellow;
  ctx.beginPath();
  ctx.moveTo(6 * cellSize, 6 * cellSize);
  ctx.lineTo(7 * cellSize, 7 * cellSize);
  ctx.lineTo(8 * cellSize, 6 * cellSize);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = colors.blue;
  ctx.beginPath();
  ctx.moveTo(8 * cellSize, 6 * cellSize);
  ctx.lineTo(7 * cellSize, 7 * cellSize);
  ctx.lineTo(8 * cellSize, 8 * cellSize);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawArrows(path) {
  const arrowPositions = [6, 19, 32, 45]; // Positions just after each colored square
  arrowPositions.forEach((posIndex, i) => {
    const pos = path[posIndex];
    ctx.fillStyle = '#000';
    ctx.font = `${cellSize / 2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const directions = ['↑', '→', '↓', '←']; // Red (up), Green (right), Blue (down), Yellow (left)
    ctx.fillText(directions[i], pos.x * cellSize + cellSize / 2, pos.y * cellSize + cellSize / 2);
  });
}

function drawTokens() {
  Object.keys(boardState).slice(0, 4).forEach(color => {
    // Draw tokens in home
    boardState[color].home.forEach((token, i) => {
      let x, y;
      if (color === 'red') { x = 2 + (i % 2) * 2; y = 11 + Math.floor(i / 2) * 2; } // bottom-left
      else if (color === 'green') { x = 2 + (i % 2) * 2; y = 2 + Math.floor(i / 2) * 2; } // top-left
      else if (color === 'blue') { x = 11 + (i % 2) * 2; y = 11 + Math.floor(i / 2) * 2; } // bottom-right
      else { x = 11 + (i % 2) * 2; y = 2 + Math.floor(i / 2) * 2; } // top-right
      tokenPositions[color][token].x = x * cellSize + cellSize / 2;
      tokenPositions[color][token].y = y * cellSize + cellSize / 2;
      drawToken(tokenPositions[color][token].x, tokenPositions[color][token].y, colors[color], highlightedTokens.includes(`${color}-${token}`));
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
      drawToken(tokenPositions[color][token].x, tokenPositions[color][token].y, colors[color], highlightedTokens.includes(`${color}-${token}`));
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
      drawToken(tokenPositions[color][token].x, tokenPositions[color][token].y, colors[color], highlightedTokens.includes(`${color}-${token}`));
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

function drawToken(x, y, color, highlighted) {
  ctx.beginPath();
  ctx.arc(x, y, cellSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (highlighted) {
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 5;
    ctx.stroke();
  }
}

function getPathPosition(index, color) {
  const path = [];
  // Bottom-left to top-left (Red start)
  for (let i = 0; i < 2; i++) path.push({ x: 6, y: 13 - i });
  for (let i = 0; i < 6; i++) path.push({ x: 5, y: 11 - i });
  for (let i = 0; i < 2; i++) path.push({ x: 5, y: 5 - i });
  // Top-left to top-right (Green start)
  for (let i = 0; i < 6; i++) path.push({ x: 5 + i, y: 4 });
  for (let i = 0; i < 2; i++) path.push({ x: 11 + i, y: 4 });
  for (let i = 0; i < 6; i++) path.push({ x: 13, y: 5 + i });
  // Top-right to bottom-right (Yellow start)
  for (let i = 0; i < 2; i++) path.push({ x: 13, y: 11 + i });
  for (let i = 0; i < 6; i++) path.push({ x: 12 - i, y: 13 });
  for (let i = 0; i < 2; i++) path.push({ x: 6 - i, y: 13 });
  // Bottom-right to bottom-left (Blue start)
  for (let i = 0; i < 6; i++) path.push({ x: 4, y: 12 - i });
  for (let i = 0; i < 2; i++) path.push({ x: 4, y: 6 - i });
  for (let i = 0; i < 6; i++) path.push({ x: 5 + i, y: 2 });
  for (let i = 0; i < 2; i++) path.push({ x: 11 + i, y: 2 });
  for (let i = 0; i < 6; i++) path.push({ x: 12, y: 3 + i });

  const startIndices = { red: 0, green: 13, yellow: 26, blue: 39 };
  const adjustedIndex = (startIndices[color] + index) % 52;
  return path[adjustedIndex];
}

function getHomePathPosition(index, color) {
  const homePaths = {
    red: Array.from({ length: 5 }, (_, i) => ({ x: 6, y: 8 + i })), // from bottom
    green: Array.from({ length: 5 }, (_, i) => ({ x: 1 + i, y: 6 })), // from left
    yellow: Array.from({ length: 5 }, (_, i) => ({ x: 6, y: 1 + i })), // from top
    blue: Array.from({ length: 5 }, (_, i) => ({ x: 8 + i, y: 6 })) // from right
  };
  return homePaths[color][index];
}

drawBoard();
