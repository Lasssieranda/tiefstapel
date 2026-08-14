# Project State

## Ziel
Installierbares, touchoptimiertes Zahlen-Kartenspiel für iPhone mit 1–3 Computergegnern und lokalem Mehrspieler.

## Status
Version 0.3.2 ist als ruhige, feste Mobile-Spielansicht getestet und über GitHub Pages veröffentlicht.

## Befehle
- Tests: `npm test`
- Syntaxprüfung: `npm run check`
- Lokal: `npm run serve`

## Entscheidungen
- Eigenständiger Name und eigenes Design: TIEFSTAPEL.
- PWA statt nativer App-Store-App.
- 2–4 Spieler, frei kombinierbar aus Menschen und Bots.
- Öffentliche Bereitstellung erst nach ausdrücklicher Zustimmung.

## Verifikation
- 16 automatisierte Tests einschließlich vollständiger Vier-KI-Partie, validierter Spielstand-Wiederaufnahme und fortgesetzter Bot-Zwischenphasen.
- Reale Browserabläufe bei 390×844 und 360×740 CSS-Pixeln: Startkarten, Ziehen, Tauschen, Ablegen/Aufdecken und Ablagetausch.
- Rundenende, Start der nächsten Runde und Offline-Neustart geprüft.
- Zieh- und Tauschzustände bei 30 breakpoint-nahen Touch-Viewports ohne Überlauf geprüft.
- Manipulierte Speicherwerte, Ergebnis-Recovery und kompakte Screenreader-Zusammenfassungen im Browser geprüft.
- Benannte Dialoge, nummerierte Kartenansagen und verfügbarer Browser-Zoom geprüft.
- HTML, CSS, JavaScript, App-Shell, Manifest, Icons und Offline-Cache validiert.
