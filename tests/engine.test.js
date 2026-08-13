import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDeck, createGame, startRound, revealInitialCard, drawFromDiscard, drawFromDeck,
  swapDrawnCard, discardDrawnAndReveal, scoreRound, findCompleteColumns,
  chooseBotAction, chooseBotDeckResolution, chooseBotMandatorySwap,
  createSavedGame, restoreSavedGame, SAVE_VERSION
} from '../src/engine.js';

test('Deck enthält 150 Karten in der vorgesehenen Verteilung', () => {
  const deck = buildDeck();
  assert.equal(deck.length, 150);
  assert.equal(deck.filter(v => v === -2).length, 5);
  assert.equal(deck.filter(v => v === -1).length, 10);
  assert.equal(deck.filter(v => v === 0).length, 15);
  for (let value = 1; value <= 12; value++) assert.equal(deck.filter(v => v === value).length, 10);
});

test('Rundenstart lässt beide Spieler zuerst selbst zwei Karten aufdecken', () => {
  const game = createGame([{name:'A',type:'human'},{name:'B',type:'human'}], () => 0.42);
  startRound(game);
  assert.equal(game.phase, 'initial-reveal');
  assert.equal(game.players.every(player => player.grid.every(card => !card.revealed)), true);
  assert.deepEqual(game.initialReveals, [0, 0]);
  for (const playerIndex of [0, 1]) {
    for (const index of [0, 1]) revealInitialCard(game, index);
  }
  assert.equal(game.phase, 'choose-pile');
  assert.equal(game.players.every(player => player.grid.filter(c => c.revealed).length === 2), true);
  assert.equal(game.currentPlayer, 1);
});

test('Offene Ablagekarte muss getauscht werden', () => {
  const game = createGame([{name:'A',type:'human'},{name:'B',type:'bot'}], () => 0.42);
  startRound(game);
  for (const playerIndex of [0, 1]) for (const index of [0, 1]) revealInitialCard(game, index);
  const acting = game.currentPlayer;
  const top = game.discard.at(-1);
  drawFromDiscard(game);
  const old = game.players[acting].grid[0].value;
  swapDrawnCard(game, 0);
  assert.equal(game.players[acting].grid[0].value, top);
  assert.equal(game.players[acting].grid[0].revealed, true);
  assert.equal(game.discard.at(-1), old);
});

test('Verdeckte Ziehkarte darf abgelegt werden, dann wird eine Karte aufgedeckt', () => {
  const game = createGame([{name:'A',type:'human'},{name:'B',type:'bot'}], () => 0.42);
  startRound(game);
  for (const playerIndex of [0, 1]) for (const index of [0, 1]) revealInitialCard(game, index);
  const acting = game.currentPlayer;
  const hidden = game.players[acting].grid.findIndex(c => !c.revealed);
  drawFromDeck(game);
  discardDrawnAndReveal(game, hidden);
  assert.equal(game.players[acting].grid[hidden].revealed, true);
  assert.equal(game.phase, 'choose-pile');
  assert.equal(game.currentPlayer, (acting + 1) % game.players.length);
});

test('Drei gleiche offene Karten einer Spalte werden erkannt', () => {
  const grid = Array.from({length:12}, (_,i) => ({value:i, revealed:true, removed:false}));
  for (const i of [1,5,9]) grid[i].value = 4;
  assert.deepEqual(findCompleteColumns(grid), [1]);
});

test('Finisher verdoppelt nur einen positiven Rundenscore, wenn jemand gleichauf oder besser ist', () => {
  const result = scoreRound([10, 8, 15], 0);
  assert.deepEqual(result, [20, 8, 15]);
  assert.deepEqual(scoreRound([-1, -2], 0), [-1, -2]);
  assert.deepEqual(scoreRound([7, 9], 0), [7, 9]);
});

