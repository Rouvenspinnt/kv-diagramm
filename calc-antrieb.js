/* Antrieb und Mechanik: Rechenkern.
   Laeuft im Browser und unter node (test-antrieb.js).

   Einheiten durchgehend: n in 1/min, M in Nm, P in W, F in N, l in mm,
   A in mm2, Spannung in N/mm2 (= MPa). Umgerechnet wird nur an den Raendern.

   Quellen der Tabellen:
   - Werkstoffkennwerte: ueblicher Tabellenbuchstand, Rp0,2 und Rm in N/mm2
   - Anzugsmomente: VDI 2230 Tabelle A1, Spalte Gesamtreibungszahl 0,14, bei
     90 Prozent Ausnutzung der Streckgrenze. Gilt fuer Schaftschrauben mit
     metrischem Regelgewinde, Sechskant nach ISO 4014..4018 oder Zylinderkopf
     nach ISO 4762, Durchgangsloch "mittel". Fuer Flansch- und Senkschrauben
     gilt sie nicht. Veroeffentlichte Tabellen streuen um rund 10 Prozent. */
(function (global) {
  'use strict';

  function rund(x, stellen) {
    var f = Math.pow(10, stellen === undefined ? 3 : stellen);
    return Math.round(x * f) / f;
  }

  /* ---------- Drehmoment, Drehzahl, Leistung ----------
     P = M * omega, omega = 2*pi*n/60. Zwei Groessen geben die dritte. */
  function winkelgeschwindigkeit(n) {
    return !(n > 0) ? NaN : 2 * Math.PI * n / 60;
  }
  function leistung(M, n) {
    if (!(M > 0) || !(n > 0)) return NaN;
    return M * winkelgeschwindigkeit(n);
  }
  function moment(P, n) {
    if (!(P > 0) || !(n > 0)) return NaN;
    return P / winkelgeschwindigkeit(n);
  }
  function drehzahlAus(P, M) {
    if (!(P > 0) || !(M > 0)) return NaN;
    return P / M * 60 / (2 * Math.PI);
  }
  // Was hinten herauskommt, wenn der Antrieb nicht verlustfrei ist
  function ab(P, eta) {
    if (!(P > 0) || !(eta > 0)) return NaN;
    var e = eta > 1 ? eta / 100 : eta;
    return e > 1 ? NaN : P * e;          // mehr als 100 Prozent gibt es nicht
  }

  /* ---------- Asynchronmotor ----------
     Die Synchrondrehzahl haengt nur an Frequenz und Polpaarzahl. Der Laeufer
     bleibt um den Schlupf zurueck, sonst entstuende kein Moment. */
  function synchrondrehzahl(f, p) {
    if (!(f > 0) || !(p > 0)) return NaN;
    return 60 * f / p;
  }
  function schlupf(nsyn, n) {
    if (!(nsyn > 0) || !isFinite(n)) return NaN;
    return (nsyn - n) / nsyn;
  }
  function laeuferdrehzahl(nsyn, s) {
    if (!(nsyn > 0) || !isFinite(s)) return NaN;
    return nsyn * (1 - (Math.abs(s) > 1 ? s / 100 : s));
  }
  /* Vom Typenschild zur Polpaarzahl: die naechstliegende Stufe. Gerundet statt
     aufgerundet, damit auch eine uebersynchrone Drehzahl (Generatorbetrieb)
     noch die richtige Polzahl trifft. */
  function polpaare(f, n) {
    if (!(f > 0) || !(n > 0)) return NaN;
    var p = Math.round(60 * f / n);
    return p < 1 ? 1 : p;
  }
  // Umrichterbetrieb: unterhalb der Nennfrequenz bleibt U/f und damit das
  // Moment konstant, darueber faellt das Moment mit 1/f ab (Feldschwaechung).
  function umrichter(fNeu, fNenn, MNenn) {
    if (!(fNeu > 0) || !(fNenn > 0) || !(MNenn > 0)) return NaN;
    return fNeu <= fNenn ? MNenn : MNenn * fNenn / fNeu;
  }

  /* ---------- Getriebe ----------
     i = n_an / n_ab = z_ab / z_an. Groesser als 1 heisst ins Langsame. */
  function uebersetzung(nAn, nAb) {
    if (!(nAn > 0) || !(nAb > 0)) return NaN;
    return nAn / nAb;
  }
  function stufen(liste) {                       // mehrstufig: Produkt der Stufen
    if (!liste || !liste.length) return NaN;
    var i = 1;
    for (var k = 0; k < liste.length; k++) {
      if (!(liste[k] > 0)) return NaN;
      i *= liste[k];
    }
    return i;
  }
  function abtriebsdrehzahl(nAn, i) {
    if (!(nAn > 0) || !(i > 0)) return NaN;
    return nAn / i;
  }
  function abtriebsmoment(MAn, i, eta) {
    if (!(MAn > 0) || !(i > 0)) return NaN;
    var e = eta === undefined ? 1 : (eta > 1 ? eta / 100 : eta);
    return MAn * i * e;
  }

  /* ---------- Hebel ----------
     Gleichgewicht: F1 * l1 = F2 * l2. Das gilt fuer den einseitigen wie fuer
     den zweiseitigen Hebel; beim einseitigen liegen nur beide Kraefte auf
     derselben Seite des Drehpunkts. */
  function hebel(F1, l1, F2, l2) {
    var fehlt = [F1, l1, F2, l2].filter(function (x) { return !(x > 0); }).length;
    if (fehlt !== 1) return null;
    if (!(F1 > 0)) F1 = F2 * l2 / l1;
    else if (!(l1 > 0)) l1 = F2 * l2 / F1;
    else if (!(F2 > 0)) F2 = F1 * l1 / l2;
    else l2 = F1 * l1 / F2;
    return { F1: F1, l1: l1, F2: F2, l2: l2, M: F1 * l1 / 1000 };   // M in Nm
  }

  /* ---------- Flaeche, Spannung, Sicherheit ---------- */
  function kreis(d) { return !(d > 0) ? NaN : Math.PI * d * d / 4; }
  function ring(da, di) {
    if (!(da > 0) || !(di >= 0) || di >= da) return NaN;
    return Math.PI * (da * da - di * di) / 4;
  }
  function rechteck(a, b) { return !(a > 0) || !(b > 0) ? NaN : a * b; }

  // sigma in N/mm2 aus F in N und A in mm2
  function spannung(F, A) {
    if (!(F > 0) || !(A > 0)) return NaN;
    return F / A;
  }
  function sicherheit(grenze, sigma) {
    if (!(grenze > 0) || !(sigma > 0)) return NaN;
    return grenze / sigma;
  }
  function tragkraft(grenze, A, nu) {
    if (!(grenze > 0) || !(A > 0) || !(nu > 0)) return NaN;
    return grenze * A / nu;
  }

  /* Rp0,2 und Rm in N/mm2. Der Zustand gehoert zum Wert: dieselbe Legierung
     liegt weich und ausgehaertet um ein Mehrfaches auseinander, und bei Stahl
     faellt die Streckgrenze mit der Erzeugnisdicke.
     sproede: kein ausgepraegtes Fliessen. Dort ist Rm die Bezugsgroesse und
     es gehoeren deutlich groessere Sicherheiten dazu. */
  var WERKSTOFF = [
    { name: 'S235JR (t ≤ 16 mm)',        rp: 235, rm: 360 },
    { name: 'E295 (t ≤ 16 mm)',          rp: 295, rm: 470 },
    { name: 'E335 (t ≤ 16 mm)',          rp: 335, rm: 570 },
    { name: 'C45 +QT (d ≤ 16 mm)',       rp: 490, rm: 700 },
    { name: '42CrMo4 +QT (d ≤ 16 mm)',   rp: 900, rm: 1100 },
    { name: '42CrMo4 +QT (d 40–100 mm)', rp: 650, rm: 900 },
    { name: '16MnCr5 einsatzgehärtet, Kern', rp: 590, rm: 780 },
    { name: 'X5CrNi18-10 (V2A, Stab)',   rp: 190, rm: 500 },
    { name: 'EN AW-6060 T66',            rp: 160, rm: 215 },
    { name: 'EN AW-6060 T4',             rp: 60,  rm: 120 },
    { name: 'EN AW-7075 T6',             rp: 485, rm: 540 },
    { name: 'EN-GJL-250 (Grauguss)',     rp: 165, rm: 250, sproede: true },
    { name: 'EN-GJS-400-15 (Sphäroguss)', rp: 250, rm: 400 }
  ];

  /* ---------- Schraubenanzugsmoment ----------
     Richtwerte MA in Nm fuer metrisches Regelgewinde, Gesamtreibungszahl 0,14,
     90 Prozent Ausnutzung der Streckgrenze. Reibung ist hier die groesste
     Unsicherheit: geoelt zieht dieselbe Schraube bei kleinerem Moment weiter an. */
  var ANZUG = [
    { d: 4,  k88: 3.3,   k109: 4.8,   k129: 5.6 },
    { d: 5,  k88: 6.5,   k109: 9.5,   k129: 11.2 },
    { d: 6,  k88: 11.3,  k109: 16.5,  k129: 19.3 },
    { d: 8,  k88: 27.3,  k109: 40.1,  k129: 46.9 },
    { d: 10, k88: 54,    k109: 79,    k129: 93 },
    { d: 12, k88: 93,    k109: 137,   k129: 160 },
    { d: 14, k88: 148,   k109: 218,   k129: 255 },
    { d: 16, k88: 230,   k109: 338,   k129: 395 },
    { d: 18, k88: 329,   k109: 469,   k129: 549 },
    { d: 20, k88: 464,   k109: 661,   k129: 773 },
    { d: 22, k88: 634,   k109: 904,   k129: 1057 },
    { d: 24, k88: 798,   k109: 1136,  k129: 1329 },
    { d: 27, k88: 1176,  k109: 1674,  k129: 1959 },
    { d: 30, k88: 1597,  k109: 2274,  k129: 2662 }
  ];
  // M3 fehlt mit Absicht: VDI 2230 Tabelle A1 faengt bei M4 an, und fuer M3
  // ist mir kein belegter Wert bei 0,14 bekannt. Lieber keine Zahl als eine
  // geschaetzte, nach der jemand anzieht.
  var KLASSEN = ['8.8', '10.9', '12.9'];

  function anzugsmoment(d, klasse) {
    var e = null;
    for (var i = 0; i < ANZUG.length; i++) if (Math.abs(ANZUG[i].d - d) < 1e-9) e = ANZUG[i];
    if (!e) return NaN;
    return klasse === '8.8' ? e.k88 : klasse === '10.9' ? e.k109 : klasse === '12.9' ? e.k129 : NaN;
  }

  /* Reibung anders als 0,14. Rund 87 Prozent des Anzugsmoments stecken in
     Gewinde- und Kopfreibung, der Rest im Steigungsanteil. Trotzdem waere eine
     Gerade mit 87 Prozent zu steil: mit der Reibung waechst auch die Torsion
     im Gewinde, und damit sinkt die zulaessige Vorspannkraft. Der Konstant-
     anteil von 0,33 ist an die Reibungsspalten der VDI-Tabelle angepasst und
     bleibt zwischen 0,10 und 0,20 unter rund 5 Prozent Fehler.
     Eine Naeherung, kein Ersatz fuer eine Rechnung nach VDI 2230. */
  function anzugMitReibung(MA, mu) {
    if (!(MA > 0) || !(mu >= 0.06) || mu > 0.3) return NaN;
    return MA * (0.33 + 0.67 * mu / 0.14);
  }

  var A = { rund: rund,
            winkelgeschwindigkeit: winkelgeschwindigkeit, leistung: leistung,
            moment: moment, drehzahlAus: drehzahlAus, ab: ab,
            synchrondrehzahl: synchrondrehzahl, schlupf: schlupf,
            laeuferdrehzahl: laeuferdrehzahl, polpaare: polpaare, umrichter: umrichter,
            uebersetzung: uebersetzung, stufen: stufen,
            abtriebsdrehzahl: abtriebsdrehzahl, abtriebsmoment: abtriebsmoment,
            hebel: hebel,
            kreis: kreis, ring: ring, rechteck: rechteck,
            spannung: spannung, sicherheit: sicherheit, tragkraft: tragkraft,
            WERKSTOFF: WERKSTOFF,
            ANZUG: ANZUG, KLASSEN: KLASSEN,
            anzugsmoment: anzugsmoment, anzugMitReibung: anzugMitReibung };

  if (typeof module !== 'undefined' && module.exports) module.exports = A;
  else global.ANTR = A;
})(typeof window !== 'undefined' ? window : globalThis);
