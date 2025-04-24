let players = [];
let currentPlayerIndex = 0;
let diceResult = 0;
let gameState = 'setup';
let consecutiveSixes = 0;
let rollQueue = [];
let moveQueue = [];
let rankings = [];

function setupPlayers(numPlayers, config) {
  players = [];
  const colors = ['red', 'green', 'yellow', 'blue'].slice(0, numPlayers);
  config.forEach((type, i) => {
    players.push({
      color: colors[i],
      type: type,
      tokens: [0, 1, 2, 3],
      homeTokens: 0,
      rank: null
    });
  });
  gameState = 'playing';
  currentPlayerIndex = 0;
  consecutiveSixes = 0;
  rollQueue = [];
  moveQueue = [];
  rankings = [];
  updateTurn();
}

function rollDice() {
  document.getElementById('dice-result').textContent = '🎲';
  document.getElementById('dice-result').classList.add('rolling');
  document.getElementById('roll-dice').disabled = true;
  setTimeout(() => {
    diceResult = Math.floor(Math.random() * 6) + 1;
    document.getElementById('dice-result').textContent = diceResult;
    document.getElementById('dice-result').classList.remove('rolling');
    rollQueue.push(diceResult);
    if (diceResult === 6) {
      consecutiveSixes++;
      if (consecutiveSixes === 3) {
        rollQueue = rollQueue.slice(0, -3);
        consecutiveSixes = 0;
        document.getElementById('move-message').textContent = 'Three 6s in a row! Turn skipped.';
        setTimeout(nextTurn, 1000);
      } else {
        document.getElementById('move-message').textContent = 'Rolled a 6! Roll again.';
        document.getElementById('roll-dice').disabled = false;
      }
    } else {
      consecutiveSixes = 0;
      moveQueue = [...rollQueue];
      rollQueue = [];
      checkValidMoves();
    }
  }, 1000);
}

function checkValidMoves() {
  if (moveQueue.length === 0) {
    setTimeout(nextTurn, 500);
    return;
  }

  const player = players[currentPlayerIndex];
  const validTokens = [];

  const canUnlock = boardState[player.color].locked.length > 0 && moveQueue[0] === 6;
  const allUnlocked = boardState[player.color].locked.length === 0;

  if (canUnlock) {
    boardState[player.color].locked.forEach(token => {
      validTokens.push(token);
    });
  } else if (allUnlocked) {
    player.tokens.forEach(token => {
      const pathToken = boardState[player.color].path.find(t => t.token === token);
      const homePathToken = boardState[player.color].homePath.find(t => t.token === token);
      if (pathToken) {
        const newIndex = pathToken.index + moveQueue[0];
        if (newIndex <= 56) {
          validTokens.push(token);
        }
      } else if (homePathToken) {
        const newIndex = homePathToken.index + moveQueue[0];
        if (newIndex <= 5) {
          validTokens.push(token);
        }
      }
    });
  }

  if (validTokens.length === 0) {
    document.getElementById('move-message').textContent = `No valid moves for ${moveQueue[0]}.`;
    moveQueue.shift();
    setTimeout(() => checkValidMoves(), 1000);
  } else {
    document.getElementById('move-message').textContent = `Select a token to move ${moveQueue[0]} spaces.`;
    highlightMovableTokens(validTokens, player.color);
    if (player.type === 'ai') {
      setTimeout(() => aiMove(player, validTokens), 1000);
    }
  }
}

