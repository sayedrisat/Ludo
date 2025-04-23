document.getElementById('num-players').addEventListener('change', updatePlayerConfig);
document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('roll-dice').addEventListener('click', () => {
  if (players[currentPlayerIndex].type === 'human' && gameState === 'playing') {
    rollDice();
  }
});

function updatePlayerConfig() {
  const numPlayers = parseInt(document.getElementById('num-players').value);
  const playerConfig = document.getElementById('player-config');
  playerConfig.innerHTML = '';
  for (let i = 0; i < numPlayers; i++) {
    const div = document.createElement('div');
    div.innerHTML = `
      <label>Player ${i + 1} (${['Red', 'Green', 'Yellow', 'Blue'][i]}):</label>
      <select id="player-${i}-type">
        <option value="human">Human</option>
        <option value="ai">AI</option>
      </select>
    `;
    playerConfig.appendChild(div);
  }
}

function startGame() {
  const numPlayers = parseInt(document.getElementById('num-players').value);
  const config = [];
  for (let i = 0; i < numPlayers; i++) {
    config.push(document.getElementById(`player-${i}-type`).value);
  }
  setupPlayers(numPlayers, config);
  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';
  drawBoard();
}

updatePlayerConfig();
