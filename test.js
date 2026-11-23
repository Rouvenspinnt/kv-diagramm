// Selbsttest ohne Abhaengigkeiten:  node test.js
var kv = require('./kv.js');
var fails = 0;

// Deterministischer Zufall: ein gruener Lauf bedeutet sonst wenig, weil jeder Lauf
// andere Funktionen prueft. Seed aendern, um weitere Faelle abzuklopfen.
var seed = 20261123;
function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
function ok(cond, msg) { if (!cond) { fails++; console.error('FAIL: ' + msg); } }

// 1. Ergebnis muss die Wertetabelle exakt wiedergeben (alle 3-Var-Funktionen,
//    dazu 500 zufaellige 4-Var-Funktionen mit don't cares).
function checkFunction(n, vals) {
  [1, 0].forEach(function (target) {
    var res = kv.minimize(n, vals, target);
    for (var m = 0; m < (1 << n); m++) {
      if (vals[m] === 2) continue; // don't care: beides erlaubt
      ok(kv.evalResult(res, m) === vals[m],
        'n=' + n + ' target=' + target + ' vals=[' + vals + '] Minterm ' + m +
        ' -> ' + kv.evalResult(res, m) + ' statt ' + vals[m] + '  (' + kv.resultText(res) + ')');
    }
    // Irredundanz: kein Term darf ueberfluessig sein.
    res.terms.forEach(function (_, i) {
      var rest = { n: n, target: target, constant: null, terms: res.terms.filter(function (_, j) { return j !== i; }) };
      var stillOk = true;
      for (var m2 = 0; m2 < (1 << n); m2++) if (vals[m2] !== 2 && kv.evalResult(rest, m2) !== vals[m2]) stillOk = false;
      ok(!stillOk, 'ueberfluessiger Term in [' + vals + '] target=' + target + ': ' + kv.resultText(res));
    });
  });
}

for (var f = 0; f < 256; f++) {
  var vals = [];
  for (var i = 0; i < 8; i++) vals.push((f >> i) & 1);
  checkFunction(3, vals);
}
for (var r = 0; r < 500; r++) {
  var v4 = [];
  for (var j = 0; j < 16; j++) v4.push(rnd() < 0.15 ? 2 : (rnd() < 0.5 ? 1 : 0));
  checkFunction(4, v4);
}

for (var r5 = 0; r5 < 60; r5++) {
  var v5 = [];
  for (var j5 = 0; j5 < 32; j5++) v5.push(rnd() < 0.15 ? 2 : (rnd() < 0.5 ? 1 : 0));
  checkFunction(5, v5);
}
for (var r6 = 0; r6 < 40; r6++) {
  var v6 = [];
  for (var j6 = 0; j6 < 64; j6++) v6.push(rnd() < 0.15 ? 2 : (rnd() < 0.5 ? 1 : 0));
  checkFunction(6, v6);
}

// 1b. Regression: hier hat der gierige Notfallpfad essentielle Primimplikanten
//     wieder entfernt, wodurch einzelne Minterme unbedeckt blieben.
checkFunction(6, [1,1,1,1,0,1,1,2,0,2,0,0,0,0,0,2,0,1,1,0,0,0,1,0,1,0,2,1,0,0,0,1,
                  1,0,2,1,1,0,0,1,2,1,1,0,1,1,1,2,1,1,0,1,0,1,1,1,1,1,0,1,2,0,1,1]);
checkFunction(6, [1,0,1,0,1,2,0,1,1,2,1,0,0,1,0,1,1,1,0,1,0,2,0,1,1,1,1,1,2,1,1,0,
                  1,2,2,1,1,2,0,0,0,1,1,0,2,2,2,2,0,1,0,1,1,0,0,1,1,0,1,1,1,0,0,1]);

// 2. Bekannte minimale Ergebnisse.
ok(kv.resultText(kv.minimize(2, [0, 1, 1, 1], 1)) === 'B + A', 'A OR B');
ok(kv.resultText(kv.minimize(2, [0, 0, 0, 1], 1)) === 'A·B', 'A AND B');
ok(kv.resultText(kv.minimize(4, new Array(16).fill(1), 1)) === '1', 'konstant 1');
ok(kv.resultText(kv.minimize(4, new Array(16).fill(0), 1)) === '0', 'konstant 0');
ok(kv.resultText(kv.minimize(3, [0, 0, 0, 0, 1, 1, 1, 1], 1)) === 'A', 'nur A relevant');
ok(kv.resultText(kv.minimize(3, [0, 0, 0, 0, 1, 1, 1, 1], 0)) === '(A)', 'KNF nur A');
ok(kv.resultText(kv.minimize(6, new Array(64).fill(1), 1)) === '1', '6 Variablen konstant 1');
var e5 = [];
for (var q = 0; q < 32; q++) e5.push(q & 1); // nur E (LSB) entscheidet
ok(kv.resultText(kv.minimize(5, e5, 1)) === 'E', '5 Variablen, nur E relevant');
var half6 = [];
for (var q6 = 0; q6 < 64; q6++) half6.push((q6 >> 5) & 1); // nur A (MSB)
ok(kv.resultText(kv.minimize(6, half6, 1)) === 'A', '6 Variablen, nur A relevant');
// XOR ueber 2 Variablen: zwei Terme mit je 2 Literalen
var x = kv.minimize(2, [0, 1, 1, 0], 1);
ok(x.terms.length === 2 && x.terms[0].literals.length === 2, 'XOR bleibt 2 Terme');
// don't cares werden genutzt: 1 bei 0, X ueberall sonst -> konstante 1 moeglich
ok(kv.resultText(kv.minimize(3, [1, 2, 2, 2, 2, 2, 2, 2], 1)) === '1', 'don\'t cares werden genutzt');

console.log(fails ? fails + ' Fehler' : 'alle Tests bestanden');
process.exit(fails ? 1 : 0);
