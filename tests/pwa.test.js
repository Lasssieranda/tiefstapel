import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const text = async path => readFile(new URL(path, root), 'utf8');

test('HTML enthält iPhone- und PWA-Metadaten sowie zentrale Spielbereiche', async () => {
  const html = await text('index.html');
  for (const token of ['viewport-fit=cover','apple-mobile-web-app-capable','manifest.webmanifest','id="board"','id="setup"','id="install-btn"']) assert.match(html, new RegExp(token));
  assert.doesNotMatch(html, /user-scalable=no/);
  for (const id of ['setup-title','rules-title','result-title','install-title']) assert.match(html, new RegExp(`aria-labelledby="${id}"`));
});

test('Mobile QA-Rahmen sind semantisch valide und benennen ihre Spielansicht', async () => {
  for (const file of ['qa/mobile-360.html','qa/mobile-390.html']) {
    const html = await text(file);
    assert.match(html, /^<!DOCTYPE html>/);
    assert.match(html, /<iframe[^>]+title="TIEFSTAPEL Spielansicht"/);
  }
});

test('Manifest ist installierbar und deklariert beide Icons', async () => {
  const manifest = JSON.parse(await text('manifest.webmanifest'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, 'portrait');
  assert.ok(manifest.icons.some(i => i.sizes === '192x192'));
  assert.ok(manifest.icons.some(i => i.sizes === '512x512'));
});

test('Service Worker cached die vollständige App-Shell', async () => {
  const sw = await text('sw.js');
  for (const token of ['index.html','src/app.js','src/engine.js','styles.css','manifest.webmanifest','skipWaiting','clients.claim']) assert.match(sw, new RegExp(token.replace('.', '\\.')));
});

test('Mobile CSS nutzt sichere Bereiche und ausreichend große Touchziele', async () => {
  const css = await text('styles.css');
  assert.match(css, /100dvh/);
  assert.match(css, /html, body \{ height: 100%; margin: 0; overflow: hidden;/);
  assert.match(css, /height: 100dvh;/);
  assert.match(css, /min-height:\s*48px/);
  assert.match(css, /@media\s*\(max-height:\s*780px\)/);
  assert.match(css, /@media\s*\(max-height:\s*850px\)/);
  assert.match(css, /data-phase=["']deck-choice["']/);
  assert.match(css, /data-phase=["']must-swap["']/);
  assert.match(css, /prefers-reduced-motion/);
});

test('Icons sind echte, nicht-triviale PNG-Dateien', async () => {
  for (const file of ['icons/icon-192.png','icons/icon-512.png']) {
    const data = await readFile(new URL(file, root));
    assert.deepEqual([...data.subarray(0,8)], [137,80,78,71,13,10,26,10]);
    assert.ok((await stat(new URL(file, root))).size > 1000);
  }
});

test('Eigenständiges Premium-Kartendesign hat klare Zustände, Wertfarben und Eckzahlen', async () => {
  const css = await text('styles.css');
  const app = await text('src/app.js');
  const sw = await text('sw.js');
  const html = await text('index.html');
  const manifest = JSON.parse(await text('manifest.webmanifest'));

  for (const token of [
    '--surface:', '--felt:', '--gold:', '.value-blue', '.value-green', '.value-yellow', '.value-red',
    '.card[data-value]::before', '.card[data-value]::after', '#discard-pile::after', '.table::before', '@keyframes selectablePulse',
    '.turn-token', '.discard-stage', '.turn-trail', '.turn-lane-self', '.turn-lane-other', '@keyframes pileReady', '@keyframes pileDraw', '@keyframes discardLand', '@keyframes boardSettle'
  ]) assert.ok(css.includes(token), `CSS-Merkmal fehlt: ${token}`);

  for (const token of ['setup-benefits', 'aria-live="polite"', 'opponent-name', 'opponent-summary', 'id="turn-token"', 'id="discard-stage"', 'id="turn-trail"', 'id="self-action"', 'id="other-action"', 'id="handoff-modal"']) {
    assert.ok(html.includes(token) || app.includes(token), `UI-Merkmal fehlt: ${token}`);
  }
  assert.match(html, /<button[^>]+id="status-pill"/);
  assert.match(app, /els\.status\.onclick=.*showResult/);
  assert.match(app, /'round-over':'Wertung'/);
  assert.match(app, /'game-over':'Endstand'/);
  assert.match(app, /Verdeckte Karte \$\{index\+1\}/);
  assert.match(app, /Karte \$\{index\+1\}: Wert \$\{card\.value\}/);

  assert.match(app, /data-value=/);
  assert.match(app, /opponent-table/);
  for (const token of ['.opponent-table','.mini-card.back','.mini-card.open']) assert.ok(css.includes(token), `Gegnertisch-Stil fehlt: ${token}`);
  assert.match(app, /swapDrawnCard/);
  assert.match(app, /createSavedGame/);
  assert.match(app, /restoreSavedGame/);
  assert.match(app, /BOT_PHASES/);
  assert.match(app, /chooseBotMandatorySwap/);
  for (const phase of ['initial-reveal','choose-pile','must-swap','deck-choice']) assert.ok(app.includes(`'${phase}'`));
  assert.match(app, /document\.body\.dataset\.phase/);
  assert.match(app, /pulseBoard/);
  assert.match(app, /viewerPlayerIndex/);
  assert.match(app, /lastPublicAction/);
  assert.match(app, /publicActions/);
  assert.match(app, /actionForSeat/);
  assert.match(app, /botHoldUntil/);
  assert.match(app, /engine\.js\?v=309/);
  assert.match(sw, /tiefstapel-v15/);
  assert.match(sw, /src\/app\.js\?v=309/);
  assert.match(sw, /manifest\.webmanifest\?v=309/);
  assert.match(sw, /icons\/icon-192\.png\?v=309/);
  assert.match(sw, /icons\/icon-512\.png\?v=309/);
  assert.match(html, /src\/app\.js\?v=309/);
  assert.match(html, /manifest\.webmanifest\?v=309/);
  assert.match(html, /icons\/icon-192\.png\?v=309/);
  assert.ok(manifest.icons.every(icon => icon.src.endsWith('?v=309')));
  assert.equal(manifest.theme_color, '#113e35');
});
