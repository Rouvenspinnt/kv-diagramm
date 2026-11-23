// Selbsttest Leitung, Absicherung und Drehstrom:  node test-elektro.js
var E = require('./calc-elektro.js');
var fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.error('FAIL: ' + msg); } }
function near(a, b, msg, tol) {
  var t = tol === undefined ? 1e-9 : tol;
  ok(isFinite(a) && Math.abs(a - b) <= t, msg + ' (war ' + a + ', erwartet ' + b + ')');
}

/* ---------- Spannungsfall ----------
   Drehstrom, 16 A ueber 25 m auf 2,5 mm2 Kupfer:
   dU = 1,732 * 25 * 16 / (56 * 2,5) = 4,949 V */
near(E.spannungsfall(16, 25, 2.5, 3), 4.9487166, 'Drehstrom 16 A, 25 m, 2,5 mm2', 1e-6);
near(E.spannungsfallProzent(16, 25, 2.5, 400, 3), 1.2371791, 'dasselbe in Prozent von 400 V', 1e-6);
// Wechselstrom rechnet mit Hin- und Rueckleiter, darum Faktor 2 statt Wurzel 3
near(E.spannungsfall(16, 25, 2.5, 1), 5.7142857, 'Wechselstrom ueber dieselbe Strecke', 1e-6);
ok(E.spannungsfall(16, 25, 2.5, 1) > E.spannungsfall(16, 25, 2.5, 3),
   'Wechselstrom faellt staerker ab als Drehstrom');
// Gleichstrom: der Leistungsfaktor spielt keine Rolle
near(E.spannungsfall(16, 25, 2.5, 0, 0.8), E.spannungsfall(16, 25, 2.5, 0),
     'bei Gleichstrom wird cos phi nicht gerechnet');
// Doppelter Querschnitt, halber Fall
near(E.spannungsfall(16, 25, 5, 3), E.spannungsfall(16, 25, 2.5, 3) / 2, 'doppelt so dick, halber Fall', 1e-9);
// Aluminium leitet schlechter
ok(E.spannungsfall(16, 25, 2.5, 3, 1, 'al') > E.spannungsfall(16, 25, 2.5, 3, 1, 'cu'),
   'Aluminium faellt staerker ab');
near(E.spannungsfall(16, 25, 2.5, 3, 1, 'al') / E.spannungsfall(16, 25, 2.5, 3, 1, 'cu'),
     56 / 35, 'genau im Verhaeltnis der Leitfaehigkeiten', 1e-9);
ok(!isFinite(E.spannungsfall(16, 25, 2.5, 2)), 'zwei Phasen gibt es nicht');
ok(!isFinite(E.spannungsfall(16, 25, 0, 3)), 'ohne Querschnitt kein Ergebnis');
ok(!isFinite(E.spannungsfall(16, 25, 2.5, 3, 1.4)), 'cos phi ueber 1 gibt es nicht');

/* ---------- Querschnitt aus dem Spannungsfall ---------- */
// 16 A, 25 m, 400 V, 3 Prozent, cos phi 1: A = 1,031 mm2
near(E.querschnittFuerFall(16, 25, 400, 3, 3), 1.0309826, 'noetiger Querschnitt', 1e-6);
near(E.naechsterNormquerschnitt(1.0309826), 1.5, 'aufgerundet auf die Normreihe');
near(E.naechsterNormquerschnitt(2.5), 2.5, 'ein Normwert bleibt stehen');
ok(!isFinite(E.naechsterNormquerschnitt(200)), 'ueber 120 mm2 hoert die Tafel auf');
// Was herauskommt, haelt den Fall auch wirklich ein
var Amin = E.naechsterNormquerschnitt(E.querschnittFuerFall(63, 80, 400, 3, 3, 0.9));
ok(E.spannungsfallProzent(63, 80, Amin, 400, 3, 0.9) <= 3, 'der gewaehlte Querschnitt haelt die 3 Prozent');

