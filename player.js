let players = [];
let currentPlayerIndex = 0;
let diceResult = 0;
let gameState = 'setup';

function setupPlayers(numPlayers, config) {
  players = [];
  const colors = ['red', 'green', 'yellow', 'blue'].slice(0, numPlayers);
  config.forEach((type, i) => {
    players.push({
      color: colors[i],
      type: type,
      tokens: [0, 1, 2, 3], // Indices in boardState[color].home
      homeTokens: 0
    });
  });
  gameState = 'playing';
  currentPlayerIndex = 0;
  updateTurn();
}

function rollDice() {
  diceResult = Math.floor(Math.random() * 6) + 1;
  document.getElementById('dice-result').textContent = `Dice: ${diceResult}`;
  document.getElementById('dice-result').classList.add('rolling');
  setTimeout(() => {
    document.getElementById('dice-result').classList.remove('rolling');
    checkValidMoves();
  }, 500);
}

function checkValidMoves() {
  const player = players[currentPlayerIndex];
  const validTokens = [];

  player.tokens.forEach(token => {
    if (boardState[player.color].home.includes(token)) {
      if (diceResult === 6) validTokens.push(token);
    } else {
      const index = boardState[player.color].path.find(t => t.token === token)?.index;
      if (index !== undefined && index + diceResult <= 52) {
        validTokens.push(token);
      }
    }
  });

  if (validTokens.length === 0) {
    nextTurn();
  } else if (player.type === 'ai') {
    setTimeout(() => aiMove(player, validTokens), 1000);
  } else {
    highlightMovableTokens(validTokens, player.color);
  }
}

function moveToken(player, token) {
  const color = player.color;
  if (boardState[color].home.includes(token) && diceResult === 6) {
    boardState[color].home = boardState[color].home.filter(t => t !== token);
    boardState[color].path.push({ token, index: getStartIndex(color) });
  } else {
    const pathToken = boardState[color].path.find(t => t.token === token);
    if (pathToken) {
      const newIndex = pathToken.index + diceResult;
      if (newIndex < 52) {
        pathToken.index = newIndex;
        checkForCut(newIndex, color);
      } else if (newIndex === 52) {
        boardState[color].path = boardState[color].path.filter(t => t.token !== token);
        player.homeTokens++;
        checkWin(player);
      }
    }
  }
  drawBoard();
  if (diceResult !== 6 || gameState === 'ended') {
    nextTurn();
  } else {
    updateTurn();
  }
}

function checkForCut(index, color) {
  players.forEach(p => {
    if (p.color !== color && !safeZones.includes(index)) {
      const cutToken = p.path.find(t => t.index === index);
      if (cutToken) {
        p.path = p.path.filter(t => t.token !== cutToken.token);
        boardState[p.color].home.push(cutToken.token);
        alert('Cut!');
      }
    }
  });
}

function checkWin(player) {
  if (player.homeTokens === 4) {
    gameState = 'ended';
    alert(`${player.color.charAt(0).toUpperCase() + player.color.slice(1)} Player (${player.type}) Won!`);
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'block';
  }
}

function nextTurn() {
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  updateTurn();
}

function updateTurn() {
  const player = players[currentPlayerIndex];
  document.getElementById('current-player').textContent = `${player.color.charAt(0).toUpperCase() + player.color.slice(1)} Player (${player.type})`;
  document.getElementById('roll-dice').disabled = player.type === 'ai';
  if (player.type === 'ai') {
    setTimeout(() => rollDice(), 1000);
  }
}

function getStartIndex(color) {
  return { red: 0, green: 13, yellow: 26, blue: 39 }[color];
}

function highlightMovableTokens(tokens, color) {
  canvas.addEventListener('click', function handler(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    tokens.forEach(token => {
      let pos;
      if (boardState[color].home.includes(token)) {
        const i = boardState[color].home.indexOf(token);
        let tx, ty;
        if (color === 'red') { tx = 2 + (i % 2) * 2; ty = 2 + Math.floor(i / 2) * 2; }
        else if (color === 'green') { tx = 11 + (i % 2) * 2; ty = 2 + Math.floor(i / 2) * 2; }
        else if (color === 'blue') { tx = 2 + (i % 2) * 2; ty = 11 + Math.floor(i / 2) * 2; }
        else { tx = 11 + (i % 2) * 2; ty = 11 + Math.floor(i / 2) * 2; }
        pos = { x: tx * cellSize + cellSize / 2, y: ty * cellSize + cellSize / 2 };
      } else {
        const pathToken = boardState[color].path.find(t => t.token === token);
        pos = getPathPosition(pathToken.index);
        pos = { x: pos.x * cellSize + cellSize / 2, y: pos.y * cellSize + cellSize / 2 };
      }
      if (Math.hypot(x - pos.x, y - pos.y) < cellSize / 3) {
        moveToken(players[currentPlayerIndex], token);
        canvas.removeEventListener('click', handler);
      }
    });
  });
}
