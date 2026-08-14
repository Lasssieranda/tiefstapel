import {
  createGame, startRound, revealInitialCard, drawFromDiscard, drawFromDeck, swapDrawnCard,
  discardDrawnAndReveal, chooseBotAction, chooseBotMandatorySwap, chooseBotDeckResolution,
  createSavedGame, restoreSavedGame
} from './engine.js?v=307';

const $ = id => document.getElementById(id);
const els = {
  setup:$('setup'), setupForm:$('setup-form'), humans:$('human-count'), bots:$('bot-count'), difficulty:$('difficulty'),
  setupError:$('setup-error'), continueBtn:$('continue-btn'), scorebar:$('scorebar'), opponents:$('opponents'), board:$('board'),
  deck:$('deck-pile'), discard:$('discard-pile'), discardStage:$('discard-stage'), deckCount:$('deck-count'), discardValue:$('discard-value'), selfAction:$('self-action'), otherAction:$('other-action'),
  roundLabel:$('round-label'), turnLabel:$('turn-label'), turnToken:$('turn-token'), instruction:$('instruction'), drawnPanel:$('drawn-panel'),
  drawnCard:$('drawn-card'), discardDrawn:$('discard-drawn'), status:$('status-pill'), soundLabel:$('sound-label'),
  result:$('result-modal'), resultContent:$('result-content'), toast:$('toast')
};
let game = null;
let viewerPlayerIndex = 0;
let handoffPlayerIndex = null;
let revealMode = false;
let botTimer = null;
let botHoldUntil = 0;
let deferredInstallPrompt = null;
let soundOn = localStorage.getItem('tiefstapel-sound') !== 'off';
let audioContext = null;
let cardDrag = null;
let suppressCardClick = false;
const BOT_PHASES = ['initial-reveal','choose-pile','must-swap','deck-choice'];

function valueClass(value){ return value <= 0 ? 'value-blue' : value <= 4 ? 'value-green' : value <= 8 ? 'value-yellow' : 'value-red'; }
function isHumanTurn(){ return game && game.players[game.currentPlayer]?.type === 'human'; }
function isViewerTurn(){ return isHumanTurn() && game.currentPlayer === viewerPlayerIndex && handoffPlayerIndex === null; }
function firstHumanIndex(){ return game?.players.findIndex(player=>player.type==='human') ?? 0; }
function setViewer(index){
  viewerPlayerIndex=index;
  localStorage.setItem('tiefstapel-viewer',String(index));
}
function lastActionCopy(action){
  const actor=action?.actorIndex === null || action?.actorIndex === undefined ? null : game.players[action.actorIndex]?.name;
  if(!action) return 'Die offene Karte bleibt hier sichtbar.';
  if(action.type==='round-start') return `Ablage startet mit ${action.cardValue}.`;
  if(action.type==='take-discard') return `${actor} nimmt ${action.cardValue} von der Ablage.`;
  if(action.type==='swap') return `${actor} legt ${action.cardValue} ab.`;
  if(action.type==='discard-and-reveal') return `${actor} legt ${action.cardValue} ab und deckt auf.`;
  if(action.type==='clear-column') return `${actor} räumt eine Dreier-Spalte ab.`;
  return 'Die offene Karte bleibt hier sichtbar.';
}
function actionForSeat(seat, own){
  const actions=(game.publicActions?.length ? game.publicActions : [game.lastPublicAction]).filter(Boolean);
  const action=[...actions].reverse().find(item => item.actorIndex !== null && (own ? item.actorIndex===seat : item.actorIndex!==seat));
  return action ? lastActionCopy(action) : own ? 'Du hast in dieser Runde noch keine öffentliche Aktion.' : 'Noch keine öffentliche Aktion der anderen Spieler.';
}
function shouldHandoff(){ return game && game.players.filter(player=>player.type==='human').length > 1 && isHumanTurn() && game.currentPlayer !== viewerPlayerIndex && !['round-over','game-over'].includes(game.phase); }
function liveCards(player){ return player.grid.filter(card => !card.removed); }
function hiddenCount(player){ return liveCards(player).filter(card => !card.revealed).length; }
function esc(text){ const d=document.createElement('div'); d.textContent=text; return d.innerHTML; }
function canDragCard(){ return isViewerTurn() && (game.phase==='must-swap'||(game.phase==='deck-choice'&&!revealMode)); }
function clearCardDrag(returnCard=false){
  if(!cardDrag) return;
  const {card}=cardDrag;
  card.style.removeProperty('--drag-x'); card.style.removeProperty('--drag-y'); card.style.removeProperty('--drag-rotate');
  card.classList.remove('dragging');
  if(returnCard){ card.classList.add('drag-return'); setTimeout(()=>card.classList.remove('drag-return'),220); }
  document.body.classList.remove('dragging-card'); cardDrag=null;
}
function startCardDrag(event){
  if(event.button!==undefined&&event.button!==0||!canDragCard()) return;
  const card=event.target.closest('#board .card[data-index]'); if(!card) return;
  cardDrag={card,index:Number(card.dataset.index),x:event.clientX,y:event.clientY,armed:false};
  card.setPointerCapture?.(event.pointerId); event.preventDefault();
}
function moveCardDrag(event){
  if(!cardDrag) return;
  const dx=Math.max(-36,Math.min(36,event.clientX-cardDrag.x));
  const dy=Math.max(-78,Math.min(18,event.clientY-cardDrag.y));
  const armed=dy<-28 && Math.abs(dy)>Math.abs(dx)*1.15;
  if(armed&&!cardDrag.armed){ cardDrag.armed=true; haptic(8); }
  cardDrag.card.classList.add('dragging'); cardDrag.card.style.setProperty('--drag-x',`${dx}px`); cardDrag.card.style.setProperty('--drag-y',`${dy}px`); cardDrag.card.style.setProperty('--drag-rotate',`${dx/9}deg`);
  document.body.classList.toggle('dragging-card',armed);
}
function finishCardDrag(event){
  if(!cardDrag) return;
  const {index,armed}=cardDrag; clearCardDrag(!armed);
  if(armed){ suppressCardClick=true; handleCard(index); setTimeout(()=>suppressCardClick=false,0); }
}

