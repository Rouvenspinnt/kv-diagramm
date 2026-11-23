# KV-Diagramm

**Zur Seite: https://rouvenspinnt.github.io/kv-diagramm/**

Wertetabelle eintragen, KV-Diagramm mit Blöcken, minimale DNF/KNF und Logikplan ablesen.
Läuft ohne Server und ohne Abhängigkeiten — `index.html` im Browser öffnen genügt.

## Funktionen

- 2 bis 6 Variablen, ab 5 Variablen als verkoppelte Tafeln
- Wertetabelle klickbar und per Tastatur (`0`, `1`, `X` für don't care), ganze Y-Spalte als Text eingebbar
- KV-Diagramm mit beschrifteten Klammern (A / Ā) und farbig umrandeten Blöcken, auch über die Ränder hinweg
- Minimale DNF und KNF (Quine-McCluskey, essentielle Primimplikanten, Petrick mit Zeitbudget)
- Abhängigkeiten im Klartext und Logikplan nach IEC-Symbolen
- Druckansicht für den PDF-Export

## Test

```
node test.js
```

Prüft alle 256 Funktionen mit 3 Variablen sowie Zufallsfunktionen mit 4 bis 6 Variablen
(mit don't cares, DNF und KNF) gegen die Wertetabelle und auf überflüssige Terme.
