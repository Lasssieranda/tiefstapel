const ACTIONS_BY_PHASE={
  'initial-reveal':new Set(['reveal-initial']),
  'choose-pile':new Set(['draw-deck','take-discard']),
  'must-swap':new Set(['swap']),
  'deck-choice':new Set(['swap','discard-and-reveal'])
};

function cardForViewer(card,own){
  if(own||card.revealed||card.removed) return {...card};
  return {value:null,revealed:false,removed:false};
}

export function projectGameForSeat(game,seat){
  return {
    round:game.round,
    phase:game.phase,
    currentPlayer:game.currentPlayer,
    roundFinisher:game.roundFinisher,
    finalTurnsLeft:game.finalTurnsLeft,
    previousFinisher:game.previousFinisher,
    winnerIds:[...game.winnerIds],
    initialReveals:[...game.initialReveals],
    discard:[game.discard.at(-1)],
    deck:null,
    drawnCard:game.currentPlayer===seat ? game.drawnCard : null,
    drawSource:game.currentPlayer===seat ? game.drawSource : null,
    lastPublicAction:game.lastPublicAction ? {...game.lastPublicAction} : null,
    publicActions:(game.publicActions||[]).map(action=>({...action})),
    log:(game.log||[]).slice(-12),
    players:game.players.map((player,index)=>({
      id:player.id,name:player.name,type:'human',difficulty:'normal',total:player.total,roundScore:player.roundScore,
      grid:player.grid.map(card=>cardForViewer(card,index===seat))
    }))
  };
}

export function validOnlineAction(game,seat,action){
  if(!game||!action||game.currentPlayer!==seat||!Number.isInteger(action.index)&&action.index!==undefined) return false;
  if(!ACTIONS_BY_PHASE[game.phase]?.has(action.type)) return false;
  if(['reveal-initial','swap','discard-and-reveal'].includes(action.type)){
    return Number.isInteger(action.index)&&action.index>=0&&action.index<12&&!game.players[seat].grid[action.index]?.removed;
  }
  return action.index===undefined;
}