function tone(kind='tap'){
  if(!soundOn) return;
  try{
    audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
    const osc=audioContext.createOscillator(), gain=audioContext.createGain();
    const notes={tap:280,flip:470,column:720,finish:560};
    osc.frequency.setValueAtTime(notes[kind]||320,audioContext.currentTime);
    if(kind==='column') osc.frequency.exponentialRampToValueAtTime(1080,audioContext.currentTime+.16);
    gain.gain.setValueAtTime(.055,audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.18);
    osc.connect(gain).connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime+.18);
  }catch{}
}
function haptic(pattern=12){ if(navigator.vibrate) navigator.vibrate(pattern); }
function toast(message){ els.toast.textContent=message; els.toast.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>els.toast.classList.remove('show'),1700); }
function pulseBoard(kind){
  document.body.dataset.feedback=kind;
  clearTimeout(pulseBoard.timer);
  pulseBoard.timer=setTimeout(()=>delete document.body.dataset.feedback,520);
}

function save(){
  if(!game) return;
  localStorage.setItem('tiefstapel-save',JSON.stringify(createSavedGame(game)));
  els.continueBtn.classList.remove('hidden');
}
function load(){
  try{
    const data=JSON.parse(localStorage.getItem('tiefstapel-save'));
    game=restoreSavedGame(data);
    const savedViewer=Number(localStorage.getItem('tiefstapel-viewer'));
    setViewer(Number.isInteger(savedViewer) && game.players[savedViewer]?.type==='human' ? savedViewer : firstHumanIndex());
    handoffPlayerIndex=null; revealMode=false; els.setupError.textContent=''; return true;
  }catch{
    localStorage.removeItem('tiefstapel-save');
    els.continueBtn.classList.add('hidden');
    els.setupError.textContent='Der gespeicherte Spielstand war ungültig und wurde entfernt.';
    return false;
  }
}

function cardMarkup(card,index,mini=false){
  if(mini){
    if(card.removed) return '<span class="mini-card removed" aria-hidden="true"></span>';
    if(!card.revealed) return '<span class="mini-card back" aria-hidden="true"></span>';
    return `<span class="mini-card open" aria-hidden="true">${card.value}</span>`;
  }
  if(card.removed) return `<button type="button" class="card removed" data-index="${index}" aria-label="Kartenposition ${index+1} entfernt" disabled></button>`;
  if(!card.revealed) return `<button type="button" class="card back" data-index="${index}" aria-label="Verdeckte Karte ${index+1}"><span class="card-back-mark" aria-hidden="true">▼</span></button>`;
  return `<button type="button" class="card ${valueClass(card.value)}" data-index="${index}" data-value="${card.value}" aria-label="Karte ${index+1}: Wert ${card.value}"><span class="card-value">${card.value}</span></button>`;
}

