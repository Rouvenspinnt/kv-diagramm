/* Kondensator, Spule, Transformator und Netzteil: Rechenkern.
   Laeuft im Browser und unter node (test-bauteile.js).

   Einheiten: hier wird durchgehend in Basiseinheiten gerechnet — Ohm, Farad,
   Henry, Sekunde, Volt, Ampere, Hertz. Die Seiten rechnen Mikrofarad und
   Millihenry vorher um. Bei Exponentialfunktionen ist das weniger fehleranfaellig,
   als Vorsaetze durch die Formeln zu schleppen.

   Quellen: Grundformeln der Elektrotechnik.
   - Zeitkonstante tau = R*C beim RC-Glied, tau = L/R beim RL-Glied
   - Ladekurve u(t) = U * (1 - e^(-t/tau)), Entladung u(t) = U * e^(-t/tau)
   - Energie W = 1/2 * C * U^2 im Kondensator, W = 1/2 * L * I^2 in der Spule
   - Transformator: N1/N2 = U1/U2 = I2/I1 (ideal), Verluste ueber den Wirkungsgrad
   - Brummspannung am Ladekondensator: U_br = I / (f_br * C), die uebliche
     Naeherung ueber die lineare Entladung zwischen zwei Scheiteln

   Bewusst nicht gerechnet: der Innenwiderstand des Trafos und damit der
   Spannungseinbruch unter Last, der Stromflusswinkel am Ladekondensator und
   der daraus folgende hohe Spitzenstrom. Beides macht reale Netzteile
   schlechter, als diese Rechnung sie aussehen laesst. */
