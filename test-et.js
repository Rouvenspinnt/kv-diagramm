// Selbsttest des Rechenkerns:  node test-et.js
var et = require('./et.js');
var fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.error('FAIL: ' + msg); } }
function near(a, b, msg, tolRel) {
  var t = (tolRel || 1e-9) * Math.max(1, Math.abs(b));
  ok(isFinite(a) && Math.abs(a - b) <= t, msg + ' (war ' + a + ', erwartet ' + b + ')');
}

// Eingaben mit Vorsatz und Einheit
near(et.parseVal('4k7'), 4700, '4k7');
near(et.parseVal('2M2'), 2.2e6, '2M2');
near(et.parseVal('1R5'), 1.5, '1R5');
near(et.parseVal('2.2k'), 2200, '2.2k');
near(et.parseVal('0,1µF'), 1e-7, '0,1µF');
near(et.parseVal('10 mA'), 0.01, '10 mA');
near(et.parseVal('470'), 470, 'blanke Zahl');
near(et.parseVal('1.5e3'), 1500, 'Exponentialschreibweise');
near(et.parseVal('100nF'), 1e-7, '100nF');
near(et.parseVal('12V'), 12, '12V');
near(et.parseVal('50Hz'), 50, '50Hz');
near(et.parseVal('2.2kΩ'), 2200, '2.2kΩ');
ok(isNaN(et.parseVal('abc')), 'Text ist kein Wert');
ok(isNaN(et.parseVal('')), 'leer ist kein Wert');
ok(isNaN(et.parseVal('5x')), 'unbekannter Vorsatz');

// Ausgabe
ok(et.fmt(4700, 'Ω') === '4,7 kΩ', 'fmt 4700 Ω, war ' + et.fmt(4700, 'Ω'));
// Rechenungenauigkeit darf die Stufe nicht kippen: 10k * 100µ ist eine Sekunde
ok(et.fmt(10000 * 0.0001, 's') === '1 s', 'fmt knapp unter 1 s, war ' + et.fmt(10000 * 0.0001, 's'));
ok(et.fmt(0.0047, 'F') === '4,7 mF', 'fmt mit Komma, war ' + et.fmt(0.0047, 'F'));
ok(et.fmt(0.000047, 'F') === '47 µF', 'fmt 47µF, war ' + et.fmt(0.000047, 'F'));
ok(et.fmt(0, 'V') === '0 V', 'fmt 0');
ok(et.fmt(NaN) === '–', 'fmt NaN');

// Normreihen
ok(et.nearestE(3333, 'E12') === 3300, 'E12 von 3333');
ok(et.nearestE(3333, 'E24') === 3300, 'E24 von 3333');
ok(et.nearestE(1, 'E6') === 1, 'E6 von 1');
ok(et.nearestE(9.9, 'E12') === 10, 'E12 von 9.9 rundet in die naechste Dekade');
ok(et.nearestE(0.047, 'E6') === 0.047, 'E6 von 0.047');
et.SERIES.E24.forEach(function (v) {
  ok(et.nearestE(v * 1000, 'E24') === v * 1000, 'E24-Wert ' + v + ' bleibt sich selbst');
});

// Ohmsches Gesetz: alle sechs Paare muessen dasselbe Ergebnis liefern
var ref = { U: 12, I: 0.5, R: 24, P: 6 };
[['U', 'I'], ['U', 'R'], ['U', 'P'], ['I', 'R'], ['I', 'P'], ['R', 'P']].forEach(function (pair) {
  var inp = { U: NaN, I: NaN, R: NaN, P: NaN };
  pair.forEach(function (k) { inp[k] = ref[k]; });
  var r = et.solveOhm(inp);
  ok(!r.error, 'solveOhm ' + pair.join('+') + ' ohne Fehler');
  ['U', 'I', 'R', 'P'].forEach(function (k) { near(r[k], ref[k], 'solveOhm ' + pair.join('+') + ' -> ' + k, 1e-9); });
});
ok(et.solveOhm({ U: 12, I: NaN, R: NaN, P: NaN }).error, 'ein Wert ist zu wenig');
ok(et.solveOhm({ U: 12, I: 1, R: 12, P: NaN }).error, 'drei Werte sind zu viel');

