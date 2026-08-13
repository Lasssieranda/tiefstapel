# TIEFSTAPEL

Ein eigenständiges, touchoptimiertes Zahlen-Kartenspiel für 2 bis 4 Spieler.

## Funktionen

- 1–4 lokale menschliche Spieler
- 0–3 Computergegner in drei Stärken
- Regelgetreue 3×4-Auslage, Dreier-Spalten, Rundenwertung und 100-Punkte-Spielende
- Versionierte, validierte lokale Speicherung laufender Partien
- Sound und haptisches Feedback
- Installierbare Offline-PWA für iPhone und andere moderne Browser
- Hochwertiges Mobile-first-Design mit tiefgrünem Spieltisch, vier Kartenfarben und eigenständigen App-Icons
- Benannte Dialoge, nummerierte Kartenansagen, Gegnerzusammenfassungen und verfügbarer Browser-Zoom

## Auf dem iPhone installieren

Für die Installation muss der Ordner über eine HTTPS-Adresse bereitgestellt werden. Dann:

1. Adresse in **Safari** öffnen.
2. Auf **Teilen** tippen.
3. **Zum Home-Bildschirm** wählen.
4. TIEFSTAPEL über das neue App-Symbol starten.

Eine ZIP-Datei oder eine lokal geöffnete HTML-Datei allein ist noch keine iPhone-Installation; Service Worker und Home-Bildschirm-Installation benötigen HTTPS.

## Lokal testen

```bash
python3 -m http.server 4173
```

Danach `http://localhost:4173` öffnen.

## Qualitätssicherung

```bash
npm test
npm run check
```

Getestete mobile Zielgrößen: 390×844 und 360×740 CSS-Pixel. Zieh- und Tauschzustände wurden zusätzlich an 30 breakpoint-nahen Touch-Viewports geprüft.

## Rechte

TIEFSTAPEL verwendet eine eigenständige Bezeichnung und selbst erstellte Gestaltung. Spielname, Logos und Grafiken anderer Anbieter sind nicht enthalten.
