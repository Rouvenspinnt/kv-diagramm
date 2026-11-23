// KV-Logik: Primimplikanten (Quine-McCluskey) + exakte minimale Ueberdeckung (Petrick).
// Werte je Minterm: 0, 1, 2 (= don't care / X).
(function (global) {
  'use strict';

  var VARS = ['A', 'B', 'C', 'D', 'E', 'F'];

  function popcount(x) { var c = 0; while (x) { x &= x - 1; c++; } return c; }
  function covers(p, m) { return (m & p.mask) === p.bits; }

  // Alle Primimplikanten ueber der Menge `ones` (Einsen + don't cares).
  function primeImplicants(n, ones) {
    var full = (1 << n) - 1;
    var cur = ones.map(function (m) { return { bits: m, mask: full }; });
    var primes = [], seen = {};
    while (cur.length) {
      var used = new Array(cur.length).fill(false);
      var next = {};
      for (var i = 0; i < cur.length; i++) {
        for (var j = i + 1; j < cur.length; j++) {
          var a = cur[i], b = cur[j];
          if (a.mask !== b.mask) continue;
          var diff = (a.bits ^ b.bits) & a.mask;
          if (diff === 0 || (diff & (diff - 1)) !== 0) continue; // genau ein Bit unterschiedlich
          used[i] = used[j] = true;
          var nm = a.mask & ~diff;
          next[nm + ':' + (a.bits & nm)] = { bits: a.bits & nm, mask: nm };
        }
      }
      for (var k = 0; k < cur.length; k++) {
        if (used[k]) continue;
        var key = cur[k].mask + ':' + cur[k].bits;
        if (!seen[key]) { seen[key] = true; primes.push(cur[k]); }
      }
      cur = Object.keys(next).map(function (key) { return next[key]; });
    }
    return primes;
  }

  // Kleinste Teilmengen behalten: Duplikate und Obermengen raus.
  function prune(sets) {
    var arr = sets.map(function (s) { return s.slice().sort(function (a, b) { return a - b; }); });
    arr.sort(function (a, b) { return a.length - b.length; });
    var keep = [], seen = {};
    outer: for (var i = 0; i < arr.length; i++) {
      var key = arr[i].join(',');
      if (seen[key]) continue;
      seen[key] = true;
      for (var j = 0; j < keep.length; j++) {
        var sub = keep[j], ok = true;
        for (var k = 0; k < sub.length; k++) if (arr[i].indexOf(sub[k]) < 0) { ok = false; break; }
        if (ok) continue outer; // enthaelt bereits eine kleinere Loesung
      }
      keep.push(arr[i]);
    }
    return keep;
  }

  // Minimale Ueberdeckung: essentielle Primimplikanten, Rest per Petrick.
  // shortcut: Petrick bekommt ein Zeit-/Groessenbudget (6 Variablen koennen sonst Sekunden
  // brauchen). Reisst es, wird gierig gedeckt und anschliessend entredundanziert -- das
  // Ergebnis ist dann korrekt und ohne ueberfluessige Terme, aber evtl. nicht das kuerzeste;
  // res.exact meldet das. Fuer mehr als 6 Variablen muesste man hier richtig optimieren.
  var BUDGET_MS = 250, MAX_SOLS = 1500;

  // `chosen` enthaelt die essentiellen Primimplikanten und wird ergaenzt.
  function greedyCover(primes, required, chosen) {
    var left = required.filter(function (m) {
      return !chosen.some(function (i) { return covers(primes[i], m); });
    });
    while (left.length) {
      var best = -1, bestGain = -1, bestLits = 0;
      for (var i = 0; i < primes.length; i++) {
        if (chosen.indexOf(i) >= 0) continue;
        var gain = 0;
        for (var k = 0; k < left.length; k++) if (covers(primes[i], left[k])) gain++;
        var lits = popcount(primes[i].mask);
        if (gain > bestGain || (gain === bestGain && gain > 0 && lits < bestLits)) {
          best = i; bestGain = gain; bestLits = lits;
        }
      }
      if (best < 0 || bestGain <= 0) break;
      chosen.push(best);
      left = left.filter(function (m) { return !covers(primes[best], m); });
    }
    // ueberfluessige Terme wieder entfernen (Gier kann welche erzeugen). Gegen ALLE
    // geforderten Minterme pruefen, sonst fliegen essentielle Primimplikanten raus.
    for (var j = chosen.length - 1; j >= 0; j--) {
      var without = chosen.slice(0, j).concat(chosen.slice(j + 1));
      var allCovered = required.every(function (m) {
        return without.some(function (idx) { return covers(primes[idx], m); });
      });
      if (allCovered) chosen.splice(j, 1);
    }
    return chosen;
  }

  function exactCover(primes, required) {
    var chosen = [], i, r;
    for (r = 0; r < required.length; r++) {
      var cands = [];
      for (i = 0; i < primes.length; i++) if (covers(primes[i], required[r])) cands.push(i);
      if (!cands.length) return { picks: [], exact: true };
      // nur ein Primimplikant deckt diesen Minterm -> er muss in jede minimale Loesung
      if (cands.length === 1 && chosen.indexOf(cands[0]) < 0) chosen.push(cands[0]);
    }
    var rest = required.filter(function (m) {
      for (var k = 0; k < chosen.length; k++) if (covers(primes[chosen[k]], m)) return false;
      return true;
    });

    var t0 = Date.now(), sols = [[]];
    for (r = 0; r < rest.length; r++) {
      if (Date.now() - t0 > BUDGET_MS) {
        return { picks: greedyCover(primes, required, chosen.slice()), exact: false };
      }
      var cands2 = [];
      for (i = 0; i < primes.length; i++) if (covers(primes[i], rest[r])) cands2.push(i);
      var next = [];
      for (var s = 0; s < sols.length; s++) {
        for (var c = 0; c < cands2.length; c++) {
          if (sols[s].indexOf(cands2[c]) >= 0) { next.push(sols[s]); continue; }
          next.push(sols[s].concat([cands2[c]]));
        }
      }
      sols = prune(next);
      if (sols.length > MAX_SOLS) sols = sols.slice(0, MAX_SOLS); // prune sortiert nach Groesse
    }
    var best = null, bestKey = null;
    for (var t = 0; t < sols.length; t++) {
      var lits = 0;
      for (var u = 0; u < sols[t].length; u++) lits += popcount(primes[sols[t][u]].mask);
      var key = sols[t].length * 1000 + lits;
      if (bestKey === null || key < bestKey) { bestKey = key; best = sols[t]; }
    }
    return { picks: chosen.concat(best || []), exact: true };
  }

  // target 1 -> minimale DNF, target 0 -> minimale KNF (Terme sind dann ODER-Klauseln).
  function minimize(n, vals, target) {
    var ones = [], required = [];
    for (var m = 0; m < (1 << n); m++) {
      if (vals[m] === target || vals[m] === 2) ones.push(m);
      if (vals[m] === target) required.push(m);
    }
    if (!required.length) return { n: n, target: target, terms: [], constant: target === 1 ? 0 : 1, exact: true };
    var primes = primeImplicants(n, ones);
    var cover = exactCover(primes, required);
    var chosen = cover.picks.map(function (i) { return primes[i]; });
    if (chosen.length === 1 && chosen[0].mask === 0) {
      return { n: n, target: target, terms: [], constant: target === 1 ? 1 : 0, exact: true };
    }
    chosen.sort(function (a, b) { return popcount(a.mask) - popcount(b.mask) || a.bits - b.bits; });
    var terms = chosen.map(function (p) {
      var cells = [];
      for (var mm = 0; mm < (1 << n); mm++) if (covers(p, mm)) cells.push(mm);
      var lits = [];
      for (var i = 0; i < n; i++) {
        var bit = 1 << (n - 1 - i);
        if (p.mask & bit) lits.push({ name: VARS[i], neg: target === 1 ? !(p.bits & bit) : !!(p.bits & bit) });
      }
      return { bits: p.bits, mask: p.mask, cells: cells, literals: lits };
    });
    return { n: n, target: target, terms: terms, constant: null, exact: cover.exact };
  }

  function termText(t, target) {
    var parts = t.literals.map(function (l) { return (l.neg ? '!' : '') + l.name; });
    return target === 1 ? parts.join('·') : '(' + parts.join(' + ') + ')';
  }

  function resultText(res) {
    if (res.constant !== null) return String(res.constant);
    return res.terms.map(function (t) { return termText(t, res.target); })
      .join(res.target === 1 ? ' + ' : ' · ');
  }

  function evalResult(res, m) {
    if (res.constant !== null) return res.constant;
    var n = res.n;
    if (res.target === 1) {
      for (var i = 0; i < res.terms.length; i++) if (covers(res.terms[i], m)) return 1;
      return 0;
    }
    for (var j = 0; j < res.terms.length; j++) if (covers(res.terms[j], m)) return 0;
    return 1;
  }

  var api = { VARS: VARS, primeImplicants: primeImplicants, minimize: minimize,
    resultText: resultText, termText: termText, evalResult: evalResult,
    covers: covers, popcount: popcount };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.KV = api;
})(typeof window !== 'undefined' ? window : globalThis);
