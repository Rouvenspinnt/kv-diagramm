// Selbsttest Mess- und Regeltechnik:  node test-messen.js
var M = require('./calc-messen.js');
var fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.error('FAIL: ' + msg); } }
function near(a, b, msg, tol) {
  var t = tol === undefined ? 1e-9 : tol;
  ok(isFinite(a) && Math.abs(a - b) <= t, msg + ' (war ' + a + ', erwartet ' + b + ')');
}

/* ---------- Normsignal ---------- */
// 4-20 mA auf 0..100 Grad: die Mitte des Signals ist die Mitte des Bereichs
near(M.ausSignal(12, '4-20mA', 0, 100), 50, '12 mA ist die Mitte von 0..100');
near(M.ausSignal(4, '4-20mA', 0, 100), 0, '4 mA ist der Anfang');
near(M.ausSignal(20, '4-20mA', 0, 100), 100, '20 mA ist das Ende');
near(M.zuSignal(25, '4-20mA', 0, 100), 8, '25 Grad sind 8 mA');
// Versetzter Bereich: -50..150 Grad auf 0-10 V
near(M.ausSignal(0, '0-10V', -50, 150), -50, '0 V am unteren Ende');
near(M.ausSignal(2.5, '0-10V', -50, 150), 0, '2,5 V sind null Grad');
near(M.zuSignal(150, '0-10V', -50, 150), 10, '150 Grad sind 10 V');
// Hin und zurueck
near(M.ausSignal(M.zuSignal(42, '1-5V', 0, 200), '1-5V', 0, 200), 42, 'hin und zurueck bei 1-5 V', 1e-9);
ok(M.signal('4-20mA').live === true, '4-20 mA hat ein lebendes Null');
ok(M.signal('0-10V').live === false, '0-10 V nicht');
ok(M.signal('Quatsch') === null, 'unbekanntes Signal wird abgelehnt');

/* ---------- SPS-Rohwert ----------
   Siemens S7: Nennbereich 0..27648, Uebersteuerung bis 32511. */
var r = M.rohwert(4, '4-20mA');
ok(r.roh === 0 && r.lage === 'nenn', '4 mA ist Rohwert 0');
near(M.rohwert(20, '4-20mA').roh, 27648, '20 mA ist Rohwert 27648');
near(M.rohwert(12, '4-20mA').roh, 13824, '12 mA ist die Haelfte');
near(M.rohwert(10, '0-10V').roh, 27648, '10 V ist Rohwert 27648');
// Uebersteuerung: 20 mA + 16 mA * 4863/27648 = 22,814 mA ist der letzte gueltige Wert
ok(M.rohwert(21, '4-20mA').lage === 'ueber', '21 mA ist Uebersteuerung');
ok(M.rohwert(23, '4-20mA').lage === 'overflow', '23 mA ist Ueberlauf');
near(M.rohwert(23, '4-20mA').roh, 32767, 'Ueberlauf meldet 32767');
ok(M.rohwert(3, '4-20mA').lage === 'unter', '3 mA ist Untersteuerung');
ok(M.rohwert(0.5, '4-20mA').lage === 'underflow', '0,5 mA ist Unterlauf, also Drahtbruch');
near(M.rohwert(0.5, '4-20mA').roh, -32768, 'Unterlauf meldet -32768');
// Grenzen stimmen mit der Rechnung ueberein
near(M.grenzen('4-20mA').sUeber, 4 + 16 * 32511 / 27648, 'obere Grenze 4-20 mA', 1e-9);
near(M.grenzen('0-10V').sUeber, 11.759, 'obere Grenze 0-10 V ist 11,759 V', 5e-4);
near(M.grenzen('0-10V').sUnter, -1.759, 'untere Grenze 0-10 V ist -1,759 V', 5e-4);
// Bipolar: nach unten reicht die Untersteuerung ein Digit weiter als nach oben,
// -32512 gehoert noch dazu, erst ab -32513 ist Unterlauf
near(M.rohwert(-10, '-10-10V').roh, -27648, '-10 V ist -27648');
near(M.rohwert(0, '-10-10V').roh, 0, '0 V ist in der Mitte');
near(M.grenzen('-10-10V').sUeber, 10 * 32511 / 27648, 'obere Grenze +-10 V');
near(M.grenzen('-10-10V').sUnter, 10 * -32512 / 27648, 'untere Grenze +-10 V geht ein Digit weiter');
ok(M.rohwert(-11.759, '-10-10V').lage === 'unter', '-11,759 V ist noch Untersteuerung');
ok(M.rohwert(-11.76, '-10-10V').lage === 'underflow', '-11,76 V ist Unterlauf');
ok(M.rohwert(11.76, '-10-10V').lage === 'overflow', '+11,76 V ist Ueberlauf');
// Wo die Tabelle nicht aus der Siemens-Doku stammt, steht ein Hinweis am Signal
ok(!!M.signal('2-10V').hinweis, '2-10 V ist als nicht nachgeschlagen gekennzeichnet');
ok(!!M.signal('0-10V').hinweis, '0-10 V traegt den Vorbehalt zur Untersteuerung');
ok(!M.signal('4-20mA').hinweis, '4-20 mA steht so in der Doku und braucht keinen');
// Rohwert zurueck und auf den Messbereich
near(M.ausRohwert(13824, '4-20mA'), 12, 'Rohwert 13824 ist 12 mA');
near(M.ausRohMesswert(27648, '4-20mA', 0, 250), 250, 'voller Rohwert ist der Endwert');
near(M.ausRohMesswert(13824, '4-20mA', 0, 250), 125, 'halber Rohwert ist die Mitte');

/* ---------- Pt100 / Pt1000 ----------
   Sollwerte aus der Grundwertreihe DIN EN 60751. */
