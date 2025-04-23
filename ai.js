function aiMove(player, validTokens) {
  let chosenToken = null;

  // Prioritize cutting opponent's token
  validTokens.forEach(token => {
    let newIndex;
    if (boardState[player.color].home.includes(token)) {
      if (diceResult === 6) {
        newIndex = getStartIndex(player.color);
      }
    } else {
      const pathToken = boardState[player.color].path.find(t => t.token === token);
      newIndex = pathToken.index + diceResult;
    }
    if (newIndex !== undefined && !safeZones.includes(newIndex)) {
      players.forEach(p => {
        if (p.color !== player.color) {
          if (p.path.some(t => t.index === newIndex)) {
            chosenToken = token;
          }
        }
      });
    }
  });

  // If no cut possible, move furthest token
  if (!chosenToken) {
    let maxIndex = -1;
    validTokens.forEach(token => {
      if (boardState[player.color].home.includes(token)) {
        if (diceResult === 6) chosenToken = token;
      } else {
        const pathToken = boardState[player.color].path.find(t => t.token === token);
        if (pathToken.index > max  maxIndex) {
          maxIndex = pathToken.index;
          chosenToken = token;
        }
      }
    });
  }

  if (chosenToken) {
    moveToken(player, chosenToken);
  } else {
    nextTurn();
  }
}
