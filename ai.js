function aiMove(player, validTokens) {
  let chosenToken = null;

  // Prioritize cutting opponent's token
  validTokens.forEach(token => {
    let newIndex;
    if (boardState[player.color].home.includes(token)) {
      if (diceResult === 6) {
        newIndex = 0;
      }
    } else {
      const pathToken = boardState[player.color].path.find(t => t.token === token);
      const homePathToken = boardState[player.color].homePath.find(t => t.token === token);
      if (pathToken) {
        newIndex = pathToken.index + diceResult;
      }
    }
    if (newIndex !== undefined && newIndex < 51 && !safeZones.includes(newIndex)) {
      players.forEach(p => {
        if (p.color !== player.color) {
          if (boardState[p.color].path.some(t => t.index === newIndex)) {
            chosenToken = token;
          }
        }
      });
    }
  });

  // If no cut possible, move furthest token or closest to home
  if (!chosenToken) {
    let maxIndex = -1;
    let closestToHome = 6;
    validTokens.forEach(token => {
      if (boardState[player.color].home.includes(token)) {
        if (diceResult === 6) chosenToken = token;
      } else {
        const pathToken = boardState[player.color].path.find(t => t.token === token);
        const homePathToken = boardState[player.color].homePath.find(t => t.token === token);
        if (pathToken) {
          const newIndex = pathToken.index + diceResult;
          if (newIndex < 51) {
            if (pathToken.index > maxIndex) {
              maxIndex = pathToken.index;
              chosenToken = token;
            }
          } else if (newIndex <= 56) {
            chosenToken = token;
          }
        } else if (homePathToken) {
          const newIndex = homePathToken.index + diceResult;
          if (newIndex <= 5 && (5 - newIndex) < closestToHome) {
            closestToHome = 5 - newIndex;
            chosenToken = token;
          }
        }
      }
    });
  }

  if (chosenToken) {
    moveToken(player, chosenToken);
  } else {
    setTimeout(nextTurn, 500);
  }
}
