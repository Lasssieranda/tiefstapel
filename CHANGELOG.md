# Changelog

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
