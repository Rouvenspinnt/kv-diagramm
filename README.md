# KV-Diagramm & Elektrotechnik-Rechner

**Zur Seite: https://rouvenspinnt.github.io/kv-diagramm/**

Wertetabelle eintragen, KV-Diagramm mit Blöcken, minimale DNF/KNF und Logikplan ablesen —
dazu vier Rechner für den Elektrotechnik-Alltag.
Läuft ohne Server und ohne Abhängigkeiten — `index.html` im Browser öffnen genügt.

## KV-Diagramm (`index.html`)

- 2 bis 6 Variablen, ab 5 Variablen als verkoppelte Tafeln
- Wertetabelle klickbar und per Tastatur (`0`, `1`, `X` für don't care), ganze Y-Spalte als Text eingebbar
- KV-Diagramm mit beschrifteten Klammern (A / Ā) und farbig umrandeten Blöcken, auch über die Ränder hinweg
- Minimale DNF und KNF (Quine-McCluskey, essentielle Primimplikanten, Petrick mit Zeitbudget)
- Abhängigkeiten im Klartext und Logikplan nach IEC-Symbolen
- Druckansicht für den PDF-Export

## Elektrotechnik-Rechner

- **Ohm & Leistung** (`ohm.html`) — zwei Größen aus U, I, R, P eingeben, die anderen beiden kommen heraus; dazu Reihen- und Parallelschaltung
- **Widerstands-Farbcode** (`farbcode.html`) — Ringe ablesen oder einen Wert in Ringe umsetzen, 4 bis 6 Ringe, mit gezeichnetem Widerstand
- **LED & Spannungsteiler** (`led.html`) — Vorwiderstand mit Normwert aus E6/E12/E24, Verlustleistung, unbelasteter Teiler
- **Wechselstrom & Resonanz** (`wechselstrom.html`) — X_L, X_C, Scheinwiderstand, Phasenwinkel und Resonanzfrequenz

Eingaben verstehen Vorsätze und Schreibweisen wie `4k7`, `2.2k`, `0,1µF`, `20m`.

## Hilfe an den Feldern

Neben jedem Eingabefeld steht ein `?`. Daraufzeigen oder antippen erklärt, was der Wert bedeutet, woher er kommt und wo man ihn findet — Datenblatt, Aufdruck oder Messung.
Die Texte stehen als `data-help` am Feld, die Mechanik einmal in `et.js`.

## Test

```
node test.js
node test-et.js
```

`test.js` prüft alle 256 Funktionen mit 3 Variablen sowie Zufallsfunktionen mit 4 bis 6 Variablen
(mit don't cares, DNF und KNF) gegen die Wertetabelle und auf überflüssige Terme.
`test-et.js` prüft Einheitenparser, E-Reihen, Ohm/Leistung, Farbcode in beide Richtungen und die Wechselstromformeln.
