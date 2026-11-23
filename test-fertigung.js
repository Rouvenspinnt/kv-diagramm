// Selbsttest Fertigung und Passungen:  node test-fertigung.js
var F = require('./calc-fertigung.js');
var P = require('./calc-passung.js');
var fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.error('FAIL: ' + msg); } }
function near(a, b, msg, tolRel) {
  var t = (tolRel || 1e-9) * Math.max(1, Math.abs(b));
  ok(isFinite(a) && Math.abs(a - b) <= t, msg + ' (war ' + a + ', erwartet ' + b + ')');
}

/* ---------- Schnittdaten ---------- */
// 120 m/min auf 8 mm: 120000 / (pi*8) = 4774,65
near(F.drehzahl(120, 8), 4774.648293, 'Drehzahl aus vc und d', 1e-6);
near(F.schnittgeschwindigkeit(4774.648293, 8), 120, 'und wieder zurueck', 1e-6);
near(F.drehzahl(30, 10), 954.929659, 'HSS-Bohrer 10 mm bei 30 m/min', 1e-6);
ok(!isFinite(F.drehzahl(120, 0)), 'Durchmesser 0 ergibt keine Drehzahl');
ok(!isFinite(F.drehzahl(-5, 8)), 'negative Schnittgeschwindigkeit ergibt nichts');

near(F.vorschub(1000, 2, 0.05), 100, 'vf aus n, z und fz');
near(F.zahnvorschub(100, 1000, 2), 0.05, 'fz zurueck aus vf');
ok(!isFinite(F.vorschub(1000, 0, 0.05)), 'ohne Zaehne kein Vorschub');

// Bohren 25 mm tief mit 8 mm: Anschnitt 0,3*8 = 2,4 mm
near(F.bohrWeg(25, 8, false), 27.4, 'Sackloch: Weg mit Anschnitt');
near(F.bohrWeg(25, 8, true), 29.4, 'Durchgangsloch: dazu 2 mm Ueberlauf');
near(F.hauptzeit(27.4, 100, 1), 0.274, 'Hauptzeit in Minuten');
near(F.hauptzeit(27.4, 100, 3), 0.822, 'drei Schnitte dauern dreimal so lang');

/* ---------- Gewinde ----------
   Sollwerte aus den ueblichen Kernlochbohrer-Tabellen, von Hand gegengerechnet. */
[[3, 0.5, 2.5], [4, 0.7, 3.3], [5, 0.8, 4.2], [6, 1, 5], [8, 1.25, 6.8],
 [10, 1.5, 8.5], [12, 1.75, 10.2], [14, 2, 12], [16, 2, 14], [20, 2.5, 17.5],
 [24, 3, 21]].forEach(function (z) {
  var g = F.gewinde(z[0]);
  ok(!!g, 'M' + z[0] + ' steht in der Tafel');
  near(g.P, z[1], 'M' + z[0] + ': Steigung');
  near(g.kernloch, z[2], 'M' + z[0] + ': Kernlochbohrer');
  ok(g.regel === true, 'M' + z[0] + ' ohne Angabe ist Regelgewinde');
});

// Kerndurchmesser: d - 1,0825*P
near(F.gewinde(8).d1, 6.647, 'M8: Kerndurchmesser d1', 1e-3);
near(F.gewinde(8).d2, 7.188, 'M8: Flankendurchmesser d2', 1e-3);

// Feingewinde rechnet nach d - P, weil dafuer kein Normbohrer hinterlegt ist
var fein = F.gewinde(10, 1);
near(fein.P, 1, 'M10x1: Steigung uebernommen');
near(fein.kernloch, 9, 'M10x1: Kernloch 9,0');
ok(fein.regel === false, 'M10x1 ist kein Regelgewinde');
ok(F.gewinde(10).fein.indexOf(1) >= 0, 'M10x1 steht als Feingewinde drin');
ok(F.gewinde(7) === null, 'M7 gibt es in der Tafel nicht');

// Rueckwaerts: gemessenes Loch -> Gewinde
ok(F.gewindeZuBohrer(6.8).d === 8, '6,8 mm gehoert zu M8');
ok(F.gewindeZuBohrer(10.2).d === 12, '10,2 mm gehoert zu M12');
ok(F.gewindeZuBohrer(8.6).d === 10, '8,6 mm liegt noch im Fenster von M10');
ok(F.gewindeZuBohrer(9.5) === null, '9,5 mm liegt zwischen M10 und M12, also kein Treffer');

