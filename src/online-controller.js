import {joinRoom} from '@trystero-p2p/mqtt';
import {projectGameForSeat,validOnlineAction} from './online-state.js';

const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.hash.slice(1));
let room=null,role=params.get('role'),roomId=params.get('room'),password=params.get('pw'),connected=false;
const api=()=>window.tiefstapelOnline;
// Der Standard-Relay test.mosquitto.org ist nicht zuverlässig per WSS erreichbar.
// Diese explizite, im Browser geprüfte kostenlose Signalisierung verhindert,
// dass eine kaputte Standardverbindung die ganze Raumverhandlung blockiert.
const SIGNAL_RELAY='wss://broker.hivemq.com:8884/mqtt';

function randomToken(){const bytes=crypto.getRandomValues(new Uint8Array(18));return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
function setStatus(text){$('online-status').textContent=text;}
function show(title,copy){$('online-title').textContent=title;$('online-copy').textContent=copy;$('online-lobby').classList.remove('hidden');}
function hide(){ $('online-lobby').classList.add('hidden'); }
function guestLink(){const hash=new URLSearchParams({room:roomId,pw:password,role:'guest'});return `${location.origin}${location.pathname}${location.search}#${hash}`;}
async function copyGuestLink(){const link=guestLink();try{await navigator.clipboard.writeText(link);}catch{const field=document.createElement('textarea');field.value=link;field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();document.execCommand('copy');field.remove();}$('online-copy-btn').textContent='Link kopiert';setTimeout(()=>$('online-copy-btn').textContent='Einladungslink kopieren',1800);}
function sendState(target){const game=api().state();if(!game)return;stateAction.send({state:projectGameForSeat(game,1)},target?{target}:undefined).catch(()=>{});}
let stateAction,proposalAction;
function connect(){
 room=joinRoom({appId:'tiefstapel-public-private-v1',password,relayConfig:{urls:[SIGNAL_RELAY],redundancy:1,warnOnRelayFailure:false}},roomId,{onJoinError:()=>setStatus('Verbindung wird erneut versucht …')});
 stateAction=room.makeAction('state');proposalAction=room.makeAction('proposal');
 stateAction.onMessage=payload=>{if(role==='guest'&&payload?.state){api().importState(payload.state);connected=true;hide();}};
 proposalAction.onMessage=(action,context)=>{if(role!=='host'||!validOnlineAction(api().state(),1,action))return;if(api().applyAction(action))sendState(context.peerId);};
 room.onPeerJoin=peer=>{connected=true;if(role==='host'){setStatus('Mitspieler verbunden');sendState(peer);hide();}};
 room.onPeerLeave=()=>{connected=false;show('Verbindung unterbrochen','Die Partie bleibt beim Host erhalten. Wir verbinden erneut, sobald dein Mitspieler zurück ist.');setStatus('Warte auf Wiederverbindung …');};
 window.addEventListener('tiefstapel:online-state',event=>{if(role==='host'&&event.detail?.state)sendState();});
 api().onAction(action=>{if(role==='guest'&&connected)proposalAction.send(action).catch(()=>setStatus('Senden fehlgeschlagen – Wiederverbindung läuft …'));});
}
function startHost(name){
 roomId=randomToken();password=randomToken();role='host';
 history.replaceState(null,'',`${location.pathname}${location.search}#${new URLSearchParams({room:roomId,pw:password,role})}`);
 show('Private Partie wird erstellt','Teile danach den Einladungslink mit genau einer Person.');$('online-copy-btn').classList.remove('hidden');$('online-guest-name-wrap').classList.add('hidden');$('online-join-btn').classList.add('hidden');setStatus('Warte auf Mitspieler …');
 connect();api().startHost(name);$('setup').close();
}
function startGuest(){show('Private Partie wird verbunden','Der Host startet die Partie.');$('online-guest-name-wrap').classList.add('hidden');$('online-join-btn').classList.add('hidden');setStatus('Verbinde …');api().joinGuest();connect();}
$('online-host-btn').addEventListener('click',()=>startHost(($('online-name').value||'Spieler 1').trim().slice(0,24)));
$('online-copy-btn').addEventListener('click',copyGuestLink);
$('online-join-btn').addEventListener('click',startGuest);
$('online-cancel-btn').addEventListener('click',()=>{room?.leave();history.replaceState(null,'',location.pathname+location.search);location.reload();});
if(roomId&&password&&role==='guest'){if($('setup').open)$('setup').close();show('Private Einladung','Nur diese private Link-Partie verbindet dich mit dem Host.');$('online-guest-name-wrap').classList.remove('hidden');$('online-join-btn').classList.remove('hidden');$('online-copy-btn').classList.add('hidden');setStatus('Bereit zum Beitreten');}