function render(){
  if(!game) return;
  const current=game.players[game.currentPlayer];
  document.body.dataset.phase=game.phase;
  document.body.dataset.viewer=String(viewerPlayerIndex);
  const activeLabel=game.phase==='round-over' ? 'Runde beendet' : game.phase==='game-over' ? 'Endstand' : current.name;
  els.turnToken.querySelector('span').textContent=activeLabel;
  els.turnToken.classList.toggle('is-human',isHumanTurn() && !['round-over','game-over'].includes(game.phase));
  els.roundLabel.textContent=`Runde ${game.round}`;
  els.turnLabel.textContent=game.phase==='round-over'?'Runde beendet':game.phase==='game-over'?'Spiel beendet':game.phase==='initial-reveal'?`${current.name} deckt Startkarten auf`:`${current.name} ist dran`;
  els.deckCount.textContent=game.deck.length;
  const top=game.discard.at(-1);
  els.discardValue.textContent=top ?? '–';
  els.discard.className=`pile card ${valueClass(top ?? 0)}`;
  els.discard.dataset.value=top ?? '–';
  els.discard.setAttribute('aria-label',`Ablagestapel, oberste Karte ${top ?? 'unbekannt'}${isViewerTurn()&&game.phase==='choose-pile' ? '. Zum Tauschen nehmen.' : '.'}`);
  els.selfAction.textContent=actionForSeat(viewerPlayerIndex,true);
  els.otherAction.textContent=actionForSeat(viewerPlayerIndex,false);
  els.scorebar.innerHTML=game.players.map((p,i)=>`<div class="score-chip ${i===game.currentPlayer?'active':''}"><i class="player-dot" aria-hidden="true"></i><span class="score-meta"><span>${esc(p.name)}</span><small>${i===game.currentPlayer?'Am Zug':'Gesamt'}</small></span><b>${p.total}</b></div>`).join('');
  els.opponents.innerHTML=game.players.map((p,i)=>({p,i})).filter(x=>x.i!==viewerPlayerIndex).map(({p,i})=>{
    const hidden=hiddenCount(p), removed=p.grid.filter(card=>card.removed).length, open=liveCards(p).length-hidden;
    return `<div class="opponent ${i===game.currentPlayer?'active':''}"><span class="opponent-name" aria-hidden="true">${esc(p.name)}${i===game.currentPlayer?' · am Zug':''}</span><span class="opponent-summary sr-only">${esc(p.name)}: ${open} offen, ${hidden} verdeckt, ${removed} entfernt${i===game.currentPlayer?', ist am Zug':''}.</span><div class="opponent-table mini-player" aria-hidden="true">${p.grid.map((c,j)=>cardMarkup(c,j,true)).join('')}</div></div>`;
  }).join('');
  const viewer=game.players[viewerPlayerIndex] || current;
  els.board.innerHTML=viewer.grid.map((c,i)=>cardMarkup(c,i)).join('');
  const canSelect=isViewerTurn()&&['initial-reveal','must-swap','deck-choice'].includes(game.phase);
  els.board.classList.toggle('selecting',canSelect);
  els.board.classList.toggle('initial-select',canSelect&&game.phase==='initial-reveal');
  els.board.classList.toggle('swap-select',canSelect&&(game.phase==='must-swap'||(game.phase==='deck-choice'&&!revealMode)));
  els.board.classList.toggle('reveal-mode',revealMode);
  els.drawnPanel.classList.toggle('hidden',game.drawnCard===null);
  if(game.drawnCard!==null){ els.drawnCard.innerHTML=`<span class="card-value">${game.drawnCard}</span>`; els.drawnCard.dataset.value=game.drawnCard; els.drawnCard.className=`card drawn ${valueClass(game.drawnCard)}`; }
  els.discardDrawn.classList.toggle('hidden',game.phase!=='deck-choice'||!isViewerTurn());
  els.discardDrawn.textContent=revealMode?'Verdeckte Karte antippen …':'Ablegen & Karte aufdecken';
  els.deck.disabled=!isViewerTurn()||game.phase!=='choose-pile';
  const initialLeft=2-(game.initialReveals?.[game.currentPlayer]??0);
  els.discard.disabled=els.deck.disabled;

  if(game.phase==='initial-reveal') els.instruction.textContent=isViewerTurn()?`Wähle deine ersten zwei Karten – noch ${initialLeft}.`:`${current.name} deckt zwei Startkarten auf …`;
  if(game.phase==='choose-pile') els.instruction.textContent=isViewerTurn()?'Wähle Nachziehstapel oder Ablage.':game.players[game.currentPlayer].type==='bot'?'Computer überlegt ruhig …':`${current.name} ist dran.`;
  if(game.phase==='must-swap') els.instruction.textContent='Tippe auf eine Karte, um sie zu tauschen.';
  if(game.phase==='deck-choice') els.instruction.textContent=revealMode?'Tippe auf eine verdeckte Karte.':'Tausche – oder lege die Ziehkarte ab.';
  const statusText={
    'initial-reveal':'Startwahl', 'choose-pile':isHumanTurn()?'Ziehen':'CPU denkt',
    'must-swap':'Tauschen', 'deck-choice':revealMode?'Aufdecken':'Entscheiden',
    'round-over':'Wertung', 'game-over':'Endstand'
  };
  els.status.textContent=statusText[game.phase]||'Bereit';
  const resultReady=['round-over','game-over'].includes(game.phase);
  els.status.disabled=!resultReady;
  els.status.setAttribute('aria-label',resultReady?'Wertung wieder öffnen':els.status.textContent);
  els.status.classList.toggle('result-ready',resultReady);
  save();
  if(['round-over','game-over'].includes(game.phase)) showResult();
  else if(shouldHandoff()) openHandoff(game.currentPlayer);
  else scheduleBot();
}