test('Gespeicherte Spielstände werden versioniert und streng validiert', () => {
  const game = createGame([{name:'A',type:'human'},{name:'B',type:'bot'}], () => 0.42);
  startRound(game);
  const snapshot = JSON.parse(JSON.stringify({...game, rng:undefined}));
  const restored = restoreSavedGame({version:SAVE_VERSION, game:snapshot}, () => 0.25);
  assert.equal(restored.phase, 'initial-reveal');
  assert.equal(restored.players.length, 2);
  assert.equal(restored.rng(), 0.25);
  assert.equal(restoreSavedGame(snapshot).phase, 'initial-reveal');

  const altered = mutate => {
    const copy = structuredClone(snapshot);
    mutate(copy);
    return {version:SAVE_VERSION, game:copy};
  };
  assert.throws(() => restoreSavedGame(altered(data => { data.players[0].grid[0].value = '<img src=x onerror=alert(1)>'; })));
  assert.throws(() => restoreSavedGame(altered(data => { data.players[0].total = '12'; })));
  assert.throws(() => restoreSavedGame(altered(data => { data.players[0].roundScore = '<img src=x onerror=alert(1)>'; })));
  assert.throws(() => restoreSavedGame(altered(data => { data.drawnCard = '<img src=x onerror=alert(1)>'; })));
  assert.throws(() => restoreSavedGame(altered(data => { data.phase = 'freie-phase'; })));
  assert.throws(() => restoreSavedGame(altered(data => { data.players[0].grid.pop(); })));
  assert.throws(() => restoreSavedGame(altered(data => {
    data.initialReveals[0] = 2;
    data.players[0].grid[0].revealed = true;
    data.players[0].grid[1].revealed = true;
  })));
  const choosePileGame = createGame([{name:'A',type:'human'},{name:'B',type:'bot'}], () => 0.42);
  startRound(choosePileGame);
  while (choosePileGame.phase === 'initial-reveal') {
    const index = choosePileGame.players[choosePileGame.currentPlayer].grid.findIndex(card => !card.revealed);
    revealInitialCard(choosePileGame, index);
  }
  const unavailablePiles = createSavedGame(choosePileGame);
  unavailablePiles.game.deck = [];
  unavailablePiles.game.discard = [];
  assert.throws(() => restoreSavedGame(unavailablePiles));
  const missingDiscard = structuredClone(createSavedGame(choosePileGame));
  missingDiscard.game.discard = [];
  assert.throws(() => restoreSavedGame(missingDiscard));
  const unrebuildableDeck = structuredClone(createSavedGame(choosePileGame));
  unrebuildableDeck.game.deck = [];
  unrebuildableDeck.game.discard = [unrebuildableDeck.game.discard.at(-1)];
  assert.throws(() => restoreSavedGame(unrebuildableDeck));
  const noActiveChoice = structuredClone(createSavedGame(choosePileGame));
  noActiveChoice.game.players[noActiveChoice.game.currentPlayer].grid.forEach(card => { card.revealed = true; card.removed = true; });
  assert.throws(() => restoreSavedGame(noActiveChoice));
  const removedHidden = structuredClone(createSavedGame(choosePileGame));
  removedHidden.game.players[0].grid[0].removed = true;
  removedHidden.game.players[0].grid[0].revealed = false;
  assert.throws(() => restoreSavedGame(removedHidden));
  drawFromDiscard(choosePileGame);
  choosePileGame.players[choosePileGame.currentPlayer].grid.forEach(card => { card.revealed = true; card.removed = true; });
  assert.throws(() => restoreSavedGame(createSavedGame(choosePileGame)));
  assert.throws(() => restoreSavedGame({version:SAVE_VERSION + 1, game:snapshot}));
});

test('Wiederhergestellte Bot-Zwischenphasen lassen sich regulär abschließen', () => {
  const prepareBotTurn = () => {
    const game = createGame([{name:'Du',type:'human'},{name:'CPU',type:'bot',difficulty:'normal'}], () => 0.42);
    startRound(game);
    for (const playerIndex of [0, 1]) for (const index of [0, 1]) revealInitialCard(game, index);
    game.currentPlayer = 1;
    game.phase = 'choose-pile';
    return game;
  };

  const discardGame = prepareBotTurn();
  drawFromDiscard(discardGame);
  const restoredDiscard = restoreSavedGame(JSON.parse(JSON.stringify(createSavedGame(discardGame))), () => 0.42);
  assert.equal(restoredDiscard.phase, 'must-swap');
  swapDrawnCard(restoredDiscard, chooseBotMandatorySwap(restoredDiscard));
  assert.equal(restoredDiscard.phase, 'choose-pile');
  assert.equal(restoredDiscard.currentPlayer, 0);

  const deckGame = prepareBotTurn();
  drawFromDeck(deckGame);
  const restoredDeck = restoreSavedGame(JSON.parse(JSON.stringify(createSavedGame(deckGame))), () => 0.42);
  assert.equal(restoredDeck.phase, 'deck-choice');
  const resolution = chooseBotDeckResolution(restoredDeck);
  resolution.mode === 'swap'
    ? swapDrawnCard(restoredDeck, resolution.index)
    : discardDrawnAndReveal(restoredDeck, resolution.index);
  assert.equal(restoredDeck.phase, 'choose-pile');
  assert.equal(restoredDeck.currentPlayer, 0);
});

test('Vier Computer können ein vollständiges Spiel bis zum regulären Spielende austragen', () => {
  let seed = 123456789;
  const rng = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  const game = createGame(Array.from({length:4},(_,i)=>({name:`CPU ${i+1}`,type:'bot',difficulty:'normal'})), rng);
  startRound(game);
  while (game.phase === 'initial-reveal') {
    const index = game.players[game.currentPlayer].grid.findIndex(card => !card.revealed);
    revealInitialCard(game, index);
  }
  let actions = 0;
  while (game.phase !== 'game-over' && actions < 10000) {
    if (game.phase === 'round-over') {
      startRound(game);
      while (game.phase === 'initial-reveal') {
        const index = game.players[game.currentPlayer].grid.findIndex(card => !card.revealed);
        revealInitialCard(game, index);
      }
      continue;
    }
    const action = chooseBotAction(game);
    if (action.pile === 'discard') {
      drawFromDiscard(game); swapDrawnCard(game, action.index);
    } else {
      drawFromDeck(game);
      const resolution = chooseBotDeckResolution(game);
      resolution.mode === 'swap' ? swapDrawnCard(game, resolution.index) : discardDrawnAndReveal(game, resolution.index);
    }
    actions++;
  }
  assert.equal(game.phase, 'game-over');
  assert.ok(game.players.some(player => player.total >= 100));
  assert.ok(game.winnerIds.length >= 1);
  assert.ok(game.round >= 2);
});
