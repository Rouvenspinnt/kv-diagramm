// Selbsttest Antrieb und Mechanik:  node test-antrieb.js
var A = require('./calc-antrieb.js');
var fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.error('FAIL: ' + msg); } }
function near(a, b, msg, tol) {
  var t = tol === undefined ? 1e-9 : tol;
  ok(isFinite(a) && Math.abs(a - b) <= t, msg + ' (war ' + a + ', erwartet ' + b + ')');
}

/* ---------- Drehmoment, Drehzahl, Leistung ---------- */
// 10 Nm bei 1500 1/min: omega = 2*pi*1500/60 = 157,0796 1/s
near(A.winkelgeschwindigkeit(1500), 157.07963268, 'Winkelgeschwindigkeit bei 1500', 1e-6);
near(A.leistung(10, 1500), 1570.7963268, '10 Nm bei 1500 sind 1,57 kW', 1e-5);
// Typenschild 4 kW bei 1450: M = 4000 / (2*pi*1450/60) = 26,343 Nm
near(A.moment(4000, 1450), 26.3427, '4 kW bei 1450 sind 26,34 Nm', 1e-3);
near(A.drehzahlAus(1570.7963268, 10), 1500, 'und die Drehzahl wieder zurueck', 1e-6);
near(A.ab(4000, 0.9), 3600, 'Wirkungsgrad als Bruch');
near(A.ab(4000, 90), 3600, 'Wirkungsgrad in Prozent geht auch');
ok(!isFinite(A.ab(4000, 150)), 'ueber 100 Prozent Wirkungsgrad gibt es nicht');
ok(!isFinite(A.leistung(10, 0)), 'ohne Drehzahl keine Leistung');
ok(!isFinite(A.moment(-5, 1450)), 'negative Leistung ergibt nichts');

/* ---------- Asynchronmotor ---------- */
near(A.synchrondrehzahl(50, 1), 3000, 'zweipolig laeuft mit 3000');
near(A.synchrondrehzahl(50, 2), 1500, 'vierpolig mit 1500');
near(A.synchrondrehzahl(50, 3), 1000, 'sechspolig mit 1000');
near(A.synchrondrehzahl(60, 2), 1800, '60 Hz vierpolig mit 1800');
// Typenschild 1450 bei 50 Hz: Schlupf (1500-1450)/1500 = 3,33 Prozent
near(A.schlupf(1500, 1450), 0.0333333333, 'Schlupf eines 1450er Motors', 1e-9);
near(A.laeuferdrehzahl(1500, 0.0333333333), 1450, 'und wieder zurueck', 1e-6);
near(A.laeuferdrehzahl(1500, 3.3333333), 1450, 'Schlupf in Prozent geht auch', 1e-4);
near(A.schlupf(1500, 1500), 0, 'ohne Schlupf kein Moment');
// Polpaarzahl aus dem Typenschild, die Nenndrehzahl liegt immer darunter
ok(A.polpaare(50, 1450) === 2, '1450 ist ein vierpoliger Motor');
ok(A.polpaare(50, 2850) === 1, '2850 ist ein zweipoliger');
ok(A.polpaare(50, 960) === 3, '960 ist ein sechspoliger');
ok(A.polpaare(50, 715) === 4, '715 ist ein achtpoliger');
// Umrichter: unter der Nennfrequenz bleibt das Moment, darueber faellt es
near(A.umrichter(25, 50, 26), 26, 'halbe Frequenz, volles Moment');
near(A.umrichter(50, 50, 26), 26, 'am Nennpunkt unveraendert');
near(A.umrichter(75, 50, 26), 17.3333333, 'darueber Feldschwaechung', 1e-6);

/* ---------- Getriebe ---------- */
near(A.uebersetzung(1500, 100), 15, 'Uebersetzung ins Langsame');
near(A.abtriebsdrehzahl(1500, 15), 100, 'Abtriebsdrehzahl');
near(A.abtriebsmoment(10, 15), 150, 'Moment waechst mit der Uebersetzung');
near(A.abtriebsmoment(10, 15, 0.95), 142.5, 'mit Wirkungsgrad bleibt weniger');
near(A.abtriebsmoment(10, 15, 95), 142.5, 'Wirkungsgrad in Prozent geht auch');
near(A.stufen([3, 5]), 15, 'zwei Stufen multiplizieren sich');
near(A.stufen([2, 2, 2.5]), 10, 'drei Stufen auch');
ok(!isFinite(A.stufen([])), 'ohne Stufe keine Uebersetzung');
// Leistung bleibt bis auf die Verluste erhalten
var mAb = A.abtriebsmoment(10, 15, 1);
near(A.leistung(mAb, A.abtriebsdrehzahl(1500, 15)), A.leistung(10, 1500),
     'ohne Verluste bleibt die Leistung gleich', 1e-9);

/* ---------- Hebel ---------- */
var h = A.hebel(100, 500, NaN, 100);
near(h.F2, 500, 'kurzer Hebelarm, grosse Kraft');
near(h.M, 50, 'Moment am Drehpunkt in Nm');
var h2 = A.hebel(NaN, 500, 500, 100);
near(h2.F1, 100, 'und andersherum');
var h3 = A.hebel(100, NaN, 500, 100);
near(h3.l1, 500, 'fehlender Hebelarm');
ok(A.hebel(100, 500, 500, 100) === null, 'nichts gesucht gibt kein Ergebnis');
ok(A.hebel(100, 500, NaN, NaN) === null, 'zwei Unbekannte sind eine zu viel');