function startNewGame(){
  const humans=Number(els.humans.value), bots=Number(els.bots.value), total=humans+bots;
  if(total<2||total>4){ els.setupError.textContent='Bitte insgesamt 2 bis 4 Spieler wählen.'; return; }
  els.setupError.textContent='';
  const players=[];
  for(let i=0;i<humans;i++) players.push({name:humans===1?'Du':`Spieler ${i+1}`,type:'human'});
  for(let i=0;i<bots;i++) players.push({name:`CPU ${i+1}`,type:'bot',difficulty:els.difficulty.value});
  game=createGame(players); startRound(game); setViewer(0); handoffPlayerIndex=null; botHoldUntil=0; revealMode=false; els.setup.close(); tone('finish'); render();
}

function handlePile(source){
  if(!isViewerTurn()||game.phase!=='choose-pile') return;
  revealMode=false; source==='deck'?drawFromDeck(game):drawFromDiscard(game); pulseBoard(source==='deck'?'draw':'take'); tone('flip'); haptic(); render();
}
function handleCard(index){
  if(!isViewerTurn()||!game) return;
  try{
    if(game.phase==='initial-reveal'){
      revealInitialCard(game,index); pulseBoard('reveal'); tone('flip'); haptic();
    }else if(game.phase==='must-swap'||(game.phase==='deck-choice'&&!revealMode)){
      const before=game.log.length; swapDrawnCard(game,index); pulseBoard('swap'); tone('flip'); haptic(); announceColumns(before);
    }else if(game.phase==='deck-choice'&&revealMode){
      const before=game.log.length; discardDrawnAndReveal(game,index); revealMode=false; pulseBoard('reveal'); tone('flip'); haptic(); announceColumns(before);
    }else return;
    render();
  }catch(error){ toast(error.message); haptic([20,30,20]); }
}
function announceColumns(logStart){
  if(game.log.slice(logStart).some(line=>line.includes('Dreier-Spalte'))){ pulseBoard('column'); tone('column'); haptic([20,35,45]); toast('Dreier-Spalte abgeräumt!'); }
}

function scheduleBot(){
  clearTimeout(botTimer);
  if(!game||!BOT_PHASES.includes(game.phase)||game.players[game.currentPlayer].type!=='bot'||handoffPlayerIndex!==null) return;
  const baseDelay={ 'initial-reveal':900, 'choose-pile':900, 'must-swap':650, 'deck-choice':800 }[game.phase];
  const delay=Math.max(baseDelay,botHoldUntil-Date.now());
  botTimer=setTimeout(runBotTurn,delay);
}
function runBotTurn(){
  if(!game||!BOT_PHASES.includes(game.phase)||game.players[game.currentPlayer].type!=='bot') return;
  if(game.phase==='initial-reveal'){
    const index=game.players[game.currentPlayer].grid.findIndex(card=>!card.revealed&&!card.removed);
    revealInitialCard(game,index); pulseBoard('reveal'); botHoldUntil=Date.now()+750; tone('flip'); render(); return;
  }
  if(game.phase==='choose-pile'){
    const action=chooseBotAction(game);
    action.pile==='discard'?drawFromDiscard(game):drawFromDeck(game);
    pulseBoard(action.pile==='discard'?'take':'draw'); botHoldUntil=Date.now()+850; tone('flip'); render(); return;
  }
  const before=game.log.length;
  if(game.phase==='must-swap') swapDrawnCard(game,chooseBotMandatorySwap(game));
  else {
    const resolution=chooseBotDeckResolution(game);
    resolution.mode==='swap'?swapDrawnCard(game,resolution.index):discardDrawnAndReveal(game,resolution.index);
  }
  pulseBoard('discard-land'); botHoldUntil=Date.now()+1500; announceColumns(before); tone('flip'); render();
}