near(M.widerstand(0, 100), 100, 'Pt100 bei 0 Grad', 1e-9);
near(M.widerstand(100, 100), 138.51, 'Pt100 bei 100 Grad', 5e-3);
near(M.widerstand(200, 100), 175.86, 'Pt100 bei 200 Grad', 5e-3);
near(M.widerstand(-100, 100), 60.26, 'Pt100 bei -100 Grad', 5e-3);
near(M.widerstand(-200, 100), 18.52, 'Pt100 bei -200 Grad', 5e-3);
near(M.widerstand(850, 100), 390.48, 'Pt100 am oberen Ende', 5e-3);
near(M.widerstand(100, 1000), 1385.1, 'Pt1000 bei 100 Grad', 5e-2);
ok(!isFinite(M.widerstand(900, 100)), 'ueber 850 Grad rechnet die Kennlinie nicht');
ok(!isFinite(M.widerstand(-250, 100)), 'unter -200 Grad auch nicht');

// Umkehrung trifft wieder dieselbe Temperatur
[-200, -100, -20, 0, 1, 50, 100, 300, 600, 850].forEach(function (t) {
  near(M.temperatur(M.widerstand(t, 100), 100), t, 'Pt100 hin und zurueck bei ' + t, 1e-6);
  near(M.temperatur(M.widerstand(t, 1000), 1000), t, 'Pt1000 hin und zurueck bei ' + t, 1e-6);
});
near(M.temperatur(138.51, 100), 100, '138,51 Ohm sind 100 Grad', 2e-2);
near(M.temperatur(107.79, 100), 20, '107,79 Ohm sind 20 Grad', 2e-2);

/* ---------- Thermoelemente ----------
   Sollwerte aus den NIST-Tafeln, Vergleichsstelle 0 Grad, in mV.
   Die Tafel nennt drei Nachkommastellen; rueckwaerts gerechnet bleiben davon
   rund 0,02 Grad Unschaerfe uebrig, daher die groessere Toleranz dort. */
[['K', 100, 4.096], ['K', 200, 8.138], ['K', 500, 20.644], ['K', 1000, 41.276],
 ['K', -100, -3.554], ['K', -200, -5.891],
 ['J', 100, 5.269], ['J', 200, 10.779], ['J', 500, 27.393], ['J', 760, 42.919],
 ['J', -100, -4.633], ['J', -200, -7.890],
 ['T', 100, 4.279], ['T', 200, 9.288], ['T', 400, 20.872],
 ['T', -100, -3.379], ['T', -200, -5.603]].forEach(function (z) {
  near(M.thermoSpannung(z[0], z[1], 0), z[2], z[0] + ' bei ' + z[1] + ' Grad', 1e-3);
});
near(M.thermoSpannung('K', 0, 0), 0, 'bei gleicher Temperatur keine Spannung', 1e-9);

// Vergleichsstelle: misst das Geraet bei 25 Grad Klemmentemperatur,
// fehlt genau die Spannung, die 25 Grad erzeugen wuerden
near(M.thermoSpannung('K', 100, 25), 4.096 - 1.000, 'Typ K mit Vergleichsstelle 25 Grad', 2e-3);
near(M.thermoTemperatur('K', 4.096, 0), 100, '4,096 mV sind 100 Grad', 5e-2);
near(M.thermoTemperatur('K', 4.096 - 1.000, 25), 100, 'mit Vergleichsstelle wieder 100 Grad', 5e-2);
near(M.thermoTemperatur('J', 27.393, 0), 500, '27,393 mV sind 500 Grad bei Typ J', 5e-2);
near(M.thermoTemperatur('T', -3.379, 0), -100, '-3,379 mV sind -100 Grad bei Typ T', 5e-2);
ok(!isFinite(M.thermoSpannung('T', 500, 0)), 'Typ T endet bei 400 Grad');
ok(!isFinite(M.thermoSpannung('X', 100, 0)), 'unbekannter Typ wird abgelehnt');

// Jeder Typ steigt ueber seinen ganzen Bereich monoton, sonst waere die
// Umkehrung durch Halbieren nicht eindeutig
Object.keys(M.THERMO).forEach(function (typ) {
  var e = M.THERMO[typ], vor = -Infinity, t, mv;
  for (t = e.von; t <= e.bis; t += 1) {
    mv = M.thermoSpannung(typ, t, 0);
    ok(mv > vor, typ + ': Kennlinie steigt bei ' + t + ' Grad');
    vor = mv;
  }
});

/* ---------- Messabweichung ---------- */
var a = M.abweichung(102, 100);
near(a.absolut, 2, 'absolute Abweichung');
near(a.relativ, 0.02, 'relative Abweichung');
near(M.abweichung(98, 100).absolut, -2, 'zu klein gemessen gibt ein Minus');

// 0,5 % vom Messwert plus 0,2 % vom Endwert 250
var t1 = M.toleranz(100, 250, 0.5, 0.2);
near(t1.vonMesswert, 0.5, 'Anteil vom Messwert');
near(t1.vonEndwert, 0.5, 'Anteil vom Endwert');
near(t1.band, 1, 'Toleranzband ist die Summe');
near(t1.min, 99, 'untere Grenze'); near(t1.max, 101, 'obere Grenze');
near(t1.relativ, 0.01, 'bezogen auf den Messwert sind das 1 Prozent');
// Am unteren Ende des Bereichs wiegt der Endwertanteil viel schwerer
near(M.toleranz(10, 250, 0.5, 0.2).relativ, 0.055, 'bei 10 von 250 sind es 5,5 Prozent', 1e-9);

console.log(fails ? fails + ' Fehler' : 'alle Tests bestanden');
process.exit(fails ? 1 : 0);
