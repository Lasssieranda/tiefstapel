import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, startRound } from '../src/engine.js';
import { projectGameForSeat, validOnlineAction } from '../src/online-state.js';

function deterministicRng(){ let value=0; return () => (value=(value+.137)%1); }

function startedGame(){
  const game=createGame([{name:'Lukas',type:'human'},{name:'Michelle',type:'human'}],deterministicRng());
  startRound(game);
  return game;
}

test('Spielprojektion verbirgt die verdeckten Karten des anderen Sitzes',()=>{
  const game=startedGame();
  const ownValue=game.players[1].grid[0].value;
  const secretOpponentValue=game.players[0].grid[0].value;
  const view=projectGameForSeat(game,1);
  assert.equal(view.players[1].grid[0].value,ownValue);
  assert.equal(view.players[0].grid[0].value,null);
  assert.notEqual(view.players[0].grid[0].value,secretOpponentValue);
  assert.equal(view.deck,null);
});

test('Online-Aktion akzeptiert nur die aktuelle Rolle und erlaubte Aktion',()=>{
  const game=startedGame();
  assert.equal(validOnlineAction(game,0,{type:'reveal-initial',index:0}),true);
  assert.equal(validOnlineAction(game,1,{type:'reveal-initial',index:0}),false);
  assert.equal(validOnlineAction(game,0,{type:'swap',index:99}),false);
  assert.equal(validOnlineAction(game,0,{type:'unknown'}),false);
});