function openHandoff(index){
  if(handoffPlayerIndex===index) return;
  handoffPlayerIndex=index;
  const player=game.players[index];
  $('handoff-copy').textContent=`Gib das Gerät an ${player.name}. Deine Karten bleiben bis zum Antippen verdeckt.`;
  $('handoff-ready').textContent=`Ich bin ${player.name}`;
  $('handoff-modal').showModal();
}

function showResult(){
  if(els.result.open) return;
  const over=game.phase==='game-over';
  const title=over?'Spiel entschieden':`Runde ${game.round} beendet`;
  const winnerNames=game.winnerIds.map(id=>game.players.find(p=>p.id===id)?.name).join(' & ');
  els.resultContent.innerHTML=`<p class="eyebrow">${over?'ENDSTAND':'WERTUNG'}</p><h2 id="result-title">${title}</h2>${over?`<p><b>${esc(winnerNames)}</b> gewinnt mit der niedrigsten Punktzahl.</p>`:'<p>Die Kartenwerte wurden zum Gesamtstand addiert.</p>'}<table class="result-table">${game.players.map(p=>`<tr><td>${esc(p.name)}</td><td>${p.roundScore>=0?'+':''}${p.roundScore}</td><td><b>${p.total}</b></td></tr>`).join('')}</table><button type="button" class="primary" id="result-action">${over?'Neues Spiel':'Nächste Runde'}</button><button type="button" class="ghost" data-close="result-modal">Punktestand ansehen</button>`;
  els.result.showModal(); tone('finish');
  $('result-action').onclick=()=>{ els.result.close(); if(over){ els.setup.showModal(); }else{ startRound(game); render(); } };
  els.resultContent.querySelector('[data-close]').onclick=()=>els.result.close();
}

els.setupForm.addEventListener('submit',event=>{ event.preventDefault(); startNewGame(); });
els.continueBtn.addEventListener('click',event=>{ event.preventDefault(); if(load()){ els.setup.close(); render(); } });
els.deck.addEventListener('click',()=>handlePile('deck'));
els.discard.addEventListener('click',()=>handlePile('discard'));
els.board.addEventListener('pointerdown',startCardDrag);
els.board.addEventListener('pointermove',moveCardDrag);
els.board.addEventListener('pointerup',finishCardDrag);
els.board.addEventListener('pointercancel',()=>clearCardDrag(true));
els.board.addEventListener('click',event=>{ if(suppressCardClick) return; const card=event.target.closest('[data-index]'); if(card) handleCard(Number(card.dataset.index)); });
els.discardDrawn.addEventListener('click',()=>{ revealMode=!revealMode; tone('tap'); render(); });
$('handoff-ready').onclick=()=>{
  if(handoffPlayerIndex===null) return;
  setViewer(handoffPlayerIndex); handoffPlayerIndex=null; $('handoff-modal').close(); render();
};
$('rules-btn').onclick=()=>$('info-modal').showModal();
$('menu-btn').onclick=()=>{ clearTimeout(botTimer); els.setup.showModal(); };
$('sound-btn').onclick=()=>{ soundOn=!soundOn; localStorage.setItem('tiefstapel-sound',soundOn?'on':'off'); els.soundLabel.textContent=soundOn?'Ton an':'Ton aus'; $('sound-btn').setAttribute('aria-pressed',String(soundOn)); tone('tap'); };
els.status.onclick=()=>{ if(game&&['round-over','game-over'].includes(game.phase)) showResult(); };
document.addEventListener('click',event=>{ const id=event.target.dataset.close; if(id) $(id).close(); });
window.addEventListener('beforeinstallprompt',event=>{ event.preventDefault(); deferredInstallPrompt=event; });
$('install-btn').onclick=async()=>{ if(deferredInstallPrompt){ deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt=null; }else $('install-modal').showModal(); };
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
els.soundLabel.textContent=soundOn?'Ton an':'Ton aus';
$('sound-btn').setAttribute('aria-pressed',String(soundOn));
if(localStorage.getItem('tiefstapel-save')) els.continueBtn.classList.remove('hidden');
if(!els.setup.open) els.setup.showModal();