(function (global) {
  'use strict';

  function rund(x, stellen) {
    var f = Math.pow(10, stellen === undefined ? 6 : stellen);
    return Math.round(x * f) / f;
  }

  /* ---------- RC-Glied ---------- */
  function tauRC(R, C) {
    if (!(R > 0) || !(C > 0)) return NaN;
    return R * C;                           // Sekunden
  }

  /* Spannung am Kondensator nach der Zeit t.
     laden = true: von 0 auf U. laden = false: von U auf 0. */
  function spannungNachZeit(U, tau, t, laden) {
    if (!(U > 0) || !(tau > 0) || !(t >= 0)) return NaN;
    var anteil = Math.exp(-t / tau);
    return laden === false ? U * anteil : U * (1 - anteil);
  }

  /* Zeit, bis die Spannung einen bestimmten Wert erreicht hat.
     Beim Laden wird U nie ganz erreicht, darum ist u = U nicht rechenbar. */
  function zeitBisSpannung(U, tau, u, laden) {
    if (!(U > 0) || !(tau > 0) || !(u >= 0)) return NaN;
    if (laden === false) {
      if (!(u > 0) || u > U) return NaN;
      return tau * Math.log(U / u);
    }
    if (u >= U) return NaN;                 // asymptotisch, nie ganz erreicht
    return tau * Math.log(U / (U - u));
  }

  // Nach wie vielen Zeitkonstanten ist welcher Anteil erreicht?
  function anteilNachTau(n, laden) {
    if (!(n >= 0)) return NaN;
    var a = Math.exp(-n);
    return laden === false ? a : 1 - a;
  }

  function energieKondensator(C, U) {
    if (!(C > 0) || !(U > 0)) return NaN;
    return 0.5 * C * U * U;                 // Joule
  }
  function ladung(C, U) {
    if (!(C > 0) || !(U > 0)) return NaN;
    return C * U;                           // Coulomb
  }

  /* Wie lange haelt ein Kondensator eine Last, die konstanten Strom zieht?
     Aus Q = C * dU und Q = I * t folgt t = C * dU / I. Gerechnet wird mit
     konstantem Strom — ein echtes Netzteil zieht bei sinkender Spannung mehr,
     die Pufferzeit faellt in der Praxis also etwas kuerzer aus. */
  function pufferzeit(C, dU, I) {
    if (!(C > 0) || !(dU > 0) || !(I > 0)) return NaN;
    return C * dU / I;                      // Sekunden
  }

  /* ---------- RL-Glied ---------- */
  function tauRL(L, R) {
    if (!(L > 0) || !(R > 0)) return NaN;
    return L / R;                           // Sekunden
  }
  function energieSpule(L, I) {
    if (!(L > 0) || !(I > 0)) return NaN;
    return 0.5 * L * I * I;                 // Joule
  }

  /* ---------- Transformator ----------
     Im idealen Trafo verhalten sich Spannungen wie die Windungszahlen und
     Stroeme umgekehrt dazu. Der Wirkungsgrad wirkt nur auf die Leistung. */
  function uebersetzung(a, b) {
    if (!(a > 0) || !(b > 0)) return NaN;
    return a / b;
  }
  function trafo(werte) {
    var N1 = werte.N1, N2 = werte.N2, U1 = werte.U1, U2 = werte.U2;
    var ue = NaN;
    if (N1 > 0 && N2 > 0) ue = N1 / N2;
    else if (U1 > 0 && U2 > 0) ue = U1 / U2;
    if (!(ue > 0)) return null;

    var erg = { ue: ue };
    erg.U1 = U1 > 0 ? U1 : (U2 > 0 ? U2 * ue : NaN);
    erg.U2 = U2 > 0 ? U2 : (U1 > 0 ? U1 / ue : NaN);
    erg.N1 = N1 > 0 ? N1 : (N2 > 0 ? N2 * ue : NaN);
    erg.N2 = N2 > 0 ? N2 : (N1 > 0 ? N1 / ue : NaN);

    var eta = werte.eta === undefined ? 1 : (werte.eta > 1 ? werte.eta / 100 : werte.eta);
    if (!(eta > 0) || eta > 1) return null;
    erg.eta = eta;
    if (werte.I2 > 0) {
      erg.I2 = werte.I2;
      erg.P2 = isFinite(erg.U2) ? erg.U2 * werte.I2 : NaN;
      erg.P1 = isFinite(erg.P2) ? erg.P2 / eta : NaN;
      erg.I1 = isFinite(erg.P1) && isFinite(erg.U1) ? erg.P1 / erg.U1 : NaN;
      erg.verlust = isFinite(erg.P1) ? erg.P1 - erg.P2 : NaN;
    }
    return erg;
  }

  /* ---------- Gleichrichter und Glaettung ----------
     art: 'einweg' oder 'bruecke'. Die Bruecke laedt zweimal je Periode nach,
     darum ist die Brummfrequenz doppelt so hoch und die Brummspannung halb
     so gross. uD ist der Durchlassspannungsabfall je Diode. */
  function gleichrichter(Ueff, art, uD) {
    if (!(Ueff > 0)) return NaN;
    var d = uD === undefined ? 0.7 : uD;
    if (!(d >= 0)) return NaN;
    var ab = art === 'einweg' ? d : 2 * d;
    var U = Ueff * Math.SQRT2 - ab;
    return U > 0 ? U : NaN;                 // unter der Diodenschwelle kommt nichts an
  }

  function brummfrequenz(fNetz, art) {
    if (!(fNetz > 0)) return NaN;
    return art === 'einweg' ? fNetz : 2 * fNetz;
  }

  // Brummspannung bei gegebenem Ladekondensator
  function brummspannung(I, C, fBrumm) {
    if (!(I > 0) || !(C > 0) || !(fBrumm > 0)) return NaN;
    return I / (fBrumm * C);
  }

  // Noetiger Ladekondensator fuer eine zugelassene Brummspannung
  function ladekondensator(I, Ubr, fBrumm) {
    if (!(I > 0) || !(Ubr > 0) || !(fBrumm > 0)) return NaN;
    return I / (fBrumm * Ubr);              // Farad
  }

  var B = { rund: rund,
            tauRC: tauRC, spannungNachZeit: spannungNachZeit,
            zeitBisSpannung: zeitBisSpannung, anteilNachTau: anteilNachTau,
            energieKondensator: energieKondensator, ladung: ladung,
            pufferzeit: pufferzeit,
            tauRL: tauRL, energieSpule: energieSpule,
            uebersetzung: uebersetzung, trafo: trafo,
            gleichrichter: gleichrichter, brummfrequenz: brummfrequenz,
            brummspannung: brummspannung, ladekondensator: ladekondensator };

  if (typeof module !== 'undefined' && module.exports) module.exports = B;
  else global.BAUTEILE = B;
})(typeof window !== 'undefined' ? window : globalThis);
