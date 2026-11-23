/* Leitung, Absicherung und Drehstrom: Rechenkern.
   Laeuft im Browser und unter node (test-elektro.js).

   Einheiten: Strom in A, Spannung in V, Laenge in m (einfache Strecke, nicht
   hin und zurueck), Querschnitt in mm2, Leistung in W, Frequenz in Hz,
   Kapazitaet wird in Mikrofarad ausgegeben.

   Quellen:
   - Strombelastbarkeit: DIN VDE 0298-4 Tabelle 2 (Ausgabe 2003; entspricht
     IEC 60364-5-52 Tabelle B.52.4), Kupfer, PVC-isoliert, Betriebstemperatur
     70 Grad, Bezugs-Umgebungstemperatur 30 Grad
   - Umrechnung Umgebungstemperatur: DIN VDE 0298-4 Tabelle 5, Spalte 70 Grad
   - Haeufung mehrerer Stromkreise: DIN VDE 0298-4 Tabelle 6, Zeile gebuendelt
   - Spannungsfall: ohmsche Naeherung ueber die Leitfaehigkeit, so wie es die
     Tabellenbuecher rechnen. Zwei Dinge fehlen darin, beide in dieselbe
     Richtung: der induktive Anteil (ab etwa 25 mm2 spuerbar, bei 120 mm2
     fast ein Drittel) und die Erwaermung des Leiters, denn DIN VDE 0100-520
     Anhang G rechnet mit dem Warmwert 0,0225 Ohm*mm2/m statt mit Kappa 56.
     Das Ergebnis faellt damit zu guenstig aus. Fuer die Pruefung ist es die
     richtige Rechnung, fuer eine echte Anlage die optimistische.
   - Schutz bei Ueberlast: DIN VDE 0100-430, Bedingung Ib <= In <= Iz
   - Ausloesebereiche B/C/D: DIN EN 60898-1

   Bewusst nicht gerechnet: Kurzschlussfestigkeit, Abschaltbedingung ueber die
   Schleifenimpedanz und Selektivitaet. Das sind eigene Nachweise, die mehr
   brauchen als die Angaben auf dieser Seite. */