// Jede Zeile vollstaendig
F.GEWINDE.forEach(function (e) {
  ok(e.P > 0 && e.b > 0, 'M' + e.d + ': Steigung und Bohrer gesetzt');
  ok(e.b < e.d, 'M' + e.d + ': Kernloch kleiner als Nennmass');
  ok(!e.dg || (e.dg.length === 3 && e.dg[0] < e.dg[1] && e.dg[1] < e.dg[2]),
     'M' + e.d + ': Durchgangsloecher aufsteigend');
  ok(!e.dg || e.dg[0] > e.d, 'M' + e.d + ': Durchgangsloch groesser als die Schraube');
  e.fein.forEach(function (p, i) {
    ok(p < e.P, 'M' + e.d + ': Feingewinde ' + p + ' ist feiner als die Regelsteigung');
    ok(i === 0 || p < e.fein[i - 1], 'M' + e.d + ': Feingewinde absteigend sortiert');
  });
});

/* ---------- Passungen ----------
   Sollwerte aus dem Tabellenbuch, Nennmass 30 mm (Bereich 18 bis 30). */
near(P.toleranz(30, 7), 21, 'IT7 bei 30 mm');
near(P.toleranz(30, 6), 13, 'IT6 bei 30 mm');
near(P.toleranz(100, 7), 35, 'IT7 bei 100 mm');
ok(P.bereich(3) === 0 && P.bereich(3.5) === 1, 'Bereichsgrenze bei 3 mm');
ok(P.bereich(600) === -1, 'ueber 500 mm kein Bereich');

var H7 = P.abmasse(30, 'H7');
near(H7.unten, 0, 'H7: unten am Nennmass'); near(H7.oben, 21, 'H7: oben +21');
var g6 = P.abmasse(30, 'g6');
near(g6.oben, -7, 'g6: oben -7'); near(g6.unten, -20, 'g6: unten -20');
var h6 = P.abmasse(30, 'h6');
near(h6.oben, 0, 'h6: oben am Nennmass'); near(h6.unten, -13, 'h6: unten -13');
var js6 = P.abmasse(30, 'js6');
near(js6.oben, 6.5, 'js6: symmetrisch +6,5'); near(js6.unten, -6.5, 'js6: symmetrisch -6,5');

// k hat nur in den Graden 4 bis 7 ein Abmass ueber Null
near(P.abmasse(30, 'k6').unten, 2, 'k6: ei = +2');
near(P.abmasse(30, 'k9').unten, 0, 'k9: ei = 0');

var sp = P.passung(30, 'H7', 'g6');
near(sp.hoechstspiel, 41, 'H7/g6 bei 30: groesstes Spiel 41 um');
near(sp.mindestspiel, 7, 'H7/g6 bei 30: kleinstes Spiel 7 um');
ok(sp.art === 'Spielpassung', 'H7/g6 ist eine Spielpassung');
near(sp.passtoleranz, 34, 'Passtoleranz ist die Summe beider IT');

var ue = P.passung(30, 'H7', 'n6');
near(ue.hoechstspiel, 6, 'H7/n6 bei 30: bis 6 um Spiel');
near(ue.mindestspiel, -28, 'H7/n6 bei 30: bis 28 um Uebermass');
ok(ue.art === 'Übergangspassung', 'H7/n6 ist eine Übergangspassung');

var pr = P.passung(100, 'H7', 'p6');
near(pr.hoechstspiel, -2, 'H7/p6 bei 100: kleinstes Uebermass 2 um');
near(pr.mindestspiel, -59, 'H7/p6 bei 100: groesstes Uebermass 59 um');
ok(pr.art === 'Übermaßpassung', 'H7/p6 ist ein Presssitz');

var hh = P.passung(30, 'H7', 'h6');
near(hh.mindestspiel, 0, 'H7/h6: Spiel kann null werden');
near(hh.hoechstspiel, 34, 'H7/h6: hoechstens 34 um');

ok(P.istBekannt('H7') && P.istBekannt('g6') && P.istBekannt('js6'), 'bekannte Bezeichnungen');
ok(!P.istBekannt('r6'), 'r6 ist bewusst nicht drin');
ok(!P.istBekannt('Quatsch'), 'Unsinn wird abgelehnt');
ok(P.passung(600, 'H7', 'g6') === null, 'ueber 500 mm keine Passung');

// Jede Toleranzreihe hat so viele Werte wie es Bereiche gibt
Object.keys(P.IT).forEach(function (g) {
  ok(P.IT[g].length === P.BEREICHE.length, 'IT' + g + ' deckt alle Bereiche ab');
});
Object.keys(P.WELLE_ES).forEach(function (b) {
  ok(P.WELLE_ES[b].length === P.BEREICHE.length, 'Welle ' + b + ' deckt alle Bereiche ab');
});

console.log(fails ? fails + ' Fehler' : 'alle Tests bestanden');
process.exit(fails ? 1 : 0);
