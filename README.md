# Mechatroniker-Werkbank

**Zur Seite: https://rouvenspinnt.github.io/mechatroniker-werkbank/**

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
- **Leitung & Absicherung** (`leitung.html`) — Querschnitt aus Strom, Länge und zulässigem
  Spannungsfall, dazu Strombelastbarkeit nach Verlegeart, Umgebungstemperatur und Häufung,
  und die passende Sicherung. Enthält außerdem die Gegenrechnung (Spannungsfall bei
  gegebenem Querschnitt) und die Auslösebereiche der Kennlinien B, C und D.
- **Drehstrom & Motor** (`drehstrom.html`) — Nennstrom und Anlaufstrom aus dem Typenschild,
  Stern und Dreieck mit gezeichnetem Klemmbrett, und die Kondensatorgröße zur
  Blindleistungskompensation
- **Kondensator & Spule** (`kondensator.html`) — Zeitkonstante und Ladekurve des RC-Glieds
  mit Diagramm und Tafel über fünf τ, Zeitkonstante und Energie der Spule, und die
  Pufferzeit eines Stützkondensators
- **Transformator & Netzteil** (`trafo.html`) — Windungen, Spannungen und Ströme ineinander
  mit Wirkungsgrad; dazu Scheitelwert hinter dem Gleichrichter, Brummspannung und der
  nötige Ladekondensator

Eingaben verstehen Vorsätze und Schreibweisen wie `4k7`, `2.2k`, `0,1µF`, `20m`.

Die Formeln für Leitung und Drehstrom stehen in `calc-elektro.js`. Die Strombelastbarkeit
kommt aus DIN VDE 0298-4 Tabelle 2 (Ausgabe 2003; Kupfer, PVC, Bezug 30 °C), die
Minderungsfaktoren aus den Tabellen 5 und 6 derselben Norm, die Bedingung Ib ≤ In ≤ Iz aus
DIN VDE 0100-430 und die Auslösebereiche aus DIN EN 60898-1. Die Faktoren für
Umgebungstemperatur und Häufung sind Bänder, keine Punkte: 38 °C fallen in das 40-°C-Band,
elf Stromkreise werden wie zwölf gerechnet — es gilt immer der nächstschlechtere Wert.
Bei der gG-Schmelzsicherung kommt zur Bedingung Ib ≤ In ≤ Iz noch I2 ≤ 1,45 · Iz hinzu;
weil gG erst bei 1,6 · In auslöst, bleibt dort nur In ≤ Iz / 1,1. Beim LS-Schalter ist das
automatisch erfüllt, weil dort I2 = 1,45 · In ist.

Der Spannungsfall ist die ohmsche Näherung über die Leitfähigkeit, wie sie im Tabellenbuch
steht. Zwei Dinge fehlen darin, beide in dieselbe Richtung: der induktive Anteil (ab etwa
25 mm² spürbar, bei 120 mm² fast ein Drittel) und die Erwärmung des Leiters — DIN VDE
0100-520 Anhang G rechnet mit dem Warmwert 0,0225 Ω·mm²/m statt mit κ = 56. Für die Prüfung
ist κ = 56 die richtige Rechnung, für eine echte Anlage die optimistische. Die Seite sagt
das auch. Die Sicherungsreihe endet bei 63 A, der Häufungsfaktor gilt für gebündelte
Leitungen; auf einer Kabelwanne mit Abstand darf mehr fließen.

Bewusst nicht gerechnet: Kurzschlussfestigkeit, Abschaltbedingung über die Schleifenimpedanz
und Selektivität. Das sind eigene Nachweise, für die die Angaben auf der Seite nicht reichen.

Kondensator, Spule und Trafo stehen in `calc-bauteile.js` und rechnen durchgehend in
Basiseinheiten — Ohm, Farad, Henry, Sekunde. Die Eingabefelder nehmen die Vorsätze entgegen
(`100µ`, `10m`, `4k7`), deshalb ist die Feldeinheit immer die Basiseinheit. Beim Netzteil
fehlen bewusst der Innenwiderstand des Trafos und der Stromflusswinkel am Ladekondensator:
beides macht reale Netzteile schlechter, als die Rechnung sie aussehen lässt.

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

## Antrieb & Mechanik

- **Drehmoment, Motor & Getriebe** (`antrieb.html`) — zwei von Leistung, Drehzahl und
  Moment geben die dritte; dazu der Asynchronmotor mit Synchrondrehzahl, Schlupf und
  Betrieb am Umrichter, und das Getriebe, das Drehzahl gegen Moment tauscht, ein- oder
  mehrstufig. Drehzahl und Moment wandern von Abschnitt zu Abschnitt weiter.
