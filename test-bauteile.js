// Selbsttest Kondensator, Spule, Trafo und Netzteil:  node test-bauteile.js
var B = require('./calc-bauteile.js');
var fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.error('FAIL: ' + msg); } }
function near(a, b, msg, tol) {
  var t = tol === undefined ? 1e-9 : tol;
  ok(isFinite(a) && Math.abs(a - b) <= t, msg + ' (war ' + a + ', erwartet ' + b + ')');
}

/* ---------- RC-Glied ----------
   10 kOhm und 100 µF ergeben genau eine Sekunde. */
near(B.tauRC(10000, 100e-6), 1, 'tau aus 10 k und 100 µF');
near(B.tauRC(1000, 1e-6), 1e-3, '1 k und 1 µF sind eine Millisekunde', 1e-15);
ok(!isFinite(B.tauRC(0, 100e-6)), 'ohne Widerstand keine Zeitkonstante');

// Die Faustwerte, die jeder kennt
near(B.anteilNachTau(1, true), 0.6321206, 'nach einer Zeitkonstante 63 Prozent', 1e-7);
near(B.anteilNachTau(3, true), 0.9502129, 'nach drei 95 Prozent', 1e-7);
near(B.anteilNachTau(5, true), 0.9932621, 'nach fünf 99,3 Prozent', 1e-7);
near(B.anteilNachTau(1, false), 0.3678794, 'beim Entladen bleiben 37 Prozent', 1e-7);
near(B.anteilNachTau(1, true) + B.anteilNachTau(1, false), 1,
     'Laden und Entladen ergaenzen sich zu eins', 1e-12);
near(B.anteilNachTau(0, true), 0, 'am Anfang ist nichts geladen');

// 10 V ueber tau = 1 s: nach 2,3 s sind 90 Prozent erreicht
near(B.spannungNachZeit(10, 1, 2.3, true), 8.9974116, 'nach 2,3 tau auf 9 V', 1e-6);
near(B.spannungNachZeit(10, 1, 2.3, false), 1.0025884, 'beim Entladen der Rest', 1e-6);
near(B.spannungNachZeit(10, 1, 2.3, true) + B.spannungNachZeit(10, 1, 2.3, false), 10,
     'zusammen wieder die volle Spannung', 1e-9);
near(B.spannungNachZeit(10, 1, 0, true), 0, 'bei t = 0 noch nichts');
near(B.spannungNachZeit(10, 1, 0, false), 10, 'beim Entladen bei t = 0 noch alles');

// und wieder zurueck
near(B.zeitBisSpannung(10, 1, 9, true), 2.3025851, 'Zeit bis 9 von 10 V', 1e-7);
near(B.zeitBisSpannung(10, 1, B.spannungNachZeit(10, 1, 1.7, true), true), 1.7,
     'hin und zurueck', 1e-9);
near(B.zeitBisSpannung(10, 1, 1, false), 2.3025851, 'Entladung von 10 auf 1 V', 1e-7);
ok(!isFinite(B.zeitBisSpannung(10, 1, 10, true)), 'die volle Spannung wird nie erreicht');
ok(!isFinite(B.zeitBisSpannung(10, 1, 12, true)), 'ueber die Quellenspannung erst recht nicht');

near(B.energieKondensator(100e-6, 10), 5e-3, '100 µF auf 10 V halten 5 mJ', 1e-15);
near(B.energieKondensator(100e-6, 20), 4 * B.energieKondensator(100e-6, 10),
     'doppelte Spannung, vierfache Energie', 1e-15);
near(B.ladung(100e-6, 10), 1e-3, 'und 1 mC Ladung', 1e-15);

/* Pufferzeit: 10000 µF, die von 24 auf 20 V absacken duerfen, halten
   eine Last von 0,5 A genau 80 ms. */
near(B.pufferzeit(10000e-6, 4, 0.5), 0.08, '10 mF puffern 0,5 A fuer 80 ms', 1e-12);
near(B.pufferzeit(10000e-6, 4, 1), 0.04, 'doppelte Last, halbe Zeit', 1e-12);
near(B.pufferzeit(20000e-6, 4, 0.5), 0.16, 'doppelter Kondensator, doppelte Zeit', 1e-12);
ok(!isFinite(B.pufferzeit(10000e-6, 0, 0.5)), 'ohne zugelassenen Einbruch keine Pufferzeit');

/* ---------- RL-Glied ---------- */
near(B.tauRL(0.1, 10), 0.01, '100 mH an 10 Ohm sind 10 ms', 1e-12);
ok(B.tauRL(0.1, 5) > B.tauRL(0.1, 10), 'kleinerer Widerstand, laengere Zeit');
near(B.energieSpule(0.1, 2), 0.2, '100 mH bei 2 A halten 0,2 J', 1e-12);
near(B.energieSpule(0.1, 4), 4 * B.energieSpule(0.1, 2), 'doppelter Strom, vierfache Energie', 1e-12);
ok(!isFinite(B.energieSpule(0, 2)), 'ohne Induktivitaet keine Energie');