/* ---------- Strombelastbarkeit ---------- */
// B2, drei belastete Adern, 2,5 mm2: 20 A bei 30 Grad
near(E.belastbarkeit(2.5, 'B2', 3, 30, 1), 20, '2,5 mm2 in B2 traegt 20 A');
near(E.belastbarkeit(1.5, 'B2', 3, 30, 1), 15, '1,5 mm2 in B2 traegt 15 A');
near(E.belastbarkeit(2.5, 'C', 3, 30, 1), 24, 'direkt auf der Wand mehr');
near(E.belastbarkeit(2.5, 'B2', 2, 30, 1), 23, 'zwei belastete Adern tragen mehr als drei');
// 40 Grad Umgebung kostet 13 Prozent
near(E.belastbarkeit(2.5, 'B2', 3, 40, 1), 20 * 0.87, 'bei 40 Grad weniger', 1e-9);
// Drei Stromkreise gebuendelt kosten 30 Prozent
near(E.belastbarkeit(2.5, 'B2', 3, 30, 3), 20 * 0.7, 'gebuendelt weniger', 1e-9);
near(E.belastbarkeit(2.5, 'B2', 3, 40, 3), 20 * 0.87 * 0.7, 'beides zusammen', 1e-9);
ok(!isFinite(E.belastbarkeit(2.5, 'X9', 3, 30, 1)), 'unbekannte Verlegeart');
ok(!isFinite(E.belastbarkeit(3, 'B2', 3, 30, 1)), '3 mm2 steht nicht in der Normreihe');
ok(!isFinite(E.belastbarkeit(2.5, 'B2', 3, 70, 1)), 'ueber 60 Grad ist PVC nicht mehr zulaessig');

near(E.tempfaktor(30), 1, '30 Grad ist der Bezugswert');
near(E.tempfaktor(40), 0.87, '40 Grad');
/* Die Norm gibt Baender an: 38 Grad gehoeren in das Band "ueber 35 bis 40",
   es gilt also 0,87 und nicht die guenstigeren 0,94 von der 35er-Stufe. */
near(E.tempfaktor(38), 0.87, '38 Grad fallen in das 40-Grad-Band');
near(E.tempfaktor(36), 0.87, 'auch knapp ueber 35');
near(E.tempfaktor(35), 0.94, '35 selbst ist noch die eigene Stufe');
near(E.tempfaktor(22), 1.06, 'nach oben gilt dasselbe');
near(E.tempfaktor(5), 1.22, 'unter 10 Grad bleibt es bei 1,22');
near(E.tempfaktor(65), 0.35, '65 Grad ist der letzte Eintrag');
ok(isNaN(E.tempfaktor(70)), 'darueber hoert die Tafel auf');
// Der Faktor darf mit steigender Temperatur nie steigen
for (var tg = 10; tg <= 65; tg++) {
  ok(E.tempfaktor(tg) <= E.tempfaktor(tg - 1) + 1e-12, 'Temperaturfaktor fallend bei ' + tg);
}
near(E.haeufungsfaktor(1), 1, 'ein Kreis allein');
near(E.haeufungsfaktor(3), 0.7, 'drei Kreise');
near(E.haeufungsfaktor(10), 0.48, 'zehn Kreise haben ihre eigene Stufe');
// Auch hier gilt der naechsthoehere Eintrag, nicht der naechstniedrigere
near(E.haeufungsfaktor(11), 0.45, 'elf Kreise werden wie zwoelf gerechnet');
near(E.haeufungsfaktor(13), 0.43, 'dreizehn wie vierzehn');
near(E.haeufungsfaktor(17), 0.39, 'siebzehn wie achtzehn');
near(E.haeufungsfaktor(25), 0.38, 'mehr als zwanzig bleibt bei 0,38');
for (var ng = 2; ng <= 20; ng++) {
  ok(E.haeufungsfaktor(ng) <= E.haeufungsfaktor(ng - 1) + 1e-12,
     'Haeufungsfaktor fallend bei ' + ng);
}

/* ---------- Absicherung ---------- */
near(E.sicherungFuer(16, 20), 20, 'B20 passt zwischen 16 A und 20 A');
near(E.sicherungFuer(16, 18.5), 16, 'bei 18,5 A Belastbarkeit nur B16');
ok(E.sicherungFuer(25, 20) === null, 'zu duenne Leitung laesst sich nicht absichern');
ok(E.sicherungFuer(16, 20) <= 20, 'die Sicherung bleibt unter der Belastbarkeit');
ok(E.sicherungFuer(16, 20) >= 16, 'und ueber dem Betriebsstrom');
/* Die gG-Schmelzsicherung loest erst bei 1,6 * In aus. Aus I2 <= 1,45 * Iz
   folgt In <= Iz / 1,1, hier also 18,2 A — 20 A waeren zu viel. */
