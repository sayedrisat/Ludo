const canvas = document.getElementById('ludo-board');
const ctx = canvas.getContext('2d');
const boardSize = 600;
const cellSize = boardSize / 15;
const colors = { red: '#ff0000', green: '#00ff00', yellow: '#ffff00', blue: '#0000ff' };
const safeZones = [0, 8, 13, 21, 26, 34, 39, 47]; // Example safe zone indices

let boardState = initializeBoard();

function initializeBoard() {
  const board = {
    red: { home: [0, 1, 2, 3], path: [] },
    green: { home: [0, 1, 2, 3], path: [] },
    yellow: { home: [0, 1, 2, 3], path: [] },
    blue: { home: [0, 1, 2, 3], path: [] },
    path: Array(52).fill(null), // Main path
    homePaths: { red: [], green: [], yellow: [], blue: [] } // Home entry paths
  };
  return board;
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw base squares
  drawBaseSquare(0, 0, colors.red);
  drawBaseSquare(9 * cellSize, 0, colors.green);
  drawBaseSquare(0, 9 * cellSize, colors.blue);
  drawBaseSquare(9 * cellSize, 9 * cellSize, colors.yellow);

  // Draw path
  const path = [
    // Simplified path coordinates (indices mapped to grid)
    ...Array.from({length: 13}, (_, i) => ({ x: 6, y: i })),
    ...Array.from({length: 6}, (_, i) => ({ x: 7 + i, y: 12 })),
    ...Array.from({length: 13}, (_, i) => ({ x: 12, y: 12 - i })),
    ...Array.from({length: 6}, (_, i) => ({ x: 11 - i, y: 0 })),
    ...Array.from({length: 13}, (_, i) => ({ x: 6, y: i }))
  ];

  path.forEach((pos, i) => {
    ctx.fillStyle = safeZones.includes(i) ? '#ddd' : '#fff';
    ctx.fillRect(pos.x * cellSize, pos.y * cellSize, cellSize, cellSize);
    ctx.strokeRect(pos.x * cellSize, pos.y * cellSize, cellSize, cellSize);
  });

  // Draw home paths and center
  drawHomePath(6, 1, colors.red);
  drawHomePath(8, 6, colors.green);
  drawHomePath(1, 6, colors.blue);
  drawHomePath(6, 8, colors.yellow);
  drawCenterHome();
  drawTokens();
}

function drawBaseSquare(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 6 * cellSize, 6 * cellSize);
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

function drawHomePath(x, y, color) {
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = color;
    ctx.fillRect(x * cellSize, (y + i) * cellSize, cellSize, cellSize);
    ctx.strokeRect(x * cellSize, (y + i) * cellSize, cellSize, cellSize);
  }
}

function drawCenterHome() {
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(6 * cellSize, 6 * cellSize);
  ctx.lineTo(9 * cellSize, 6 * cellSize);
  ctx.lineTo(7.5 * cellSize, 9 * cellSize);
  ctx.fill();
}

function drawTokens() {
  Object.keys(boardState).slice(0, 4).forEach(color => {
    boardState[color].home.forEach((token, i) => {
      if (token !== null) {
        let x, y;
        if (color === 'red') { x = 2 + (i % 2) * 2; y = 2 + Math.floor(i / 2) * 2; }
        else if (color === 'green') { x = 11 + (i % 2) * 2; y = 2 + Math.floor(i / 2) * 2; }
        else if (color === 'blue') { x = 2 + (i % 2) * 2; y = 11 + Math.floor(i / 2) * 2; }
        else { x = 11 + (i % 2) * 2; y = 11 + Math.floor(i / 2) * 2; }
        drawToken(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, colors[color]);
      }
    });
    boardState[color].path.forEach(({ index, token }) => {
      const pos = getPathPosition(index);
      drawToken(pos.x * cellSize + cellSize / 2, pos.y * cellSize + cellSize / 2, colors[color]);
    });
  });
}

function drawToken(x, y, color) {
  ctx.beginPath();
  ctx.arc(x, y, cellSize / 3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();
}

function getPathPosition(index) {
  const path = [
    ...Array.from({length: 13}, (_, i) => ({ x: 6, y: i })),
    ...Array.from({length: 6}, (_, i) => ({ x: 7 + i, y: 12 })),
    ...Array.from({length: 13}, (_, i) => ({ x: 12, y: 12 - i })),
    ...Array.from({length: 6}, (_, i) => ({ x: 11 - i, y: 0 })),
    ...Array.from({length: 13}, (_, i) => ({ x: 6, y: i }))
  ];
  return path[index % 52];
}

drawBoard();