/* ---------- Transformator ----------
   230 V auf 24 V mit 600 Windungen primaer. */
var t1 = B.trafo({ N1: 600, U1: 230, U2: 24, I2: 2 });
near(t1.ue, 9.5833333, 'Uebersetzungsverhaeltnis 230 zu 24', 1e-6);
near(t1.N2, 62.6086957, 'also rund 63 Windungen sekundaer', 1e-6);
near(t1.P2, 48, '24 V bei 2 A sind 48 W');
near(t1.P1, 48, 'ohne Verluste primaer dasselbe');
near(t1.I1, 0.2086957, 'primaer fliesst entsprechend weniger Strom', 1e-7);
near(t1.I1 * t1.U1, t1.I2 * t1.U2, 'die Leistung bleibt gleich', 1e-9);
// Mit Wirkungsgrad muss primaer mehr hinein
var t2 = B.trafo({ N1: 600, U1: 230, U2: 24, I2: 2, eta: 0.9 });
near(t2.P1, 53.3333333, 'bei 90 Prozent mehr Aufnahme', 1e-6);
near(t2.verlust, 5.3333333, 'der Rest wird warm', 1e-6);
ok(t2.I1 > t1.I1, 'und es fliesst mehr Primaerstrom');
near(B.trafo({ N1: 600, U1: 230, U2: 24, I2: 2, eta: 90 }).P1, 53.3333333,
     'Wirkungsgrad in Prozent geht auch', 1e-6);
// Ueber die Windungszahlen statt ueber die Spannungen
var t3 = B.trafo({ N1: 600, N2: 60, U1: 230 });
near(t3.ue, 10, 'Uebersetzung aus den Windungszahlen');
near(t3.U2, 23, 'daraus die Sekundaerspannung');
ok(B.trafo({ U1: 230 }) === null, 'mit einer Angabe allein geht es nicht');
ok(B.trafo({ N1: 600, N2: 60, U1: 230, eta: 150 }) === null, 'ueber 100 Prozent Wirkungsgrad gibt es nicht');
// 1,5 ist dagegen kein Fehler, sondern ein sehr schlechter Trafo mit 1,5 Prozent
near(B.trafo({ N1: 600, N2: 60, U1: 230, eta: 1.5 }).eta, 0.015, 'einstellige Werte sind Prozent', 1e-12);
near(B.uebersetzung(600, 60), 10, 'Uebersetzung einzeln gerechnet');

/* ---------- Gleichrichter und Glaettung ----------
   24 V Wechselspannung ergeben 33,9 V Scheitelwert, davon gehen die Dioden ab. */
near(B.gleichrichter(24, 'bruecke'), 32.5411255, 'Brueckengleichrichter, zwei Dioden', 1e-6);
near(B.gleichrichter(24, 'einweg'), 33.2411255, 'Einweg, nur eine Diode', 1e-6);
ok(B.gleichrichter(24, 'einweg') > B.gleichrichter(24, 'bruecke'),
   'die Bruecke kostet eine Diode mehr');
near(B.gleichrichter(24, 'bruecke', 0), 33.9411255, 'ideale Dioden ohne Abfall', 1e-6);
near(B.gleichrichter(24, 'bruecke', 1.1), 24 * Math.SQRT2 - 2.2, 'Schottky oder Si frei waehlbar', 1e-9);
ok(!isFinite(B.gleichrichter(0.5, 'bruecke')), 'unter der Diodenschwelle kommt nichts an');

near(B.brummfrequenz(50, 'bruecke'), 100, 'die Bruecke laedt zweimal je Periode nach');
near(B.brummfrequenz(50, 'einweg'), 50, 'der Einweg nur einmal');

// 1 A Last an 4700 µF bei 100 Hz Brummfrequenz
near(B.brummspannung(1, 4700e-6, 100), 2.1276596, 'Brummspannung an 4700 µF', 1e-7);
ok(B.brummspannung(1, 4700e-6, 50) > B.brummspannung(1, 4700e-6, 100),
   'beim Einweg brummt es doppelt so stark');
ok(B.brummspannung(2, 4700e-6, 100) > B.brummspannung(1, 4700e-6, 100),
   'mehr Strom, mehr Brummen');
near(B.ladekondensator(1, 2, 100), 5e-3, 'fuer 2 V Brummen braucht es 5000 µF', 1e-12);
// hin und zurueck
near(B.brummspannung(1.5, B.ladekondensator(1.5, 0.8, 100), 100), 0.8,
     'Kondensator und Brummspannung passen zusammen', 1e-9);
ok(!isFinite(B.brummspannung(1, 4700e-6, 0)), 'ohne Frequenz kein Brummen');

console.log(fails ? fails + ' Fehler' : 'alle Tests bestanden');
process.exit(fails ? 1 : 0);
