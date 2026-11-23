// Selbsttest Pneumatik und Hydraulik:  node test-fluid.js
var F = require('./calc-fluid.js');
var fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.error('FAIL: ' + msg); } }
function near(a, b, msg, tol) {
  var t = tol === undefined ? 1e-9 : tol;
  ok(isFinite(a) && Math.abs(a - b) <= t, msg + ' (war ' + a + ', erwartet ' + b + ')');
}

/* ---------- Flaechen ---------- */
// Zylinder 50/20: Kolben pi*2500/4 = 1963,50 mm2, Ring pi*2100/4 = 1649,34 mm2
near(F.kolbenflaeche(50), 1963.4954085, 'Kolbenflaeche 50 mm', 1e-6);
near(F.ringflaeche(50, 20), 1649.3361431, 'Ringflaeche 50/20', 1e-6);
ok(F.ringflaeche(50, 20) < F.kolbenflaeche(50), 'die Stange nimmt Flaeche weg');
ok(!isFinite(F.ringflaeche(20, 20)), 'Stange so dick wie der Kolben geht nicht');
ok(!isFinite(F.kolbenflaeche(0)), 'ohne Durchmesser keine Flaeche');

/* ---------- Kraft ----------
   6 bar auf 1963,5 mm2: 6 * 0,1 N/mm2 * 1963,5 = 1178,1 N */
near(F.kraft(6, F.kolbenflaeche(50)), 1178.0972451, '6 bar auf Kolben 50', 1e-6);
near(F.kraft(6, F.kolbenflaeche(50), 0.9), 1060.2875206, 'mit 90 Prozent Wirkungsgrad', 1e-6);
near(F.kraft(6, F.kolbenflaeche(50), 90), 1060.2875206, 'Wirkungsgrad in Prozent geht auch', 1e-6);
near(F.kraft(6, F.ringflaeche(50, 20)), 989.6016859, 'zurueck zieht er schwaecher', 1e-6);
near(F.druckAusKraft(1178.0972451, F.kolbenflaeche(50)), 6, 'und der Druck wieder zurueck', 1e-9);
// Welcher Zylinder fuer 2000 N bei 6 bar? A = 2000 / 0,6 = 3333 mm2, also D = 65 mm
near(F.flaecheAusKraft(2000, 6), 3333.3333333, 'Flaeche fuer 2000 N bei 6 bar', 1e-6);
near(2 * Math.sqrt(F.flaecheAusKraft(2000, 6) / Math.PI), 65.1470, 'das waere D = 65 mm', 1e-3);
ok(!isFinite(F.kraft(0, 1000)), 'ohne Druck keine Kraft');

/* ---------- Geschwindigkeit ----------
   10 l/min auf 1963,5 mm2: 10000 cm3/min / 19,635 cm2 = 509 cm/min = 8,49 cm/s */
near(F.geschwindigkeit(10, F.kolbenflaeche(50)), 0.0848826, '10 l/min am Kolben 50', 1e-6);
near(F.volumenstrom(0.0848826, F.kolbenflaeche(50)), 10, 'und der Volumenstrom zurueck', 1e-5);
near(F.hubzeit(500, 0.5), 1, '500 mm bei 0,5 m/s dauern eine Sekunde');
near(F.hubzeit(500, 0.0848826), 5.8905, 'langsamer dauert es laenger', 1e-3);
ok(!isFinite(F.geschwindigkeit(10, 0)), 'ohne Flaeche keine Geschwindigkeit');

/* ---------- Luftverbrauch ----------
   Bei 6 bar passt rund das Siebenfache der Luft in denselben Raum. */
near(F.verdichtung(6), 6.9230009, 'Verdichtungsverhaeltnis bei 6 bar', 1e-6);
near(F.verdichtung(0), 1, 'ohne Druck keine Verdichtung', 1e-9);
// Hub 500 mm am Kolben 50: 0,982 l Bauraum, verdichtet 6,80 Normliter
near(F.luftJeHub(F.kolbenflaeche(50), 500, 6), 6.7966403, 'Normliter fuer einen Hub', 1e-6);
near(F.luftJeDoppelhub(50, 20, 500, 6), 12.5058182, 'hin und zurueck', 1e-6);
ok(F.luftJeDoppelhub(50, 20, 500, 6) < 2 * F.luftJeHub(F.kolbenflaeche(50), 500, 6),
   'der Rueckhub braucht weniger, weil die Stange Platz wegnimmt');
near(F.luftJeMinute(12.5058182, 20), 250.116364, '20 Takte je Minute', 1e-5);

/* ---------- Druckuebersetzer ----------
   Grosse Flaeche treibt kleine: 50 auf 20 mm sind 6,25-fach. */