(function (global) {
  'use strict';

  function rund(x, stellen) {
    var f = Math.pow(10, stellen === undefined ? 3 : stellen);
    return Math.round(x * f) / f;
  }

  var WURZEL3 = Math.sqrt(3);

  /* Leitfaehigkeit bei 20 Grad in m/(Ohm*mm2). Warm gerechnet waere Kupfer
     eher 54; 56 ist der Wert, mit dem die Tabellenbuecher rechnen. */
  var KAPPA = { cu: 56, al: 35 };

  var NORMQUERSCHNITT = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120];

  /* Strombelastbarkeit Iz in A je Verlegeart, fuer zwei und fuer drei belastete
     Adern. Reihenfolge wie NORMQUERSCHNITT. */
  var BELASTBARKEIT = {
    A1: { name: 'A1 — Adern im Rohr in wärmegedämmter Wand',
          zwei: [15.5, 19.5, 26, 34, 46, 61, 80, 99, 119, 151, 182, 210],
          drei: [13.5, 18,   24, 31, 42, 56, 73, 89, 108, 136, 164, 188] },
    /* A2 bei 1,5 mm2 fuehrt DIN VDE 0298-4 mit 15,5 A, aber nur fuer einen
       genau definierten Wandaufbau; IEC 60364-5-52 nennt dort 14 A. 15 ist
       der Mittelweg und liegt auf der sicheren Seite. */
    A2: { name: 'A2 — Mantelleitung im Rohr in wärmegedämmter Wand',
          zwei: [15,   18.5, 25, 32, 43, 57, 75, 92, 110, 139, 167, 192],
          drei: [13,   17.5, 23, 29, 39, 52, 68, 83,  99, 125, 150, 172] },
    B1: { name: 'B1 — Adern im Rohr auf oder in der Wand',
          zwei: [17.5, 24, 32, 41, 57, 76, 101, 125, 151, 192, 232, 269],
          drei: [15.5, 21, 28, 36, 50, 68,  89, 110, 134, 171, 207, 239] },
    B2: { name: 'B2 — Mantelleitung im Rohr auf oder in der Wand',
          zwei: [16.5, 23, 30, 38, 52, 69, 90, 111, 133, 168, 201, 232],
          drei: [15,   20, 27, 34, 46, 62, 80,  99, 118, 149, 179, 206] },
    C:  { name: 'C — direkt auf oder in der Wand, auch unter Putz',
          zwei: [19.5, 27, 36, 46, 63, 85, 112, 138, 168, 213, 258, 299],
          drei: [17.5, 24, 32, 41, 57, 76,  96, 119, 144, 184, 223, 259] },
    E:  { name: 'E — mehradrig frei in Luft, auf Kabelwanne oder Pritsche',
          zwei: [22,   30, 40, 51, 70, 94, 119, 148, 180, 232, 282, 328],
          drei: [18.5, 25, 34, 43, 60, 80, 101, 126, 153, 196, 238, 276] }
  };

  /* Umgebungstemperatur, PVC. Die Norm gibt Baender an ("ueber 35 bis 40 Grad
     ergibt 0,87"), nicht Punkte: 38 Grad fallen in das 40-Grad-Band. Es gilt
     also der naechsthoehere Eintrag, nie der naechstniedrigere. */
  var TEMPFAKTOR = [
    { t: 10, f: 1.22 }, { t: 15, f: 1.17 }, { t: 20, f: 1.12 }, { t: 25, f: 1.06 },
    { t: 30, f: 1.00 }, { t: 35, f: 0.94 }, { t: 40, f: 0.87 }, { t: 45, f: 0.79 },
    { t: 50, f: 0.71 }, { t: 55, f: 0.61 }, { t: 60, f: 0.50 }, { t: 65, f: 0.35 }
  ];

  // Mehrere Stromkreise gebuendelt nebeneinander. Auch hier gilt der
  // naechsthoehere Eintrag: elf Kreise werden wie zwoelf gerechnet.
  var HAEUFUNG = [
    { n: 1, f: 1.00 }, { n: 2, f: 0.80 }, { n: 3, f: 0.70 }, { n: 4, f: 0.65 },
    { n: 5, f: 0.60 }, { n: 6, f: 0.57 }, { n: 7, f: 0.54 }, { n: 8, f: 0.52 },
    { n: 9, f: 0.50 }, { n: 10, f: 0.48 }, { n: 12, f: 0.45 }, { n: 14, f: 0.43 },
    { n: 16, f: 0.41 }, { n: 18, f: 0.39 }, { n: 20, f: 0.38 }
  ];

  function tempfaktor(t) {
    if (!isFinite(t)) return NaN;
    if (t <= 10) return TEMPFAKTOR[0].f;
    for (var i = 0; i < TEMPFAKTOR.length; i++) {
      if (t <= TEMPFAKTOR[i].t) return TEMPFAKTOR[i].f;
    }
    return NaN;                             // ueber 65 Grad hoert die Tafel auf
  }

  function haeufungsfaktor(n) {
    if (!(n >= 1)) return NaN;
    for (var i = 0; i < HAEUFUNG.length; i++) {
      if (n <= HAEUFUNG[i].n) return HAEUFUNG[i].f;
    }
    return HAEUFUNG[HAEUFUNG.length - 1].f; // ueber 20 Kreise bleibt es bei 0,38
  }

  /* Belastbarkeit eines Querschnitts unter den tatsaechlichen Bedingungen.
     adern ist 2 oder 3 (belastete Adern), temp die Umgebungstemperatur,
     kreise die Zahl gebuendelter Stromkreise. */
  function belastbarkeit(A, art, adern, temp, kreise) {
    var tab = BELASTBARKEIT[art];
    if (!tab) return NaN;
    var i = NORMQUERSCHNITT.indexOf(A);
    if (i < 0) return NaN;
    var grund = (adern === 3 ? tab.drei : tab.zwei)[i];
    var ft = tempfaktor(temp === undefined ? 30 : temp);
    var fh = haeufungsfaktor(kreise === undefined ? 1 : kreise);
    if (!isFinite(grund) || !isFinite(ft) || !isFinite(fh)) return NaN;
    return grund * ft * fh;
  }

  /* ---------- Spannungsfall ----------
     phasen: 1 fuer Wechselstrom (Hin- und Rueckleiter), 3 fuer Drehstrom,
     0 fuer Gleichstrom. laenge ist die einfache Strecke. */
  function fallfaktor(phasen) {
    if (phasen === 3) return WURZEL3;
    if (phasen === 1 || phasen === 0) return 2;
    return NaN;
  }

  function spannungsfall(I, laenge, A, phasen, cosphi, werkstoff) {
    var k = fallfaktor(phasen);
    var kappa = KAPPA[werkstoff || 'cu'];
    var c = phasen === 0 ? 1 : (cosphi === undefined ? 1 : cosphi);
    if (!(I > 0) || !(laenge > 0) || !(A > 0) || !isFinite(k) || !kappa) return NaN;
    if (!(c > 0) || c > 1) return NaN;
    return k * laenge * I * c / (kappa * A);
  }

  function spannungsfallProzent(I, laenge, A, U, phasen, cosphi, werkstoff) {
    var dU = spannungsfall(I, laenge, A, phasen, cosphi, werkstoff);
    if (!isFinite(dU) || !(U > 0)) return NaN;
    return dU / U * 100;
  }

  /* Kleinster Querschnitt, der den zulaessigen Spannungsfall einhaelt —
     noch nicht auf die Normreihe gerundet. */
  function querschnittFuerFall(I, laenge, U, prozent, phasen, cosphi, werkstoff) {
    var k = fallfaktor(phasen);
    var kappa = KAPPA[werkstoff || 'cu'];
    var c = phasen === 0 ? 1 : (cosphi === undefined ? 1 : cosphi);
    if (!(I > 0) || !(laenge > 0) || !(U > 0) || !(prozent > 0)) return NaN;
    if (!isFinite(k) || !kappa || !(c > 0) || c > 1) return NaN;
    return k * laenge * I * c / (kappa * U * prozent / 100);
  }

  function naechsterNormquerschnitt(A) {
    for (var i = 0; i < NORMQUERSCHNITT.length; i++) {
      if (NORMQUERSCHNITT[i] >= A - 1e-9) return NORMQUERSCHNITT[i];
    }
    return NaN;                             // ueber 120 mm2 hoert die Tafel auf
  }

  /* ---------- Absicherung ----------
     Normreihen und die Bedingung Ib <= In <= Iz aus DIN VDE 0100-430. */
  var LS_SCHALTER = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63];
  var SCHMELZ = [2, 4, 6, 10, 16, 20, 25, 35, 50, 63];
  var KENNLINIE = {
    B: { von: 3,  bis: 5,  was: 'Leitungen, allgemeine Verbraucher' },
    C: { von: 5,  bis: 10, was: 'Motoren, Trafos, Leuchten mit Vorschaltgerät' },
    D: { von: 10, bis: 20, was: 'hohe Einschaltströme, z. B. Schweißgeräte' }
  };

  /* Groesster Nennstrom, der ueber dem Betriebsstrom und unter der
     Belastbarkeit liegt. Gibt null, wenn die Leitung zu duenn ist.

     Neben Ib <= In <= Iz fordert DIN VDE 0100-430 auch I2 <= 1,45 * Iz, mit I2
     als grossem Pruefstrom. Beim LS-Schalter nach DIN EN 60898-1 ist I2 genau
     1,45 * In, damit ist die zweite Bedingung automatisch erfuellt. Die gG-
     Schmelzsicherung loest erst bei 1,6 * In aus, dort bleibt nur
     In <= Iz / 1,1. */
  function sicherungFuer(Ib, Iz, reihe) {
    var schmelz = reihe === 'schmelz';
    var r = schmelz ? SCHMELZ : LS_SCHALTER;
    var grenze = schmelz ? Iz / 1.1 : Iz;
    if (!(Ib > 0) || !(Iz > 0)) return null;
    var treffer = null;
    for (var i = 0; i < r.length; i++) {
      if (r[i] >= Ib && r[i] <= grenze) treffer = r[i];
    }
    return treffer;
  }

  function ausloesebereich(In, buchstabe) {
    var k = KENNLINIE[buchstabe];
    if (!k || !(In > 0)) return null;
    return { von: In * k.von, bis: In * k.bis, was: k.was };
  }

  /* Leitung auslegen: nimmt den dickeren der beiden Querschnitte, den die
     Belastbarkeit und den der Spannungsfall verlangt. */
  function leitungAuslegen(Ib, laenge, U, prozent, phasen, cosphi, art, temp, kreise, werkstoff, reihe) {
    var adern = phasen === 3 ? 3 : 2;
    var ausFall = naechsterNormquerschnitt(
      querschnittFuerFall(Ib, laenge, U, prozent, phasen, cosphi, werkstoff));
    var ausStrom = NaN;
    for (var i = 0; i < NORMQUERSCHNITT.length; i++) {
      if (belastbarkeit(NORMQUERSCHNITT[i], art, adern, temp, kreise) >= Ib) {
        ausStrom = NORMQUERSCHNITT[i];
        break;
      }
    }
    if (!isFinite(ausFall) || !isFinite(ausStrom)) return null;
    var A = Math.max(ausFall, ausStrom);
    var Iz = belastbarkeit(A, art, adern, temp, kreise);
    return {
      A: A,
      ausStrom: ausStrom,
      ausFall: ausFall,
      massgebend: ausFall > ausStrom ? 'Spannungsfall' : 'Strombelastbarkeit',
      Iz: Iz,
      fall: spannungsfall(Ib, laenge, A, phasen, cosphi, werkstoff),
      fallProzent: spannungsfallProzent(Ib, laenge, A, U, phasen, cosphi, werkstoff),
      sicherung: sicherungFuer(Ib, Iz, reihe)
    };
  }

  /* ---------- Drehstrom ----------
     Im Stern liegt an jedem Strang die Spannung durch Wurzel 3, durch ihn
     fliesst der volle Aussenleiterstrom. Im Dreieck ist es andersherum. */
  function stern(U_aussen, I_aussen) {
    return { U_strang: U_aussen / WURZEL3, I_strang: I_aussen };
  }
  function dreieck(U_aussen, I_aussen) {
    return { U_strang: U_aussen, I_strang: I_aussen / WURZEL3 };
  }

  function leistungDrehstrom(U, I, cosphi) {
    if (!(U > 0) || !(I > 0)) return NaN;
    var c = cosphi === undefined ? 1 : cosphi;
    if (!(c > 0) || c > 1) return NaN;
    return WURZEL3 * U * I * c;             // Wirkleistung P in W
  }
  function scheinleistung(U, I) {
    if (!(U > 0) || !(I > 0)) return NaN;
    return WURZEL3 * U * I;                 // S in VA
  }
  function blindleistung(S, P) {
    if (!(S > 0) || !(P >= 0) || P > S) return NaN;
    return Math.sqrt(S * S - P * P);        // Q in var
  }

  /* Nennstrom aus dem Typenschild. P ist die abgegebene Wellenleistung,
     der Wirkungsgrad macht daraus die aufgenommene Leistung. */
  function motorstrom(P_ab, U, cosphi, eta) {
    if (!(P_ab > 0) || !(U > 0)) return NaN;
    var c = cosphi > 1 ? cosphi / 100 : cosphi;
    var e = eta === undefined ? 1 : (eta > 1 ? eta / 100 : eta);
    if (!(c > 0) || c > 1 || !(e > 0) || e > 1) return NaN;
    return P_ab / (WURZEL3 * U * c * e);
  }

  function anlaufstrom(I_n, faktor) {
    if (!(I_n > 0)) return NaN;
    var f = faktor === undefined ? 6 : faktor;
    if (!(f >= 1)) return NaN;
    return I_n * f;
  }

  /* Stern-Dreieck-Anlauf: im Stern liegt an jedem Strang nur die Spannung
     durch Wurzel 3, dadurch sinken Strom und Moment auf ein Drittel. */
  function sternDreieckAnlauf(I_anlauf_direkt, M_nenn) {
    if (!(I_anlauf_direkt > 0)) return null;
    return {
      I_stern: I_anlauf_direkt / 3,
      anteil: 1 / 3,
      M_stern: isFinite(M_nenn) && M_nenn > 0 ? M_nenn / 3 : NaN
    };
  }

  /* Blindleistungskompensation: von cos phi 1 auf cos phi 2.
     Die Kondensatoren haengen ueblicherweise im Dreieck an den Aussenleitern. */
  function kompensation(P, cos1, cos2, U, f) {
    if (!(P > 0) || !(cos1 > 0) || cos1 > 1 || !(cos2 > 0) || cos2 > 1) return null;
    if (cos2 <= cos1) return null;          // verschlechtern ist keine Kompensation
    var tan = function (c) { return Math.tan(Math.acos(c)); };
    var Qc = P * (tan(cos1) - tan(cos2));   // var
    var erg = { Qc: Qc };
    if (U > 0 && f > 0) {
      var w = 2 * Math.PI * f;
      erg.C_dreieck = Qc / (3 * w * U * U) * 1e6;   // Mikrofarad je Kondensator
      erg.C_stern = Qc / (w * U * U) * 1e6;
    }
    return erg;
  }

  var E = { rund: rund, WURZEL3: WURZEL3, KAPPA: KAPPA,
            NORMQUERSCHNITT: NORMQUERSCHNITT, BELASTBARKEIT: BELASTBARKEIT,
            TEMPFAKTOR: TEMPFAKTOR, HAEUFUNG: HAEUFUNG,
            LS_SCHALTER: LS_SCHALTER, SCHMELZ: SCHMELZ, KENNLINIE: KENNLINIE,
            tempfaktor: tempfaktor, haeufungsfaktor: haeufungsfaktor,
            belastbarkeit: belastbarkeit,
            spannungsfall: spannungsfall, spannungsfallProzent: spannungsfallProzent,
            querschnittFuerFall: querschnittFuerFall,
            naechsterNormquerschnitt: naechsterNormquerschnitt,
            sicherungFuer: sicherungFuer, ausloesebereich: ausloesebereich,
            leitungAuslegen: leitungAuslegen,
            stern: stern, dreieck: dreieck,
            leistungDrehstrom: leistungDrehstrom, scheinleistung: scheinleistung,
            blindleistung: blindleistung, motorstrom: motorstrom,
            anlaufstrom: anlaufstrom, sternDreieckAnlauf: sternDreieckAnlauf,
            kompensation: kompensation };

  if (typeof module !== 'undefined' && module.exports) module.exports = E;
  else global.ELEKTRO = E;
})(typeof window !== 'undefined' ? window : globalThis);
