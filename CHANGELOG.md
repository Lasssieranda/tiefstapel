# Changelog

## 0.3.10 – 2026-08-14
- Die 3×4-Kartenauslage bleibt in den engen Entscheidungszuständen „Tauschen“ und „Ablegen“ vollständig sichtbar und antippbar.
- In diesen Zuständen werden Karten, Zwischenräume und Überschrift gezielt verdichtet, statt die untere Reihe durch die feste App-Shell abzuschneiden.
- App-Shell `?v=310`, Cache `tiefstapel-v16`.

## 0.3.9 – 2026-08-14
- Mobile Spielansicht als fester Vollbildbereich ohne vertikales Seitenscrollen.
- App-Shell `?v=309`, Cache `tiefstapel-v15`.

## 0.3.8 – 2026-08-14
- Alle nachträglich eingeführten Kartenbewegungs- und Ziehgesten wurden zurückgenommen.
- Kartendesign, Farben und Bedienung sind wieder auf dem Stand vor diesen Änderungen; App-Shell `?v=308`, Cache `tiefstapel-v14`.

## 0.3.4 – 2026-08-14
- Gegner werden als klar lesbare 3×4-Minitische mit eigenen Kartenrückseiten, offenen Werten und sichtbaren Lücken für entfernte Karten dargestellt.
- Aktiver Gegnertisch wird dezent hervorgehoben; auf dichten iPhone-Höhen bleibt das Raster kompakt und ohne Überlauf.
- App-Shell auf `?v=304`, Cache auf `tiefstapel-v10`.

## 0.3.3 – 2026-08-14
- Neue zweigeteilte Zugspur: „Dein letzter Zug“ und „Letzter Gegnerzug“ bleiben parallel sichtbar.
- Die Zugspur speichert nur sichere öffentliche Aktionen und bleibt nach Offline-Neustart erhalten.
- Kompakter iPhone-Layoutmodus hält die neue Übersicht bei 390×844 und 360×740 ohne Überlauf lesbar.
- App-Shell auf `?v=303`, Offline-Cache auf `tiefstapel-v9`.

## 0.3.2 – 2026-08-14
- Festes eigenes 3×4-Spielbrett: Bot-Züge aktualisieren nur Gegner-Miniaturen, Punktestand und Ablage; fremde Karten werden nicht mehr groß eingeblendet.
- Zentraler Ablagestapel mit sichtbarer Stapeltiefe und dauerhaftem, öffentlichem Zugbeleg wie „Du legt 10 ab“.
- Ruhiger Bot-Rhythmus: Quelle, Ablegen und mindestens 1,5 Sekunden Lesepause, bevor der nächste sichtbare Zug beginnt.
- Lokaler Mehrspieler schützt Karten beim Wechsel mit einem bewussten „Gerät weitergeben“-Schirm.
- Save-Version 2 speichert und validiert die letzte öffentliche Aktion; alte Version-1-Spielstände werden sicher übernommen.
- Mobile-Browser- und Offline-Prüfung bei 390×844 und 360×740; App-Shell auf `?v=302`, Offline-Cache auf `tiefstapel-v8`.

## 0.3.1 – 2026-08-13
- Premium-Spiel-HUD mit klarer aktiver-Spieler-Markierung und stärkerer optischer Hierarchie.
- Stapelwahl ist als ruhiger Licht-/Rahmen-Puls sichtbar; Zieh-, Tausch-, Aufdeck- und Spaltenaktionen erhalten kontrolliertes Bewegungsfeedback.
- Mobile Zielabläufe bei 390×844 und 360×740 inklusive Offline-Neustart nach dem UI-Update geprüft.
- App-Shell auf `?v=301` und Offline-Cache auf `tiefstapel-v7` aktualisiert.

## 0.3.0 – 2026-08-13
- Vollständiges Mobile-first-Redesign mit tiefgrünem Spieltisch, warmen Papierflächen und zurückhaltenden Goldakzenten.
- Eigenständige, kontrastreiche Zahlenkarten mit klaren Auswahl-, Zieh- und Tauschzuständen.
- Neu gestaltete Startansicht, Punktetafel, Gegnerübersicht, Aktionsführung und Rundenergebnisse.
- Neue maskierbare App-Icons passend zur TIEFSTAPEL-Identität.
- Semantisches HTML, reduzierte Bewegungen und verbesserte Screenreader-Beschriftungen.
- Versionierte, streng validierte lokale Spielstände mit sicherer Übernahme bestehender Partien.
- Unterbrochene Computerzüge werden auch nach einem Reload aus `must-swap` und `deck-choice` automatisch fortgesetzt.
- Wertung bleibt nach „Punktestand ansehen“ direkt wieder erreichbar; kompakte Gegnerauslagen erhalten Screenreader-Zusammenfassungen.
- Dialoge und Kartenpositionen sind eindeutig für Screenreader benannt; Browser-Zoom bleibt verfügbar.
- Reale Browserprüfung bei 390×844 und 360×740 einschließlich vollständigem Zugablauf, neuer Runde und Offline-Neustart.
- Zusätzliche Touch-Proben für Zieh- und Tauschzustände an 30 Breakpoint-nahen Viewports ohne Überlauf.
- App-Shell auf `?v=300` und Offline-Cache auf `tiefstapel-v6` aktualisiert.

## 0.2.0 – 2026-08-05
- Vollständig helles, klassisches Erscheinungsbild mit cremefarbenen Papierflächen und grünem Filztisch.
- Eigenständige Karten im Vierfarbensystem: Blau, Grün, Gelb und Rot.
- Klassische Eckzahlen, große Mittelwerte und gemusterte blaue Kartenrückseiten.
- Helle Dialoge, Punktetafeln und Bedienelemente mit verbessertem Tageslichtkontrast.
- Mobile Sichtprüfung bei 390×844 und 360×740 ohne Überlauf.
- Offline-Cache auf Version v3 aktualisiert.

## 0.1.0 – 2026-08-05
- Vollständige Regel-Engine für 2–4 Spieler.
- Lokaler Mehrspieler und 1–3 Computergegner mit drei Stärken.
- Touchoptimierte 3×4-Kartenauslage mit eigener visueller Identität.
- Dreier-Spalten, Schlusszug, Verdopplungsregel und 100-Punkte-Spielende.
- Lokale Speicherung, Sound, Haptik und deutsche Kurzanleitung.
- Installierbare Offline-PWA mit eigenständigen Icons.
- Mobile QA bei 390×844 und 360×740; Startdialog-Overlay korrigiert.
- 12 automatisierte Tests einschließlich vollständiger KI-Partie.
