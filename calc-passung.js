/* ISO-Passungen nach ISO 286. Rechenkern, laeuft im Browser und unter node.

   Umfang mit Absicht begrenzt auf das System Einheitsbohrung und die
   Bohrungen H, JS, G, F, E, D: damit sind H7/g6, H7/k6, H7/n6, H7/p6 und
   die ueblichen Spielpassungen abgedeckt. Die schweren Pressverbaende r, s,
   t und aufwaerts fehlen, weil ihre Grundabmasse ueber 50 mm in Teilbereiche
   zerfallen — eine halb richtige Tabelle waere hier schlimmer als keine.

   Alle Tabellenwerte in Mikrometer. */
(function (global) {
  'use strict';

  // Obergrenzen der Nennmassbereiche in mm (ueber ... bis einschliesslich)
  var BEREICHE = [3, 6, 10, 18, 30, 50, 80, 120, 180, 250, 315, 400, 500];

  // Grundtoleranzen IT in um
  var IT = {
    5:  [4, 5, 6, 8, 9, 11, 13, 15, 18, 20, 23, 25, 27],
    6:  [6, 8, 9, 11, 13, 16, 19, 22, 25, 29, 32, 36, 40],
    7:  [10, 12, 15, 18, 21, 25, 30, 35, 40, 46, 52, 57, 63],
    8:  [14, 18, 22, 27, 33, 39, 46, 54, 63, 72, 81, 89, 97],
    9:  [25, 30, 36, 43, 52, 62, 74, 87, 100, 115, 130, 140, 155],
    10: [40, 48, 58, 70, 84, 100, 120, 140, 160, 185, 210, 230, 250],
    11: [60, 75, 90, 110, 130, 160, 190, 220, 250, 290, 320, 360, 400],
    12: [100, 120, 150, 180, 210, 250, 300, 350, 400, 460, 520, 570, 630],
    13: [140, 180, 220, 270, 330, 390, 460, 540, 630, 720, 810, 890, 970]
  };

  /* Grundabmasse der Wellen in um.
     a bis h: oberes Abmass es, negativ oder null — die Welle liegt unter Null.
     k bis p: unteres Abmass ei, positiv — die Welle liegt ueber Null. */
  var WELLE_ES = {                     // es, also die obere Grenze
    d: [-20, -30, -40, -50, -65, -80, -100, -120, -145, -170, -190, -210, -230],
    e: [-14, -20, -25, -32, -40, -50, -60, -72, -85, -100, -110, -125, -135],
    f: [-6, -10, -13, -16, -20, -25, -30, -36, -43, -50, -56, -62, -68],
    g: [-2, -4, -5, -6, -7, -9, -10, -12, -14, -15, -17, -18, -20],
    h: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  };
  var WELLE_EI = {                     // ei, also die untere Grenze
    k: [0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5],
    m: [2, 4, 6, 7, 8, 9, 11, 13, 15, 17, 20, 21, 23],
    n: [4, 8, 10, 12, 15, 17, 20, 23, 27, 31, 34, 37, 40],
    p: [6, 12, 15, 18, 22, 26, 32, 37, 43, 50, 56, 62, 68]
  };

  /* Bohrungen sind die Spiegelung: H hat EI = 0, G/F/E/D liegen um denselben
     Betrag ueber Null, um den die gleichnamige Welle darunter liegt. */
  var BOHRUNG_EI = { H: 'h', G: 'g', F: 'f', E: 'e', D: 'd' };

  function bereich(d) {
    if (!(d > 0) || d > 500) return -1;
    for (var i = 0; i < BEREICHE.length; i++) if (d <= BEREICHE[i]) return i;
    return -1;
  }

  function toleranz(d, grad) {
    var i = bereich(d);
    return (i < 0 || !IT[grad]) ? NaN : IT[grad][i];
  }

  /* "H7" oder "g6" zerlegen. Grossbuchstabe = Bohrung, klein = Welle. */
  function zerlege(s) {
    var m = /^([A-Za-z]{1,2})\s*(\d{1,2})$/.exec(String(s || '').trim());
    if (!m) return null;
    var buchst = m[1], grad = parseInt(m[2], 10);
    var bohrung = buchst === buchst.toUpperCase();
    return { buchstabe: bohrung ? buchst.toUpperCase() : buchst.toLowerCase(),
             grad: grad, bohrung: bohrung };
  }

  /* Abmasse eines einzelnen Teils in um: { oben, unten }.
     oben = oberes Abmass (ES bzw. es), unten = unteres (EI bzw. ei). */
  function abmasse(d, bez) {
    var t = typeof bez === 'string' ? zerlege(bez) : bez;
    var i = bereich(d);
    if (!t || i < 0) return null;
    var it = IT[t.grad] ? IT[t.grad][i] : NaN;
    if (!isFinite(it)) return null;
    var b = t.buchstabe;

    if (b.toLowerCase() === 'js') return { oben: it / 2, unten: -it / 2, it: it };

    if (t.bohrung) {
      var quelle = BOHRUNG_EI[b];
      if (!quelle) return null;
      var ei = -WELLE_ES[quelle][i];          // Spiegelung der gleichnamigen Welle
      return { oben: ei + it, unten: ei, it: it };
    }
    if (WELLE_ES[b]) {
      var es = WELLE_ES[b][i];
      return { oben: es, unten: es - it, it: it };
    }
    if (WELLE_EI[b]) {
      // k hat nur in den Graden 4 bis 7 ein Abmass ueber Null
      var eiw = (b === 'k' && (t.grad < 4 || t.grad > 7)) ? 0 : WELLE_EI[b][i];
      return { oben: eiw + it, unten: eiw, it: it };
    }
    return null;
  }

  /* Paarung Bohrung/Welle. Spiel positiv, Uebermass negativ — beides in um. */
  function passung(d, bohrung, welle) {
    var B = abmasse(d, bohrung), W = abmasse(d, welle);
    if (!B || !W) return null;
    var hoechst = B.oben - W.unten;         // groesstes Spiel
    var mindest = B.unten - W.oben;         // kleinstes Spiel, negativ = Uebermass
    var art = mindest >= 0 ? 'Spielpassung'
            : (hoechst > 0 ? 'Übergangspassung' : 'Übermaßpassung');
    return {
      d: d, bohrung: B, welle: W,
      hoechstspiel: hoechst, mindestspiel: mindest,
      passtoleranz: hoechst - mindest,       // = IT Bohrung + IT Welle
      art: art
    };
  }

  function istBekannt(bez) {
    var t = zerlege(bez);
    if (!t || !IT[t.grad]) return false;
    if (t.buchstabe.toLowerCase() === 'js') return true;
    return t.bohrung ? !!BOHRUNG_EI[t.buchstabe]
                     : !!(WELLE_ES[t.buchstabe] || WELLE_EI[t.buchstabe]);
  }

  var P = { BEREICHE: BEREICHE, IT: IT, WELLE_ES: WELLE_ES, WELLE_EI: WELLE_EI,
            bereich: bereich, toleranz: toleranz, zerlege: zerlege,
            abmasse: abmasse, passung: passung, istBekannt: istBekannt,
            BOHRUNGEN: ['H', 'JS', 'G', 'F', 'E', 'D'],
            WELLEN: ['h', 'js', 'g', 'f', 'e', 'd', 'k', 'm', 'n', 'p'] };

  if (typeof module !== 'undefined' && module.exports) module.exports = P;
  else global.PASS = P;
})(typeof window !== 'undefined' ? window : globalThis);