near(F.uebersetzer(6, F.kolbenflaeche(50), F.kolbenflaeche(20)), 37.5, 'aus 6 bar werden 37,5', 1e-9);
near(F.uebersetzer(6, F.kolbenflaeche(20), F.kolbenflaeche(50)), 0.96, 'andersherum wird es weniger', 1e-9);

/* ---------- Kv-Wert ---------- */
// Wasser, 10 m3/h bei 1 bar Druckabfall: Kv = 10
near(F.kvFluessig(10, 1), 10, 'Kv fuer 10 m3/h bei 1 bar');
near(F.kvFluessig(10, 4), 5, 'vierfacher Druckabfall, halber Kv');
near(F.kvFluessig(10, 1, 0.87), 9.3273791, 'Hydraulikoel ist leichter als Wasser', 1e-6);
near(F.durchflussFluessig(10, 4), 20, 'und der Durchfluss zurueck');
near(F.durchflussFluessig(F.kvFluessig(17, 2.5), 2.5), 17, 'hin und zurueck', 1e-9);
ok(!isFinite(F.kvFluessig(10, 0)), 'ohne Druckabfall kein Kv');

// Luft, Kv 1 von 6 auf 5 bar: unterkritisch
var l1 = F.luftdurchsatz(1, 6, 5);
near(l1.qn, 64.7557, 'Kv 1, 6 auf 5 bar', 1e-3);
ok(l1.kritisch === false, '1 bar Abfall ist unterkritisch');
// Ins Freie: unter dem halben Eingangsdruck stroemt sie mit Schallgeschwindigkeit
var l2 = F.luftdurchsatz(1, 6, 0);
ok(l2.kritisch === true, 'gegen Umgebungsdruck ist es kritisch');
near(l2.qn, 92.5985, 'dann gilt der Wert an der Sperrgrenze', 1e-3);
// Mehr Druckabfall bringt ab der Sperrgrenze nichts mehr
near(F.luftdurchsatz(1, 6, 0).qn, F.luftdurchsatz(1, 6, 1).qn, 'unter der Sperrgrenze aendert sich nichts', 1e-9);
ok(F.luftdurchsatz(2, 6, 5).qn > l1.qn, 'doppelter Kv, mehr Durchfluss');
ok(F.luftdurchsatz(1, 5, 6) === null || !isFinite(F.luftdurchsatz(1, 5, 6)),
   'rueckwaerts stroemt nichts');
// Die Temperatur steht in Kelvin. 20 statt 293 wuerde den Durchsatz vervierfachen,
// darum wird ein offensichtlicher Grad-Wert abgelehnt statt still falsch gerechnet.
near(F.luftdurchsatz(1, 6, 5, 293).qn, l1.qn, 'Kelvin ausdruecklich angegeben', 1e-9);
ok(!isFinite(F.luftdurchsatz(1, 6, 5, 20)), 'Grad Celsius wird abgelehnt');
ok(!isFinite(F.luftdurchsatz(1, 6, 5, 0)), 'null Kelvin auch');

/* ---------- Rohr ----------
   60 l/min bei 5 m/s brauchen 200 mm2, also knapp 16 mm innen. */
near(F.rohrDurchmesser(60, 5), 15.9577, '60 l/min bei 5 m/s', 1e-3);
near(F.rohrGeschwindigkeit(60, 15.9577), 5, 'und die Geschwindigkeit zurueck', 1e-4);
// Halber Durchmesser heisst vierfache Geschwindigkeit
near(F.rohrGeschwindigkeit(60, 8), F.rohrGeschwindigkeit(60, 16) * 4, 'halbes Rohr, vierfaches Tempo', 1e-6);
ok(!isFinite(F.rohrDurchmesser(60, 0)), 'ohne Zielgeschwindigkeit kein Durchmesser');

/* ---------- Tabellen ---------- */
F.RICHTWERTE.forEach(function (r) {
  ok(r.von > 0 && r.bis > r.von, r.was + ': Spanne aufsteigend');
});
// Die Hauptleitung bleibt langsam, sonst kostet der Druckverlust mehr als das dickere Rohr.
ok(F.RICHTWERTE.some(function (r) { return /Hauptleitung/.test(r.was) && r.bis <= 8; }),
   'Druckluft-Hauptleitung hoechstens 8 m/s');
ok(F.RICHTWERTE.some(function (r) { return /Verteilleitung/.test(r.was); }),
   'die Verteilleitung steht als eigene Zeile drin');
F.ZYLINDER.forEach(function (z) {
  ok(z.d < z.D, 'Zylinder ' + z.D + ': Stange duenner als der Kolben');
  ok(isFinite(F.ringflaeche(z.D, z.d)), 'Zylinder ' + z.D + ': Ringflaeche rechenbar');
});

console.log(fails ? fails + ' Fehler' : 'alle Tests bestanden');
process.exit(fails ? 1 : 0);
