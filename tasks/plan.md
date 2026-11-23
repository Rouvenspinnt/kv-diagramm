# Vom KV-Werkzeug zum Mechatroniker-Werkzeug

Stand: 23.11.2025. Entschieden mit dem Auftraggeber:
alle vier Fachgebiete, Startseite mit Suche, Math.js fuer ein Formelfeld mit Einheiten.

## Was es heute gibt

Fuenf Seiten, flache Reiterleiste in `et.js`, kein Build-Schritt, 2481 Zeilen.
`et.js` haelt Einheitenparser, E-Reihen, Ohm, Farbcode, Wechselstrom, Navigation und Hilfe.
`draw.js` zeichnet Schaltbilder und Kurven, `kv.js` rechnet Quine-McCluskey.
`test.js` und `test-et.js` laufen unter node, ohne Browser.

## Abhaengigkeiten

```
Registry (tools.js)
   |--> Navigation          (et.js, alle Seiten)
   |--> Startseite + Suche  (index.html)
   '--> jeder neue Rechner  (ein Eintrag je Rechner)

Math.js (CDN) --> Formelfeld (nur Startseite, muss ohne CDN ausfallsicher sein)

Rechenkerne (calc-*.js, je Gebiet) --> Seiten + node-Tests
```

Die Registry blockiert alles andere: ohne sie findet man die Rechner nicht,
und jede Seite muesste ihre Navigation wieder selbst schreiben.
Die vier Fachgebiete haengen untereinander an nichts — sie teilen sich nur
`app.css`, `et.js` und die Registry. Deshalb laufen sie nacheinander, nicht
parallel: zwei Schreiber in denselben Dateien kosten mehr als sie einbringen.

## Schnitt

Jede Aufgabe ist ein vollstaendiger Weg: Rechenkern mit node-Test, Seite,
Hilfetexte an jedem Feld, Registry-Eintrag. Keine Phase liefert eine
halbe Schicht, die erst spaeter nutzbar wird.

## Phasen

### Phase 0 — Fundament (blockiert alles)

| # | Aufgabe | Fertig, wenn |
|---|---|---|
| 0.1 | `tools.js`: Registry aller Rechner (id, Titel, Gebiet, Datei, Anker, Stichworte) | Registry laedt in node und im Browser, enthaelt die fuenf vorhandenen Werkzeuge |
| 0.2 | KV-Werkzeug nach `kv-diagramm.html`, neue `index.html` wird Startseite mit Kacheln je Gebiet | Alle fuenf Altseiten ueber die Startseite erreichbar, alte Links im README gezogen |
| 0.3 | `ET.buildNav` auf die Registry umstellen: Uebersicht-Link plus die Werkzeuge des aktuellen Gebiets | Keine Seite listet Navigationseintraege mehr selbst, Leiste bleibt bei 50 Eintraegen lesbar |
| 0.4 | Suche ueber die Registry auf der Startseite, Tastatur bedienbar | "Kernloch", "4-20", "M8" fuehren zum richtigen Rechner; Pfeiltasten und Enter funktionieren |
| 0.5 | Formelfeld mit Math.js vom CDN | `12 V / 4.7 kohm` ergibt den Strom; faellt das CDN aus, zeigt das Feld einen Hinweis statt eines Fehlers |

**Pruefpunkt A:** Alle Altseiten erreichbar, `node test.js` und `node test-et.js` gruen,
375/857/1280 px ohne Ueberlauf, live auf GitHub Pages.

### Phase 1 — Fertigung und Zerspanung

| # | Rechner | Kern |
|---|---|---|
| 1.1 | Schnittgeschwindigkeit <-> Drehzahl | `n = vc*1000/(pi*d)`, beide Richtungen |
| 1.2 | Vorschub und Zahnvorschub | `vf = n*z*fz` |
| 1.3 | Hauptzeit | `th = L/(n*f)`, mit An- und Ueberlauf |
| 1.4 | Kernloch- und Gewindetabelle | M1..M64 Regel- und Feingewinde, Kernloch, Steigung, Durchgangsbohrung |
| 1.5 | Passungen | ISO-Toleranzfelder H7/g6 usw., Spiel und Uebermass |
| 1.6 | Werkstoff-Richtwerte vc | Nachschlagetabelle, speist 1.1 |

**Pruefpunkt B:** Tabellen gegen eine zweite Quelle stichprobenartig geprueft.

### Phase 2 — Mess- und Regeltechnik

| # | Rechner | Kern |
|---|---|---|
| 2.1 | Normsignal skalieren | 4–20 mA und 0–10 V auf Messbereich, beide Richtungen |
| 2.2 | SPS-Rohwert | 0–27648 <-> physikalischer Wert, mit Unter- und Uebersteuerung |
| 2.3 | Pt100 / Pt1000 | Callendar-van-Dusen, Widerstand <-> Temperatur |
| 2.4 | Thermoelemente | Typen K, J, T: Spannung <-> Temperatur |
| 2.5 | Messabweichung | absolut, relativ, Toleranzband |

### Phase 3 — Antrieb und Mechanik

| # | Rechner | Kern |
|---|---|---|
| 3.1 | Drehmoment, Drehzahl, Leistung | `P = 2*pi*n*M`, je zwei Groessen gegeben |
| 3.2 | Asynchronmotor | Polpaare, Synchrondrehzahl, Schlupf, Umrichterfrequenz |
| 3.3 | Getriebe und Riemen | Uebersetzung, Drehzahl, Moment, mehrstufig |
| 3.4 | Hebel und Moment | einseitig, zweiseitig, Gleichgewicht |
| 3.5 | Flaechenpressung und Festigkeit | `sigma = F/A`, Sicherheit gegen Streckgrenze |
| 3.6 | Schraubenanzugsmoment | Richtwerte nach Festigkeitsklasse |

### Phase 4 — Pneumatik und Hydraulik

| # | Rechner | Kern |
|---|---|---|
| 4.1 | Zylinderkraft | Kolben- und Ringflaeche, Druck, Wirkungsgrad |
| 4.2 | Kolbengeschwindigkeit | Volumenstrom und Flaeche |
| 4.3 | Luftverbrauch | je Hub und je Minute, auf Normzustand bezogen |
| 4.4 | Druckuebersetzer | Flaechenverhaeltnis |
| 4.5 | Kv-Wert | Ventilauswahl nach Durchfluss und Druckabfall |
| 4.6 | Rohr- und Schlauchquerschnitt | Stroemungsgeschwindigkeit |

## Regeln fuer jeden Rechner

- Rechenkern in einer `calc-*.js` je Gebiet, mit `module.exports`-Weiche, damit node ihn testen kann.
- Mindestens ein node-Test je Formel, mit einem von Hand nachgerechneten Wert.
- Jedes Eingabefeld bekommt `data-help`: was eintragen, was der Wert bedeutet, woher er kommt.
- Ein Schaltbild oder eine Kurve nur, wo sie etwas zeigt, was Text nicht zeigt.
- Tabellen (Gewinde, Passungen, vc) sind Daten, kein Stil: eine Datei je Tabelle.

## Was bewusst wegbleibt

- Kein Build-Schritt, kein Framework, keine Paketverwaltung. Die Seite bleibt
  kopierbar und laeuft von jedem Webserver.
- Math.js nur auf der Startseite, nicht auf jeder Seite: sonst zahlt jede Seite
  170 kB fuer ein Feld, das sie nicht hat.
- Keine Benutzerkonten, kein Speichern in der Cloud. Was gespeichert wird,
  bleibt im Browser.