// Farbcode hin und zurueck
var gelb = 4, violett = 7, rot = 2, gold = 10, braun = 1, schwarz = 0;
var v4 = et.bandsToValue([gelb, violett, rot, gold]);
ok(v4.value === 4700 && v4.tol === 5, '4 Ringe gelb-violett-rot-gold = 4,7k ±5%');
var v5 = et.bandsToValue([braun, schwarz, schwarz, rot, braun]);
ok(v5.value === 10000 && v5.tol === 1, '5 Ringe braun-schwarz-schwarz-rot-braun = 10k ±1%');
ok(et.bandsToValue([gold, violett, rot, gold]).error, 'Gold kann keine Ziffer sein');
var b = et.valueToBands(4700, 4, 5);
ok(JSON.stringify(b.bands) === JSON.stringify([gelb, violett, rot, gold]), '4700 -> gelb-violett-rot-gold');
var b5 = et.valueToBands(10000, 5, 1);
ok(JSON.stringify(b5.bands) === JSON.stringify([braun, schwarz, schwarz, rot, braun]), '10k mit 5 Ringen');
ok(et.valueToBands(1234, 4).error, '1234 passt nicht in 2 Ziffern');
ok(!et.valueToBands(1200, 4).error, '1200 passt in 2 Ziffern');
ok(!et.valueToBands(1230, 5).error, '1230 passt in 3 Ziffern');
// jeder E24-Wert muss sich als Ringe darstellen und zurueckrechnen lassen
et.SERIES.E24.forEach(function (m) {
  [1, 10, 100, 1000, 100000].forEach(function (dec) {
    var val = Number((m * dec).toPrecision(12));
    var res = et.valueToBands(val, 4, 5);
    ok(!res.error, 'Ringe fuer ' + val + ': ' + res.error);
    if (!res.error) near(et.bandsToValue(res.bands).value, val, 'Ringe von ' + val + ' zurueckgerechnet');
  });
});

// Wechselstrom
near(et.xl(50, 0.1), 31.4159265, 'XL bei 50 Hz und 100 mH', 1e-6);
near(et.xc(50, 1e-6), 3183.0988, 'XC bei 50 Hz und 1 µF', 1e-6);
var z = et.impedance(300, 400);
near(z.Z, 500, 'Z aus 300 und 400'); near(z.phi, 53.13010235, 'Phasenwinkel', 1e-6);
near(et.impedance(100, 0).phi, 0, 'rein ohmsch: 0 Grad');
near(et.resonance(0.1, 1e-6), 503.2921, 'Resonanz 100 mH / 1 µF', 1e-5);
// bei Resonanz heben sich XL und XC auf
var f0 = et.resonance(0.01, 1e-7);
near(et.xl(f0, 0.01) - et.xc(f0, 1e-7), 0, 'bei f0 ist XL = XC', 1e-6);

// Verzeichnis und Suche
var T = require('./tools.js');
function erster(frage) { var r = T.suche(frage); return r.length ? r[0].id : null; }
ok(erster('resonanz') === 'wechselstrom', 'Suche: Resonanz -> Wechselstrom');
ok(erster('vorwiderstand') === 'led', 'Suche: Vorwiderstand -> LED');
ok(erster('farbringe') === 'farbcode', 'Suche: Farbringe -> Farbcode');
ok(erster('dnf') === 'kv', 'Suche: DNF -> KV-Diagramm');
ok(erster('ohm') === 'ohm', 'Suche: Titeltreffer schlaegt Stichworttreffer');
ok(T.suche('blumentopf').length === 0, 'Suche: nichts Passendes ergibt nichts');
ok(T.suche('cos phi').length > 0, 'Suche: zwei Woerter finden den Eintrag');
ok(T.suche('resonanz blumentopf').length === 0, 'Suche: jedes Wort muss vorkommen');
ok(T.ausDatei('ohm.html').id === 'ohm', 'Datei -> Werkzeug');
ok(T.ausDatei('gibtesnicht.html') === null, 'unbekannte Datei ergibt nichts');
// Keine feste Zahl pruefen: die waechst mit jedem neuen Werkzeug mit.
ok(T.imGebiet('elektro').length ===
   T.TOOLS.filter(function (t) { return t.gebiet === 'elektro'; }).length,
   'imGebiet liefert genau die Werkzeuge des Gebiets');
ok(T.imGebiet('elektro').every(function (t) { return t.gebiet === 'elektro'; }),
   'und keine fremden');
ok(T.imGebiet('gibtesnicht').length === 0, 'unbekanntes Gebiet ist leer');
T.TOOLS.forEach(function (t) {
  ok(/^[a-z0-9-]+\.html(#[a-z0-9-]+)?$/.test(t.datei), 'Dateiname sauber: ' + t.id);
  ok(T.GEBIETE.some(function (g) { return g[0] === t.gebiet; }), 'Gebiet bekannt: ' + t.id);
  ok(t.w.length > 0 && t.kurz.length > 0, 'Stichworte und Kurztext da: ' + t.id);
});

console.log(fails ? fails + ' Fehler' : 'alle Tests bestanden');
process.exit(fails ? 1 : 0);
