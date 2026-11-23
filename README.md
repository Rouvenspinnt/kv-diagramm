# Mechatronik-Werkzeuge

**Zur Seite: https://rouvenspinnt.github.io/kv-diagramm/**

Rechnen und nachschlagen, ohne vorher zu wissen, wo es steht.
`index.html` ist die Startseite: ein Suchfeld über alle Werkzeuge, ein Formelfeld
mit Einheiten und Kacheln nach Fachgebiet.
Läuft ohne Server und ohne Build-Schritt — `index.html` im Browser öffnen genügt.

## Startseite (`index.html`)

- Suche über `tools.js`, das Verzeichnis aller Rechner. Getippt wird, wonach man sucht
  (`Vorwiderstand`, `cos phi`, `DNF`), nicht der Seitenname. Pfeiltasten und Eingabe bedienen die Liste.
- Formelfeld mit Einheiten, getragen von Math.js aus dem CDN: `12 V / 4.7 kohm` ergibt
  einen Strom, `90 km/h to m/s` rechnet um. Ohne Netz bleibt der Rest der Seite heil.
- Kacheln nach Fachgebiet, ebenfalls aus dem Verzeichnis. Ein neuer Rechner braucht
  genau einen Eintrag in `tools.js` und erscheint überall von selbst.

## KV-Diagramm (`kv-diagramm.html`)