/* ---------- Flaeche, Spannung, Sicherheit ---------- */
near(A.kreis(10), 78.5398163, 'Kreisflaeche 10 mm', 1e-6);
near(A.ring(20, 10), 235.6194490, 'Ringflaeche 20 auf 10', 1e-6);
near(A.rechteck(20, 5), 100, 'Rechteckflaeche');
ok(!isFinite(A.ring(10, 10)), 'Ring ohne Wandstaerke gibt es nicht');
ok(!isFinite(A.ring(10, 12)), 'Innen groesser als aussen auch nicht');
// 1000 N auf 100 mm2 sind 10 N/mm2, das ist 10 MPa
near(A.spannung(1000, 100), 10, '1000 N auf 100 mm2');
near(A.sicherheit(235, 10), 23.5, 'Sicherheit gegen die Streckgrenze');
near(A.tragkraft(235, 100, 2), 11750, 'zulaessige Kraft bei Sicherheit 2');
// Jeder Werkstoff hat eine Streckgrenze unter der Zugfestigkeit
A.WERKSTOFF.forEach(function (w) {
  ok(w.rp > 0 && w.rm > 0, w.name + ': beide Kennwerte gesetzt');
  ok(w.rp < w.rm, w.name + ': Streckgrenze unter der Zugfestigkeit');
});
// Grauguss fliesst nicht, der ist als sproede gekennzeichnet
ok(A.WERKSTOFF.some(function (w) { return w.sproede; }), 'sproede Werkstoffe sind markiert');
ok(A.WERKSTOFF.filter(function (w) { return /GJL/.test(w.name); })
   .every(function (w) { return w.sproede; }), 'Grauguss ist sproede');
// Aluminium steht mit seinem Zustand drin, sonst ist der Wert nichts wert
ok(A.WERKSTOFF.filter(function (w) { return /EN AW/.test(w.name); })
   .every(function (w) { return /T\d/.test(w.name); }), 'Aluminium nennt den Zustand');

/* ---------- Schraubenanzugsmoment ----------
   Sollwerte aus VDI 2230 Tabelle A1, Spalte Gesamtreibungszahl 0,14. */
near(A.anzugsmoment(4, '8.8'), 3.3, 'M4 in 8.8');
near(A.anzugsmoment(8, '8.8'), 27.3, 'M8 in 8.8');
near(A.anzugsmoment(8, '10.9'), 40.1, 'M8 in 10.9');
near(A.anzugsmoment(10, '8.8'), 54, 'M10 in 8.8');
near(A.anzugsmoment(12, '12.9'), 160, 'M12 in 12.9');
near(A.anzugsmoment(30, '12.9'), 2662, 'M30 in 12.9');
ok(!isFinite(A.anzugsmoment(3, '8.8')), 'M3 steht nicht drin, dafuer fehlt ein belegter Wert');
ok(!isFinite(A.anzugsmoment(9, '8.8')), 'M9 gibt es nicht');
ok(!isFinite(A.anzugsmoment(8, '4.6')), 'unbekannte Festigkeitsklasse');

// Die Klassen stehen zueinander wie in der Norm: 10.9 ist rund das 1,47-fache
near(A.anzugsmoment(8, '10.9') / A.anzugsmoment(8, '8.8'), 1.47, '10.9 zu 8.8', 0.02);
near(A.anzugsmoment(8, '12.9') / A.anzugsmoment(8, '8.8'), 1.72, '12.9 zu 8.8', 0.03);

// Reibungskorrektur: bei 0,14 unveraendert, daneben nahe an den VDI-Spalten
near(A.anzugMitReibung(27.3, 0.14), 27.3, 'bei 0,14 bleibt der Tabellenwert', 1e-9);
near(A.anzugMitReibung(27.3, 0.1), 21.6, 'bei 0,10 nahe an der VDI-Spalte', 0.6);
near(A.anzugMitReibung(27.3, 0.2), 34.3, 'bei 0,20 nahe an der VDI-Spalte', 1.0);
near(A.anzugMitReibung(230, 0.1), 180, 'dasselbe fuer M16', 7);
ok(A.anzugMitReibung(27.3, 0.2) > A.anzugMitReibung(27.3, 0.1), 'mehr Reibung, mehr Moment');
ok(!isFinite(A.anzugMitReibung(27.3, 0.5)), 'unsinnige Reibungszahl wird abgelehnt');
ok(!isFinite(A.anzugMitReibung(27.3, 0.02)), 'zu kleine auch');

// Die Tafel steigt in jeder Spalte und von Klasse zu Klasse
A.ANZUG.forEach(function (e, i) {
  ok(e.k88 < e.k109 && e.k109 < e.k129, 'M' + e.d + ': haertere Klasse, mehr Moment');
  if (i > 0) ok(e.k88 > A.ANZUG[i - 1].k88, 'M' + e.d + ': groesser als die Groesse davor');
});

console.log(fails ? fails + ' Fehler' : 'alle Tests bestanden');
process.exit(fails ? 1 : 0);