function moveToken(player, token) {
  const color = player.color;
  const steps = moveQueue[0]; // Use the first move in the queue
  let moved = false;

  if (boardState[color].locked.includes(token) && steps === 6) {
    boardState[color].locked = boardState[color].locked.filter(t => t !== token);
    boardState[color].home = boardState[color].home.filter(t => t !== token);
    boardState[color].path.push({ token, index: 0 });
    moved = true;
    document.getElementById('move-message').textContent = `Token ${token} unlocked!`;
  } else if (boardState[color].locked.length === 0) {
    let pathToken = boardState[color].path.find(t => t.token === token);
    let homePathToken = boardState[color].homePath.find(t => t.token === token);

    if (pathToken) {
      const newIndex = pathToken.index + steps;
      if (newIndex < 51) {
        pathToken.index = newIndex;
        checkForCut(newIndex, color);
        moved = true;
      } else if (newIndex <= 56) {
        boardState[color].path = boardState[color].path.filter(t => t.token !== token);
        const homeIndex = newIndex - 51;
        boardState[color].homePath.push({ token, index: homeIndex });
        moved = true;
      }
    } else if (homePathToken) {
      const newIndex = homePathToken.index + steps;
      if (newIndex < 5) {
        homePathToken.index = newIndex;
        moved = true;
      } else if (newIndex === 5) {
        boardState[color].homePath = boardState[color].homePath.filter(t => t.token !== token);
        player.homeTokens++;
        checkWin(player);
        moved = true;
        document.getElementById('move-message').textContent = `Token ${token} reached home!`;
      }
    }
  }

  if (moved) {
    tokenPositions[color][token].moving = true;
    tokenPositions[color][token].stepsLeft = 10;
    drawBoard();
    moveQueue.shift(); // Remove the used move from the queue
  }

  highlightedTokens = [];
  drawBoard();

  if (moveQueue.length === 0) {
    setTimeout(nextTurn, 500);
  } else {
    checkValidMoves();
  }
}

function checkForCut(index, color) {
  if (safeZones.includes(index)) return;
  players.forEach(p => {
    if (p.color !== color) {
      const pathToken = boardState[p.color].path.find(t => t.index === index);
      if (pathToken) {
        boardState[p.color].path = boardState[p.color].path.filter(t => t.token !== pathToken.token);
        boardState[p.color].home.push(pathToken.token);
        boardState[p.color].locked.push(pathToken.token);
        document.getElementById('move-message').textContent = `${color} captured a ${p.color} token!`;
      }
    }
  });
}

function checkWin(player) {
  if (player.homeTokens === 4) {
    if (!player.rank) {
      player.rank = rankings.length + 1;
      rankings.push(player);
      alert(`${player.color.charAt(0).toUpperCase() + player.color.slice(1)} Player (${player.type}) is ${player.rank}${getOrdinalSuffix(player.rank)}!`);
    }
    if (rankings.length === players.length - 1) {
      gameState = 'ended';
      document.getElementById('game-screen').style.display = 'none';
      document.getElementById('setup-screen').style.display = 'block';
    }
  }
}

function getOrdinalSuffix(rank) {
  if (rank % 10 === 1 && rank !== 11) return 'st';
  if (rank % 10 === 2 && rank !== 12) return 'nd';
  if (rank % 10 === 3 && rank !== 13) return 'rd';
  return 'th';
}

function nextTurn() {
  do {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  } while (players[currentPlayerIndex].rank);
  document.getElementById('move-message').textContent = '';
  updateTurn();
}

function updateTurn() {
  if (gameState !== 'playing') return;
  const player = players[currentPlayerIndex];
  document.getElementById('current-player').textContent = `${player.color.charAt(0).toUpperCase() + player.color.slice(1)} Player (${player.type})`;
  document.getElementById('roll-dice').disabled = player.type === 'ai';
  if (player.type === 'ai') {
    setTimeout(() => rollDice(), 1000);
  } else {
    document.getElementById('roll-dice').disabled = false;
  }
}

function highlightMovableTokens(tokens, color) {
  highlightedTokens = tokens.map(token => `${color}-${token}`);
  drawBoard();

  canvas.removeEventListener('click', canvas.clickHandler);
  canvas.clickHandler = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let tokenClicked = null;

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
        const homePathToken = boardState[color].homePath.find(t => t.token === token);
        if (pathToken) {
          pos = getPathPosition(pathToken.index, color);
          pos = { x: pos.x * cellSize + cellSize / 2, y: pos.y * cellSize + cellSize / 2 };
        } else if (homePathToken) {
          pos = getHomePathPosition(homePathToken.index, color);
          pos = { x: pos.x * cellSize + cellSize / 2, y: pos.y * cellSize + cellSize / 2 };
        }
      }
      if (pos && Math.hypot(x - pos.x, y - pos.y) < cellSize / 2) {
        tokenClicked = token;
      }
    });

    if (tokenClicked !== null) {
      moveToken(players[currentPlayerIndex], tokenClicked);
      canvas.removeEventListener('click', canvas.clickHandler);
    }
  };
  canvas.addEventListener('click', canvas.clickHandler);
}