- 2 bis 6 Variablen, ab 5 Variablen als verkoppelte Tafeln
- Wertetabelle klickbar und per Tastatur (`0`, `1`, `X` für don't care), ganze Y-Spalte als Text eingebbar
- KV-Diagramm mit beschrifteten Klammern (A / Ā) und farbig umrandeten Blöcken, auch über die Ränder hinweg
- Minimale DNF und KNF (Quine-McCluskey, essentielle Primimplikanten, Petrick mit Zeitbudget)
- Abhängigkeiten im Klartext und Logikplan nach IEC-Symbolen
- Druckansicht für den PDF-Export

## Elektrotechnik-Rechner

- **Ohm & Leistung** (`ohm.html`) — zwei Größen aus U, I, R, P eingeben, die anderen beiden kommen heraus
- **Widerstands-Farbcode** (`farbcode.html`) — Ringe ablesen oder einen Wert in Ringe umsetzen, 4 bis 6 Ringe, mit gezeichnetem Widerstand
- **LED & Spannungsteiler** (`led.html`) — Vorwiderstand mit Normwert aus E6/E12/E24, Verlustleistung, unbelasteter Teiler
- **Wechselstrom & Resonanz** (`wechselstrom.html`) — X_L, X_C, Scheinwiderstand, Phasenwinkel und Resonanzfrequenz

Eingaben verstehen Vorsätze und Schreibweisen wie `4k7`, `2.2k`, `0,1µF`, `20m`.

## Fertigung & Zerspanung

- **Drehzahl, Vorschub, Hauptzeit** (`zerspanung.html`) — v_c, Durchmesser und Drehzahl
  ineinander, dazu Zahnvorschub und Schnittzeit mit Anschnitt beim Bohren. Richtwerte für
  v_c je Werkstoff zum Anklicken, und eine Kurve, die zeigt wie steil die Drehzahl
  bei kleinen Werkzeugen steigt.
- **Gewinde & Kernloch** (`gewinde.html`) — Kernlochbohrer, Steigung, Kern- und
  Flankendurchmesser und Durchgangsloch von M1 bis M64, mit Feingewinden und der
  Rückwärtssuche vom gemessenen Loch zum Gewinde.
- **ISO-Passungen** (`passungen.html`) — Spiel und Übermaß einer Paarung wie H7/g6 in
  Mikrometern, mit den Grenzmaßen und einem Bild der beiden Toleranzfelder.

Die Zahlen stehen in `calc-fertigung.js` (Steigungen nach DIN 13-1, Durchgangslöcher nach
DIN EN 20273) und `calc-passung.js` (ISO 286). Der Kernlochbohrer ist für Regelgewinde
hinterlegt statt gerechnet (DIN 336): `d − P` würde an fünf Größen danebenliegen, weil
die kleinen Maße anders runden und M12 10,3 statt 10,2 ergäbe. Beim Feingewinde stimmt
`d − P`. Steigungen und Kernlochbohrer sind gegen zwei unabhängige Quellen geprüft;
bei den Durchgangslöchern gilt das für 27 der 30 Zeilen — M12, M14, M16 widersprechen
sich zwischen den Quellen, und M56 bis M64 steht in keiner frei zugänglichen Tabelle.
Die Passungen decken das System Einheitsbohrung ab —
die schweren Pressverbände ab `r` fehlen bewusst, weil ihre Grundabmaße über 50 mm in
Teilbereiche zerfallen.

## Mess- & Regeltechnik

- **Normsignal, SPS-Rohwert, Abweichung** (`normsignal.html`) — 4–20 mA oder 0–10 V auf
  den Messbereich und zurück, dazu der Rohwert 0–27648 einer Siemens-Analogbaugruppe mit
  Über- und Untersteuerung als Band, und zuletzt Abweichung und Toleranzband aus
  Prozent vom Messwert und Prozent vom Endwert.
- **Pt100 & Thermoelement** (`temperatur.html`) — Widerstand und Temperatur ineinander
  nach der gekrümmten Kennlinie, mit dem Leitungsfehler im Zweileiteranschluss, und
  Thermoelemente K, J und T mit der Vergleichsstelle.

Die Zahlen stehen in `calc-messen.js`: Callendar-van-Dusen nach DIN EN 60751, die
Thermospannungen als Polynome nach NIST ITS-90. Die Umkehrung (Spannung → Temperatur)
wird numerisch gesucht statt mit einem zweiten Koeffizientensatz — beide Kennlinien
steigen streng monoton, und der Test prüft das über den ganzen Bereich Grad für Grad.
Typ J ist bewusst auf −210…760 °C begrenzt, weil darüber ein anderer Satz gilt.
Koeffizienten und Kennlinie sind gegengeprüft und stimmen Ziffer für Ziffer. Die
Siemens-Rohwertgrenzen gelten für Analogeingaben; 2–10 V steht in keiner Siemens-Tabelle
und ist nur nach demselben Schema fortgeschrieben, und für 0–10 V führt Siemens keinen
Untersteuerungsbereich auf — beides steht als Hinweis auf der Seite.

## Schaltbilder

Ohm, LED/Teiler und Wechselstrom zeichnen die Schaltung, um die es gerade geht, und
beschriften sie mit den eingegebenen Werten — Symbole nach IEC 60617. Die Wechselstromseite
zeigt zusätzlich das Zeigerdiagramm: R waagerecht, X senkrecht, Z als schräger Zeiger, mit
dem Phasenwinkel als Bogen. Bei Last erscheint im Teiler ein zweiter Zweig.
Die SVG-Bausteine liegen gemeinsam in `draw.js`.

Dazu je Seite eine Grafik, die den Zusammenhang zeigt statt nur die Zahl:

- **Kennlinie** (Ohm) — I über U als Gerade mit Steigung 1/R, mit dem Arbeitspunkt
- **Spannungsbilanz** (LED) — ein Balken zeigt, wie viel von U_q im Vorwiderstand verheizt
  und wie viel in den LEDs umgesetzt wird
- **Z über f** (Wechselstrom) — die Resonanz als Einbruch der Kurve, f₀ markiert
- **Farbtafel** (Farbcode) — alle zwölf Ringfarben zum Nachschlagen
- **Impulsdiagramm** (KV) — dieselbe Funktion als Signalverlauf über alle Takte

Die beiden Kurven haben einen Ablesestrich: Mauszeiger darüber, Wert erscheint.
Die Flächenfarben sind mit dem Prüfskript der dataviz-Richtlinie gegen Farbsehschwäche
und Kontrast geprüft (hell `#0891b2`/`#c2820a`, dunkel `#0ea5b7`/`#c2820a`), die Beschriftung
sitzt zusätzlich direkt in der Fläche — Farbe allein trägt nirgends die Bedeutung.

Bewegung (einlaufende Tafeln, sich zeichnende Leitungen, hervorgehobene neue Messwerte) ist
durchweg Zugabe: unter `prefers-reduced-motion: reduce` bleibt alles stehen und vollständig.

## Hilfe an den Feldern

Neben jedem Eingabefeld steht ein `?`. Daraufzeigen oder antippen erklärt, was der Wert bedeutet, woher er kommt und wo man ihn findet — Datenblatt, Aufdruck oder Messung.
Die Texte stehen als `data-help` am Feld, die Mechanik einmal in `et.js`.

## Test

```
node test.js
node test-et.js
node test-fertigung.js
node test-messen.js
```

`test.js` prüft alle 256 Funktionen mit 3 Variablen sowie Zufallsfunktionen mit 4 bis 6 Variablen
(mit don't cares, DNF und KNF) gegen die Wertetabelle und auf überflüssige Terme.
`test-et.js` prüft Einheitenparser, E-Reihen, Ohm/Leistung, Farbcode in beide Richtungen,
die Wechselstromformeln und das Werkzeugverzeichnis samt Suche.
`test-fertigung.js` prüft Schnittdaten, Gewindetafel und Passungen gegen von Hand nachgerechnete Werte.
`test-messen.js` prüft Normsignale und Rohwertgrenzen, die Pt100-Kennlinie gegen die
Grundwertreihe und die Thermospannungen gegen die NIST-Tafeln, dazu Abweichung und Toleranz.