- **Hebel, Spannung & Schrauben** (`mechanik.html`) — das Hebelgesetz mit einer
  maßstäblichen Zeichnung für den ein- und den zweiseitigen Hebel, Flächenpressung mit
  Sicherheit gegen die Streckgrenze je Werkstoff, und die Anzugsmomente für 8.8, 10.9
  und 12.9 mit einer groben Korrektur für andere Reibungszahlen.

Die Zahlen stehen in `calc-antrieb.js`: Werkstoffkennwerte als Rp0,2 und Rm, Anzugsmomente
als Richtwerte nach VDI 2230 für µ = 0,14. Die Reibungskorrektur ist ausdrücklich eine
Näherung — wer eine Verbindung auslegt statt nachzuziehen, rechnet nach VDI 2230.

## Pneumatik & Hydraulik

- **Zylinder, Luftverbrauch & Druckübersetzer** (`pneumatik.html`) — Kraft beim Aus- und
  Einfahren, Kolbengeschwindigkeit und Hubzeit, der Luftverbrauch in Normlitern und der
  Druckübersetzer samt dem Weg, der dabei verloren geht. Bohrung und Stange gelten für
  alle vier Abschnitte.
- **Kv-Wert & Rohrquerschnitt** (`stroemung.html`) — das Ventil nach Durchfluss und
  Druckabfall, für Wasser und Öl über die Dichte, für Druckluft mit der Sperrgrenze bei
  Schallgeschwindigkeit; dazu der Innendurchmesser aus Volumenstrom und
  Strömungsgeschwindigkeit, mit Richtwerten je Leitungsart.

Die Formeln stehen in `calc-fluid.js`. Der Luftverbrauch ist auf 1,013 bar Umgebungsdruck
bezogen. Für Druckluft gilt die vereinfachte Industrieformel, die Bürkert und Samson aus
IEC 60534 ableiten — nicht die volle Rechnung der Norm; viele Hersteller
geben für Pneumatikventile stattdessen einen Normvolumenstrom oder die Werte C und b an —
dann gilt deren Angabe, und die Seite sagt das auch.

## Nachschlagen (`nachschlagen.html`)

Vierzehn geschriebene Artikel zu den Fragen, die beim Rechnen aufkommen: wie ein
Drehstrommotor funktioniert, warum Stern-Dreieck drittelt, was der FI sieht und was nicht,
U/f am Umrichter, Selbsthaltung und warum der Aus-Taster ein Öffner ist, der SPS-Zyklus,
das KV-Diagramm lesen, P/I/D, warum 4–20 mA, Pt100 gegen Thermoelement, H7/g6, warum v_c
gleich bleibt, die Zahlen am Wegeventil und warum man mit Drehmoment anzieht.

Jeder Artikel hängt als eigener Eintrag in der Registry und damit in der Suche. Damit eine
ganze Frage funktioniert, wirft `suche()` vorher die Füllwörter weg — ohne das fände
„wie funktioniert ein Drehstrommotor" nichts, weil sonst jedes Wort vorkommen muss.
Unter jedem Artikel steht der Querverweis auf den passenden Rechner.

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
node test-antrieb.js
node test-fluid.js
node test-elektro.js
node test-bauteile.js
```

`test.js` prüft alle 256 Funktionen mit 3 Variablen sowie Zufallsfunktionen mit 4 bis 6 Variablen
(mit don't cares, DNF und KNF) gegen die Wertetabelle und auf überflüssige Terme.
`test-et.js` prüft Einheitenparser, E-Reihen, Ohm/Leistung, Farbcode in beide Richtungen,
die Wechselstromformeln und das Werkzeugverzeichnis samt Suche.
`test-fertigung.js` prüft Schnittdaten, Gewindetafel und Passungen gegen von Hand nachgerechnete Werte.
`test-messen.js` prüft Normsignale und Rohwertgrenzen, die Pt100-Kennlinie gegen die
Grundwertreihe und die Thermospannungen gegen die NIST-Tafeln, dazu Abweichung und Toleranz.
`test-antrieb.js` prüft Leistung und Moment, Schlupf und Polzahl, Getriebe, Hebel,
Flächenpressung und die Anzugsmomente gegen von Hand nachgerechnete Werte.
`test-fluid.js` prüft Zylinderflächen und -kräfte, Geschwindigkeit, Luftverbrauch,
Druckübersetzer, Kv-Werte und Rohrquerschnitte.
