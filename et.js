// Gemeinsamer Rechenkern der Elektrotechnik-Werkzeuge.
// Reine Funktionen, damit test-et.js sie ohne Browser pruefen kann.
(function (global) {
  'use strict';

  var PREFIX = { '': 1, R: 1, r: 1, k: 1e3, K: 1e3, M: 1e6, G: 1e9,
                 m: 1e-3, u: 1e-6, 'µ': 1e-6, 'μ': 1e-6, n: 1e-9, p: 1e-12 };

  // "4k7", "2.2k", "10 mA", "0,1µF", "1M" -> Zahl. NaN, wenn unlesbar.
  function parseVal(s) {
    if (typeof s === 'number') return s;
    if (s === null || s === undefined) return NaN;
    s = String(s).trim().replace(/\s+/g, '').replace(',', '.');
    if (!s) return NaN;
    var m = s.match(/^([+-]?\d+)([kKMGmunpRµμ])(\d+)$/);   // 4k7
    if (m) s = m[1] + '.' + m[3] + m[2];
    var parts = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)([^\d]*)$/);
    if (!parts) return NaN;
    var num = parseFloat(parts[1]);
    var suf = parts[2].replace(/(hz|ohm|Ω|Ω|v|a|w|f|h|s)$/i, '');  // Einheit abschneiden
    if (!(suf in PREFIX)) return NaN;
    return num * PREFIX[suf];
  }

  function sig(x, digits) {                       // auf n geltende Ziffern, ohne Nullschwanz
    if (x === 0) return '0';
    var r = Number(x.toPrecision(digits || 4));
    return String(r);
  }

  function fmt(x, unit) {                         // Zahl mit passendem Vorsatz
    if (x === null || x === undefined || !isFinite(x)) return '–';
    unit = unit || '';
    if (x === 0) return '0 ' + unit;
    var steps = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'],
                 [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
    var a = Math.abs(x);
    for (var i = 0; i < steps.length; i++) {
      if (a >= steps[i][0] || i === steps.length - 1) {
        return sig(x / steps[i][0]) + ' ' + steps[i][1] + unit;
      }
    }
  }

  // Normreihen. E6/E12/E24 sind gerundete Festwerte, keine reine Zehnerpotenz-Formel.
  var SERIES = {
    E6: [1.0, 1.5, 2.2, 3.3, 4.7, 6.8],
    E12: [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2],
    E24: [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
          3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1]
  };

  function nearestE(value, series) {              // nächster Normwert (logarithmisch gemessen)
    var tab = SERIES[series || 'E24'];
    if (!tab || !(value > 0)) return NaN;
    var dec = Math.floor(Math.log(value) / Math.LN10);
    var best = NaN, bestD = Infinity;
    [dec - 1, dec, dec + 1].forEach(function (d) {
      tab.forEach(function (t) {
        var cand = t * Math.pow(10, d);
        var dist = Math.abs(Math.log(cand / value));
        if (dist < bestD - 1e-12) { bestD = dist; best = cand; }
      });
    });
    return Number(best.toPrecision(12));
  }

  // Ohmsches Gesetz und Leistung: genau zwei Groessen vorgeben.
  function solveOhm(v) {
    var U = v.U, I = v.I, R = v.R, P = v.P;
    var given = ['U', 'I', 'R', 'P'].filter(function (k) { return isFinite(v[k]); });
    if (given.length !== 2) return { error: given.length + ' von 2 Werten', given: given };
    var key = given.join('');
    if (key === 'UI') { R = I ? U / I : NaN; P = U * I; }
    else if (key === 'UR') { I = R ? U / R : NaN; P = R ? U * U / R : NaN; }
    else if (key === 'UP') { I = U ? P / U : NaN; R = P ? U * U / P : NaN; }
    else if (key === 'IR') { U = I * R; P = I * I * R; }
    else if (key === 'IP') { U = I ? P / I : NaN; R = I ? P / (I * I) : NaN; }
    else if (key === 'RP') { U = Math.sqrt(P * R); I = R ? Math.sqrt(P / R) : NaN; }
    return { U: U, I: I, R: R, P: P, given: given };
  }

  // Farbcode. d = Ziffer, m = Multiplikator, tol = Toleranz in %, tk = ppm/K.
  var COLORS = [
    { n: 'schwarz',  hex: '#111111', d: 0, m: 1 },
    { n: 'braun',    hex: '#7b4a12', d: 1, m: 1e1, tol: 1, tk: 100 },
    { n: 'rot',      hex: '#c62828', d: 2, m: 1e2, tol: 2, tk: 50 },
    { n: 'orange',   hex: '#ef6c00', d: 3, m: 1e3, tk: 15 },
    { n: 'gelb',     hex: '#f2b705', d: 4, m: 1e4, tk: 25 },
    { n: 'grün', hex: '#2e7d32', d: 5, m: 1e5, tol: 0.5 },
    { n: 'blau',     hex: '#1565c0', d: 6, m: 1e6, tol: 0.25, tk: 10 },
    { n: 'violett',  hex: '#6a1b9a', d: 7, m: 1e7, tol: 0.1, tk: 5 },
    { n: 'grau',     hex: '#757575', d: 8, m: 1e8, tol: 0.05 },
    { n: 'weiß', hex: '#f0f0f0', d: 9, m: 1e9 },
    { n: 'gold',     hex: '#c9a227', m: 0.1, tol: 5 },
    { n: 'silber',   hex: '#b4b4b4', m: 0.01, tol: 10 }
  ];

  function bandsToValue(bands) {                  // bands: Indizes in COLORS, 4, 5 oder 6 Ringe
    var digits = bands.length >= 5 ? 3 : 2;
    var val = 0;
    for (var i = 0; i < digits; i++) {
      var d = COLORS[bands[i]].d;
      if (d === undefined) return { error: 'Ring ' + (i + 1) + ' kann keine Ziffer sein' };
      val = val * 10 + d;
    }
    var mc = COLORS[bands[digits]];
    if (mc.m === undefined) return { error: 'Multiplikatorring ungültig' };
    var tolc = bands.length > digits + 1 ? COLORS[bands[digits + 1]] : null;
    var tkc = bands.length > digits + 2 ? COLORS[bands[digits + 2]] : null;
    return {
      value: Number((val * mc.m).toPrecision(12)),
      tol: tolc && tolc.tol !== undefined ? tolc.tol : null,
      tk: tkc && tkc.tk !== undefined ? tkc.tk : null
    };
  }

  function valueToBands(value, count, tolPercent) {   // Wert -> Ringfarben
    if (!(value > 0)) return { error: 'Wert muss groesser als 0 sein' };
    var digits = count >= 5 ? 3 : 2;
    var exp = Math.floor(Math.log(value) / Math.LN10) - (digits - 1);
    var mant = Math.round(value / Math.pow(10, exp));
    if (mant >= Math.pow(10, digits)) { mant = Math.round(mant / 10); exp++; }
    if (Math.abs(mant * Math.pow(10, exp) - value) > Math.abs(value) * 1e-9) {
      return { error: 'Wert lässt sich mit ' + digits + ' Ziffern nicht genau darstellen' };
    }
    var mi = -1;
    for (var i = 0; i < COLORS.length; i++) {
      if (COLORS[i].m !== undefined && Math.abs(COLORS[i].m - Math.pow(10, exp)) < Math.pow(10, exp) * 1e-9) { mi = i; break; }
    }
    if (mi < 0) return { error: 'Multiplikator 10^' + exp + ' gibt es als Ring nicht' };
    var bands = String(mant).split('').map(function (ch) {
      var d = +ch, idx = -1;
      COLORS.forEach(function (c, j) { if (c.d === d) idx = j; });
      return idx;
    });
    bands.push(mi);
    if (tolPercent !== undefined && tolPercent !== null) {
      var ti = -1;
      COLORS.forEach(function (c, j) { if (c.tol === tolPercent) ti = j; });
      if (ti < 0) return { error: 'Toleranz ' + tolPercent + ' % gibt es als Ring nicht' };
      bands.push(ti);
    }
    return { bands: bands };
  }

  // Wechselstrom
  function xl(f, L) { return 2 * Math.PI * f * L; }
  function xc(f, C) { return (f && C) ? 1 / (2 * Math.PI * f * C) : Infinity; }
  function impedance(R, X) {                      // X = XL - XC
    return { Z: Math.sqrt(R * R + X * X), phi: Math.atan2(X, R) * 180 / Math.PI };
  }
  function resonance(L, C) { return (L > 0 && C > 0) ? 1 / (2 * Math.PI * Math.sqrt(L * C)) : NaN; }

  var api = { parseVal: parseVal, fmt: fmt, sig: sig, SERIES: SERIES, nearestE: nearestE,
              solveOhm: solveOhm, COLORS: COLORS, bandsToValue: bandsToValue,
              valueToBands: valueToBands, xl: xl, xc: xc, impedance: impedance, resonance: resonance };

  // Navigationsleiste, damit sie nicht in jeder Seite doppelt steht
  var PAGES = [['index.html', 'KV-Diagramm'], ['ohm.html', 'Ohm &amp; Leistung'],
               ['farbcode.html', 'Farbcode'], ['led.html', 'LED &amp; Teiler'],
               ['wechselstrom.html', 'Wechselstrom']];
  api.buildNav = function () {
    var el = document.getElementById('nav');
    if (!el) return;
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    el.innerHTML = PAGES.map(function (p) {
      return '<a href="' + p[0] + '"' + (p[0] === here ? ' aria-current="page"' : '') + '>' + p[1] + '</a>';
    }).join('');
  };

  // Fragezeichen neben jedem Feld mit data-help. Eine einzige Sprechblase für alle Knöpfe.
  var tip = null, open = null, pinned = false;

  function tipEl() {
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'tip'; tip.id = 'helptip';
      tip.setAttribute('role', 'tooltip');
      tip.hidden = true;
      document.body.appendChild(tip);
    }
    return tip;
  }

  function hideTip() {
    if (!open) return;
    open.setAttribute('aria-expanded', 'false');
    open.removeAttribute('aria-describedby');
    tipEl().hidden = true;
    open = null; pinned = false;
  }

  function showTip(btn) {
    var t = tipEl();
    t.textContent = btn.dataset.text;
    t.hidden = false;
    var r = btn.getBoundingClientRect();
    var max = document.documentElement.clientWidth - t.offsetWidth - 8;
    t.style.left = Math.max(8, Math.min(r.left - 8, max)) + window.scrollX + 'px';
    t.style.top = r.bottom + window.scrollY + 6 + 'px';
    if (open && open !== btn) {
      open.setAttribute('aria-expanded', 'false');
      open.removeAttribute('aria-describedby');
    }
    open = btn;
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-describedby', 'helptip');
  }

  function helpBtn(e) { return e.target && e.target.closest ? e.target.closest('.help') : null; }
  function inTip(e) { return tip && tip.contains(e.target); }

  api.buildHelp = function (root) {
    var list = (root || document).querySelectorAll('[data-help]');
    Array.prototype.forEach.call(list, function (el) {
      if (el.dataset.helpReady) return;
      el.dataset.helpReady = '1';
      var cap = el.querySelector('.lbl') || el.querySelector('span');
      var name = (cap ? cap.textContent : el.getAttribute('aria-label') || el.textContent).trim();
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'help';
      b.textContent = '?';
      b.dataset.text = el.dataset.help;
      b.setAttribute('aria-expanded', 'false');
      b.setAttribute('aria-label', 'Erklärung zu: ' + (name || 'diesem Feld'));
      // Das ? sitzt im <label>, sonst haengte sein aria-label am Namen des Feldes
      var fld = el.querySelector('input, select, textarea');
      if (fld && name && !fld.getAttribute('aria-label')) fld.setAttribute('aria-label', name);
      if (!cap && el.classList.contains('seg') && el.parentNode) {
        el.parentNode.insertBefore(b, el.nextSibling);   // neben den Schaltkasten, nicht hinein
      } else {
        var h = cap || el;
        h.appendChild(document.createTextNode('\u00a0'));  // bindet das ? ans letzte Wort, sonst rutscht es allein in die nächste Zeile
        h.appendChild(b);
      }
    });
  };

  // Bewegung ist Zugabe: wer sie abgestellt hat, bekommt dieselbe Seite ohne sie.
  function reduced() {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  api.reduced = reduced;

  // Geaenderte Messwerte kurz hervorheben. Ein Beobachter je Ergebnisblock,
  // die Rechner selbst muessen davon nichts wissen.
  function watchValues() {
    if (reduced() || typeof MutationObserver === 'undefined') return;
    Array.prototype.forEach.call(document.querySelectorAll('.out'), function (box) {
      var last = {}, first = true;
      function scan() {
        Array.prototype.forEach.call(box.children, function (cell) {
          var k = cell.querySelector('.k'), v = cell.querySelector('.v');
          if (!k || !v) return;
          var key = k.textContent, now = v.textContent;
          if (!first && last[key] !== undefined && last[key] !== now) {
            v.classList.remove('bump'); cell.classList.remove('bump');
            void v.offsetWidth;                      // erzwingt den Neustart der Animation
            v.classList.add('bump'); cell.classList.add('bump');
          }
          last[key] = now;
        });
        first = false;
      }
      scan();
      new MutationObserver(scan).observe(box, { childList: true, subtree: true, characterData: true });
    });
  }

  function bindHelp() {
    api.buildHelp();
    document.addEventListener('mouseover', function (e) {
      var b = helpBtn(e);
      if (b) showTip(b);
      else if (!pinned && open && !inTip(e)) hideTip();
    });
    document.addEventListener('click', function (e) {
      var b = helpBtn(e);
      if (b) { e.preventDefault(); showTip(b); pinned = true; return; }  // Knopf steckt im <label>
      if (open && !inTip(e)) hideTip();
    });
    document.addEventListener('focusin', function (e) {
      var b = helpBtn(e);
      if (b) { showTip(b); pinned = true; }
      else if (open && !inTip(e)) hideTip();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideTip(); });
    window.addEventListener('resize', hideTip);
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { global.ET = api; if (global.document) document.addEventListener('DOMContentLoaded', function () { api.buildNav(); bindHelp(); watchValues(); }); }
})(typeof window !== 'undefined' ? window : globalThis);