near(E.sicherungFuer(16, 20, 'schmelz'), 16, 'gG muss unter Iz/1,1 bleiben');
near(E.sicherungFuer(20, 25, 'schmelz'), 20, 'und bei Iz = 25 bleiben es 20 A');
near(E.sicherungFuer(20, 25), 25, 'der LS-Schalter darf dort bis 25 A');
ok(E.sicherungFuer(20, 21, 'schmelz') === null, 'knapp reicht bei gG nicht');
// Verlegeart E, drei belastete Adern: die unteren vier Werte stehen oft falsch
near(E.BELASTBARKEIT.E.drei[0], 18.5, 'E, 3 Adern, 1,5 mm2');
near(E.BELASTBARKEIT.E.drei[1], 25, 'E, 3 Adern, 2,5 mm2');
near(E.BELASTBARKEIT.E.drei[3], 43, 'E, 3 Adern, 6 mm2');

var b16 = E.ausloesebereich(16, 'B');
near(b16.von, 48, 'B16 loest magnetisch ab 48 A aus');
near(b16.bis, 80, 'und spaetestens bei 80 A');
near(E.ausloesebereich(16, 'C').von, 80, 'C16 erst ab 80 A');
near(E.ausloesebereich(16, 'D').bis, 320, 'D16 bis 320 A');
ok(E.ausloesebereich(16, 'Z') === null, 'unbekannte Kennlinie');

/* ---------- Leitung auslegen ----------
   16 A Drehstrom, 25 m, 400 V, 3 Prozent, cos phi 0,8, Verlegeart B2.
   Der Spannungsfall verlangt 1,5 mm2, die Belastbarkeit 2,5 — es gilt der dickere. */
var l = E.leitungAuslegen(16, 25, 400, 3, 3, 0.8, 'B2', 30, 1);
near(l.A, 2.5, 'gewaehlt wird 2,5 mm2');
near(l.ausFall, 1.5, 'der Spannungsfall allein kaeme mit 1,5 aus');
near(l.ausStrom, 2.5, 'die Belastbarkeit verlangt 2,5');
ok(l.massgebend === 'Strombelastbarkeit', 'massgebend ist hier die Belastbarkeit');
near(l.Iz, 20, 'Belastbarkeit 20 A');
near(l.sicherung, 20, 'abgesichert mit 20 A');
near(l.fallProzent, 0.9897433, 'der Fall bleibt unter 1 Prozent', 1e-6);
ok(l.fallProzent <= 3, 'und damit unter den geforderten 3 Prozent');
// Lange Leitung: jetzt gibt der Spannungsfall den Ausschlag
var lang = E.leitungAuslegen(16, 150, 400, 3, 3, 0.8, 'B2', 30, 1);
ok(lang.massgebend === 'Spannungsfall', 'auf 150 m entscheidet der Spannungsfall');
ok(lang.A > l.A, 'und verlangt mehr Querschnitt');
ok(lang.fallProzent <= 3, 'die 3 Prozent werden trotzdem eingehalten');
// Warme, volle Trasse braucht ebenfalls mehr
var warm = E.leitungAuslegen(16, 25, 400, 3, 3, 0.8, 'B2', 45, 4);
ok(warm.A > l.A, 'warm und gebuendelt braucht mehr Querschnitt');
ok(E.leitungAuslegen(400, 25, 400, 3, 3, 0.8, 'B2', 30, 1) === null,
   'fuer 400 A reicht die Tafel nicht');

/* ---------- Drehstrom ---------- */
near(E.stern(400, 8).U_strang, 230.9401077, 'im Stern liegen 231 V am Strang', 1e-6);
near(E.stern(400, 8).I_strang, 8, 'und der volle Aussenleiterstrom');
near(E.dreieck(400, 8).U_strang, 400, 'im Dreieck die volle Spannung');
near(E.dreieck(400, 8).I_strang, 4.6188022, 'aber nur der Strom durch Wurzel 3', 1e-6);
// 4 kW am Typenschild: 400 V, cos phi 0,82, Wirkungsgrad 88 Prozent
near(E.motorstrom(4000, 400, 0.82, 0.88), 8.0009737, 'Nennstrom eines 4-kW-Motors', 1e-6);
near(E.motorstrom(4000, 400, 0.82, 88), 8.0009737, 'Wirkungsgrad in Prozent geht auch', 1e-6);
ok(E.motorstrom(4000, 400, 0.82, 0.88) > E.motorstrom(4000, 400, 0.82, 1),
   'mit Verlusten fliesst mehr Strom als ohne');
