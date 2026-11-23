/* Mess- und Regeltechnik: Rechenkern.
   Laeuft im Browser und unter node (test-messen.js).

   Quellen:
   - Normsignale und Rohwerte: Siemens S7, Darstellung der Analogwerte
     (S7-300 Baugruppendaten Kap. 5, S7-1500 Analogwertverarbeitung Kap. 3/4).
     Nennbereich 0..27648, Uebersteuerung bis 32511, Ueberlauf ab 32512,
     Untersteuerung bis -4864, Unterlauf ab -4865. Bipolar -27648..27648,
     dort reicht die Untersteuerung bis -32512, also ein Digit weiter als
     die Uebersteuerung nach oben.
     Das gilt fuer Analogeingaben. Analogausgaben haben andere Grenzen
     (unipolar bis -6912, und bei Ueber-/Unterlauf geht der Ausgang auf 0).
   - Pt100/Pt1000: Callendar-van-Dusen nach DIN EN 60751
   - Thermoelemente: Polynome nach NIST ITS-90, Typen K, J, T.
     Die Umkehrung wird numerisch gesucht statt mit zweitem Koeffizientensatz. */
(function (global) {
  'use strict';

  /* ---------- Lineare Skalierung ---------- */
  function skala(x, a0, a1, b0, b1) {
    if (!isFinite(x) || a1 === a0) return NaN;
    return b0 + (x - a0) * (b1 - b0) / (a1 - a0);
  }

  /* ---------- Normsignale ----------
     live: das Signal faengt oberhalb von null an, deshalb ist 0 ein Drahtbruch
     und kein Messwert. Das ist der ganze Sinn von 4 mA. */
  var SIGNALE = {
    '4-20mA': { name: '4–20 mA', einheit: 'mA', s0: 4,  s1: 20, live: true },
    '0-20mA': { name: '0–20 mA', einheit: 'mA', s0: 0,  s1: 20, live: false },
    '0-10V':  { name: '0–10 V',  einheit: 'V',  s0: 0,  s1: 10, live: false,
                hinweis: 'Für 0–10 V führt Siemens keinen Untersteuerungsbereich auf: ' +
                         'negative Werte sind an diesem Eingang je nach Baugruppe gar nicht ' +
                         'vorgesehen. Die Grenze unten kommt aus der allgemeinen Tabelle.' },
    '2-10V':  { name: '2–10 V',  einheit: 'V',  s0: 2,  s1: 10, live: true,
                hinweis: '2–10 V kommt aus der Gebäudetechnik und steht in keiner ' +
                         'Siemens-Rohwerttabelle. Die Grenzen sind nach demselben Schema ' +
                         'fortgeschrieben, nicht nachgeschlagen.' },
    '1-5V':   { name: '1–5 V',   einheit: 'V',  s0: 1,  s1: 5,  live: true },
    '-10-10V': { name: '±10 V',  einheit: 'V',  s0: -10, s1: 10, live: false, bipolar: true }
  };

  function signal(id) { return SIGNALE[id] || null; }

  // Signal -> physikalischer Messwert
  function ausSignal(s, id, m0, m1) {
    var g = signal(id);
    if (!g) return NaN;
    return skala(s, g.s0, g.s1, m0, m1);
  }
  // Messwert -> Signal
  function zuSignal(m, id, m0, m1) {
    var g = signal(id);
    if (!g) return NaN;
    return skala(m, m0, m1, g.s0, g.s1);
  }

  /* ---------- SPS-Rohwert ----------
     Die Grenzen sind fuer alle unipolaren Bereiche dieselben, weil sie am
     Rohwert haengen und nicht am Signal. Deshalb eine Rechnung statt einer
     Tabelle je Bereich. */
  var ROH = { nenn: 27648, ueber: 32511, overflow: 32767, unter: -4864,
              unterBip: -32512, underflow: -32768 };

  function grenzen(id) {
    var g = signal(id);
    if (!g) return null;
    var spanne = g.s1 - g.s0;
    if (g.bipolar) {
      // -27648..27648 ueber die halbe Spanne, also s1 am oberen Ende.
      // Nach unten geht die Untersteuerung ein Digit weiter als nach oben.
      return { nenn0: -ROH.nenn, nenn1: ROH.nenn,
               sUeber: g.s1 * ROH.ueber / ROH.nenn,
               sUnter: g.s1 * ROH.unterBip / ROH.nenn };
    }
    return { nenn0: 0, nenn1: ROH.nenn,
             sUeber: g.s0 + spanne * ROH.ueber / ROH.nenn,
             sUnter: g.s0 + spanne * ROH.unter / ROH.nenn };
  }

  // Signal -> Rohwert, mit der Lage im Bereich
  function rohwert(s, id) {
    var g = signal(id), gr = grenzen(id);
    if (!g || !isFinite(s)) return null;
    var n0 = gr.nenn0, n1 = gr.nenn1;
    var roh = skala(s, g.s0, g.s1, n0, n1);
    var lage = 'nenn';
    if (roh > ROH.ueber)      { lage = 'overflow';  roh = ROH.overflow; }
    else if (roh > n1)        { lage = 'ueber'; }
    else if (roh < (g.bipolar ? ROH.unterBip : ROH.unter)) { lage = 'underflow'; roh = ROH.underflow; }
    else if (roh < n0)        { lage = 'unter'; }
    return { roh: Math.round(roh), lage: lage };
  }

  // Rohwert -> Signal
  function ausRohwert(roh, id) {
    var g = signal(id), gr = grenzen(id);
    if (!g || !isFinite(roh)) return NaN;
    return skala(roh, gr.nenn0, gr.nenn1, g.s0, g.s1);
  }

  // Rohwert -> physikalischer Messwert, ueber den Nennbereich skaliert
  function ausRohMesswert(roh, id, m0, m1) {
    var gr = grenzen(id);
    if (!gr || !isFinite(roh)) return NaN;
    return skala(roh, gr.nenn0, gr.nenn1, m0, m1);
  }

  /* ---------- Pt100 / Pt1000 ----------
     R(t) = R0 (1 + A t + B t^2)                      fuer t >= 0
     R(t) = R0 (1 + A t + B t^2 + C (t - 100) t^3)    fuer t <  0 */
  var CVD = { A: 3.9083e-3, B: -5.775e-7, C: -4.183e-12 };

  function widerstand(t, r0) {
    if (!isFinite(t) || !(r0 > 0) || t < -200 || t > 850) return NaN;
    var p = 1 + CVD.A * t + CVD.B * t * t;
    if (t < 0) p += CVD.C * (t - 100) * t * t * t;
    return r0 * p;
  }

  function temperatur(r, r0) {
    if (!(r > 0) || !(r0 > 0)) return NaN;
    if (r >= r0) {                                   // t >= 0: geschlossen loesbar
      var A = CVD.A, B = CVD.B;
      var w = A * A - 4 * B * (1 - r / r0);
      if (w < 0) return NaN;
      var t = (-A + Math.sqrt(w)) / (2 * B);
      return t > 850 ? NaN : t;
    }
    return suche(function (t) { return widerstand(t, r0); }, r, -200, 0);
  }

  /* Umkehrung durch Halbieren. Beide Kennlinien steigen streng monoton,
     also reicht das und spart einen zweiten Koeffizientensatz. */
  function suche(f, ziel, lo, hi) {
    if (!(f(lo) <= ziel && ziel <= f(hi))) return NaN;
    for (var i = 0; i < 80; i++) {
      var m = (lo + hi) / 2;
      if (f(m) < ziel) lo = m; else hi = m;
    }
    return (lo + hi) / 2;
  }

  /* ---------- Thermoelemente ----------
     E in mV bei Vergleichsstelle 0 Grad, Polynome nach NIST ITS-90.
     Typ K hat ueber null zusaetzlich einen Exponentialterm. */
  var THERMO = {
    K: {
      name: 'Typ K', paar: 'NiCr-Ni', von: -270, bis: 1372,
      neg: [0, 3.9450128025e-2, 2.3622373598e-5, -3.2858906784e-7, -4.9904828777e-9,
            -6.7509059173e-11, -5.7410327428e-13, -3.1088872894e-15, -1.0451609365e-17,
            -1.9889266878e-20, -1.6322697486e-23],
      pos: [-1.7600413686e-2, 3.8921204975e-2, 1.8558770032e-5, -9.9457592874e-8,
            3.1840945719e-10, -5.6072844889e-13, 5.6075059059e-16, -3.2020720003e-19,
            9.7151147152e-23, -1.2104721275e-26],
      exp: { a0: 1.185976e-1, a1: -1.183432e-4, a2: 1.269686e2 }
    },
    J: {
      name: 'Typ J', paar: 'Fe-CuNi', von: -210, bis: 760,
      neg: [0, 5.0381187815e-2, 3.0475836930e-5, -8.5681065720e-8, 1.3228195295e-10,
            -1.7052958337e-13, 2.0948090697e-16, -1.2538395336e-19, 1.5631725697e-23],
      pos: null                                  // unter und ueber null dasselbe Polynom
    },
    T: {
      name: 'Typ T', paar: 'Cu-CuNi', von: -270, bis: 400,
      neg: [0, 3.8748106364e-2, 4.4194434347e-5, 1.1844323105e-7, 2.0032973554e-8,
            9.0138019559e-10, 2.2651156593e-11, 3.6071154205e-13, 3.8493939883e-15,
            2.8213521925e-17, 1.4251594779e-19, 4.8768662286e-22, 1.0795539270e-24,
            1.3945027062e-27, 7.9795153927e-31],
      pos: [0, 3.8748106364e-2, 3.3292227880e-5, 2.0618243404e-7, -2.1882256846e-9,
            1.0996880928e-11, -3.0815758772e-14, 4.5479135290e-17, -2.7512901673e-20]
    }
  };

  function poly(c, t) {
    var s = 0;
    for (var i = c.length - 1; i >= 0; i--) s = s * t + c[i];
    return s;
  }

  // Thermospannung in mV, Vergleichsstelle bei tv Grad
  function thermoSpannung(typ, t, tv) {
    var e = THERMO[typ];
    if (!e || !isFinite(t)) return NaN;
    if (t < e.von || t > e.bis) return NaN;
    return emk(e, t) - emk(e, isFinite(tv) ? tv : 0);
  }

  function emk(e, t) {
    var c = (t < 0 || !e.pos) ? e.neg : e.pos;
    var mv = poly(c, t);
    if (e.exp && t >= 0) mv += e.exp.a0 * Math.exp(e.exp.a1 * (t - e.exp.a2) * (t - e.exp.a2));
    return mv;
  }

  // Gemessene Spannung in mV -> Temperatur, Vergleichsstelle bei tv Grad
  function thermoTemperatur(typ, mv, tv) {
    var e = THERMO[typ];
    if (!e || !isFinite(mv)) return NaN;
    var ziel = mv + emk(e, isFinite(tv) ? tv : 0);
    return suche(function (t) { return emk(e, t); }, ziel, e.von, e.bis);
  }

  /* ---------- Messabweichung ----------
     v.M. ist ein Prozentsatz vom Messwert, v.E. einer vom Endwert des
     Messbereichs. Datenblaetter nennen oft beides, dann gilt die Summe. */
  function abweichung(ist, soll) {
    if (!isFinite(ist) || !isFinite(soll)) return null;
    var a = ist - soll;
    return { absolut: a, relativ: soll === 0 ? NaN : a / soll };
  }

  function toleranz(messwert, endwert, pVM, pVE) {
    if (!isFinite(messwert)) return null;
    var vm = Math.abs(messwert) * (pVM > 0 ? pVM : 0) / 100;
    var ve = Math.abs(endwert) * (pVE > 0 ? pVE : 0) / 100;
    var band = vm + ve;
    return { band: band, vonMesswert: vm, vonEndwert: ve,
             min: messwert - band, max: messwert + band,
             relativ: messwert === 0 ? NaN : band / Math.abs(messwert) };
  }

  var M = { skala: skala, SIGNALE: SIGNALE, signal: signal,
            ausSignal: ausSignal, zuSignal: zuSignal,
            ROH: ROH, grenzen: grenzen, rohwert: rohwert,
            ausRohwert: ausRohwert, ausRohMesswert: ausRohMesswert,
            CVD: CVD, widerstand: widerstand, temperatur: temperatur,
            THERMO: THERMO, thermoSpannung: thermoSpannung, thermoTemperatur: thermoTemperatur,
            abweichung: abweichung, toleranz: toleranz };

  if (typeof module !== 'undefined' && module.exports) module.exports = M;
  else global.MESS = M;
})(typeof window !== 'undefined' ? window : globalThis);
