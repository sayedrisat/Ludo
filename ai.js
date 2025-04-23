function aiMove(player, validTokens) {
  let chosenToken = null;

  // If can unlock, prioritize unlocking
  if (boardState[player.color].locked.length > 0 && moveQueue[0] === 6) {
    chosenToken = validTokens[0];
  } else if (boardState[player.color].locked.length === 0) {
    // Prioritize cutting opponent's token
    validTokens.forEach(token => {
      let newIndex;
      const pathToken = boardState[player.color].path.find(t => t.token === token);
      const homePathToken = boardState[player.color].homePath.find(t => t.token === token);
      if (pathToken) {
        newIndex = pathToken.index + moveQueue[0];
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
        const pathToken = boardState[player.color].path.find(t => t.token === token);
        const homePathToken = boardState[player.color].homePath.find(t => t.token === token);
        if (pathToken) {
          const newIndex = pathToken.index + moveQueue[0];
          if (newIndex < 51) {
            if (pathToken.index > maxIndex) {
              maxIndex = pathToken.index;
              chosenToken = token;
            }
          } else if (newIndex <= 56) {
            chosenToken = token;
          }
        } else if (homePathToken) {
          const newIndex = homePathToken.index + moveQueue[0];
          if (newIndex <= 5 && (5 - newIndex) < closestToHome) {
            closestToHome = 5 - newIndex;
            chosenToken = token;
          }
        }
      });
    }
  }

  if (chosenToken) {
    moveToken(player, chosenToken);
  } else {
    setTimeout(nextTurn, 500);
  }
}