near(E.leistungDrehstrom(400, 8, 0.82), 4544.9013, 'Wirkleistung', 1e-3);
near(E.scheinleistung(400, 8), 5542.5626, 'Scheinleistung', 1e-3);
var S = E.scheinleistung(400, 8), P = E.leistungDrehstrom(400, 8, 0.82);
near(E.blindleistung(S, P), Math.sqrt(S * S - P * P), 'Blindleistung schliesst das Dreieck', 1e-9);
near(P / S, 0.82, 'P durch S ist wieder der Leistungsfaktor', 1e-9);
ok(!isFinite(E.blindleistung(100, 200)), 'mehr Wirk- als Scheinleistung gibt es nicht');
near(E.anlaufstrom(8, 6), 48, 'sechsfacher Anlaufstrom');
near(E.anlaufstrom(8), 48, 'sechsfach ist die Vorgabe');
var sd = E.sternDreieckAnlauf(48, 26);
near(sd.I_stern, 16, 'im Stern nur ein Drittel des Anlaufstroms');
near(sd.M_stern, 26 / 3, 'und nur ein Drittel des Moments', 1e-9);

/* ---------- Kompensation ----------
   4 kW von cos phi 0,8 auf 0,95: Qc = 4000 * (0,75 - 0,3287) = 1685 var */
var k = E.kompensation(4000, 0.8, 0.95, 400, 50);
near(k.Qc, 1685.2636, 'noetige Blindleistung', 1e-3);
near(k.C_dreieck, 11.1751, 'Kondensator im Dreieck in Mikrofarad', 1e-3);
near(k.C_stern, 3 * k.C_dreieck, 'im Stern das Dreifache', 1e-9);
ok(E.kompensation(4000, 0.95, 0.8, 400, 50) === null, 'verschlechtern ist keine Kompensation');
ok(E.kompensation(4000, 0.8, 0.8, 400, 50) === null, 'ohne Ziel keine Rechnung');
// Voll auf 1,0 zu kompensieren braucht die ganze Blindleistung
near(E.kompensation(4000, 0.8, 1, 400, 50).Qc, 4000 * 0.75, 'auf cos phi 1 die volle Blindleistung', 1e-6);

/* ---------- Tabellen ---------- */
var arten = Object.keys(E.BELASTBARKEIT);
arten.forEach(function (a) {
  var t = E.BELASTBARKEIT[a];
  ok(t.zwei.length === E.NORMQUERSCHNITT.length, a + ': zwei Adern vollstaendig');
  ok(t.drei.length === E.NORMQUERSCHNITT.length, a + ': drei Adern vollstaendig');
  t.zwei.forEach(function (v, i) {
    ok(v > t.drei[i], a + ' bei ' + E.NORMQUERSCHNITT[i] + ': zwei Adern tragen mehr als drei');
    if (i > 0) {
      ok(v > t.zwei[i - 1], a + ' bei ' + E.NORMQUERSCHNITT[i] + ': dicker traegt mehr');
      ok(t.drei[i] > t.drei[i - 1], a + ' bei ' + E.NORMQUERSCHNITT[i] + ': dasselbe bei drei Adern');
    }
  });
});
// Je freier die Leitung liegt, desto mehr traegt sie
['zwei', 'drei'].forEach(function (sp) {
  E.NORMQUERSCHNITT.forEach(function (q, i) {
    var B = E.BELASTBARKEIT;
    ok(B.A2[sp][i] <= B.A1[sp][i] && B.A1[sp][i] <= B.B2[sp][i] &&
       B.B2[sp][i] <= B.B1[sp][i] && B.B1[sp][i] <= B.C[sp][i] &&
       B.C[sp][i] <= B.E[sp][i],
       q + ' mm2 (' + sp + '): A2 <= A1 <= B2 <= B1 <= C <= E');
  });
});
// Die Faktorentafeln fallen mit steigender Temperatur und Haeufung
for (var i = 1; i < E.TEMPFAKTOR.length; i++) {
  ok(E.TEMPFAKTOR[i].f < E.TEMPFAKTOR[i - 1].f, 'waermer heisst weniger');
}
for (var j = 1; j < E.HAEUFUNG.length; j++) {
  ok(E.HAEUFUNG[j].f < E.HAEUFUNG[j - 1].f, 'mehr Kreise heisst weniger');
}
// Die Sicherungsreihen steigen
[E.LS_SCHALTER, E.SCHMELZ].forEach(function (r) {
  for (var i = 1; i < r.length; i++) ok(r[i] > r[i - 1], 'Sicherungsreihe steigt');
});

console.log(fails ? fails + ' Fehler' : 'alle Tests bestanden');
process.exit(fails ? 1 : 0);
