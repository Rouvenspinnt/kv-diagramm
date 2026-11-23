/* Pneumatik und Hydraulik: Rechenkern.
   Laeuft im Browser und unter node (test-fluid.js).

   Einheiten: Druck in bar Ueberdruck, Durchmesser und Hub in mm, Flaeche in mm2,
   Volumenstrom in l/min, Geschwindigkeit in m/s, Luftverbrauch in Normlitern.
   1 bar = 0,1 N/mm2 — daraus kommt der Faktor 0,1 in der Kraftrechnung.

   Quellen:
   - Zylinderkraft, Luftverbrauch: Grundformeln der Pneumatik, Verdichtungs-
     verhaeltnis auf 1,013 bar Umgebungsdruck bezogen
   - Kv-Wert Fluessigkeit: Kv = Q * sqrt(rho_rel / dp), Q in m3/h, dp in bar
   - Kv-Wert Luft: die vereinfachte Industrieformel, wie Buerkert und Samson sie
     aus IEC 60534 ableiten (nicht die volle Rechnung der Norm):
     Qn = 514 * Kv * sqrt(dp * p2abs / (rho_n * T)), mit Begrenzung auf den
     kritischen Druckabfall bei p2 = 0,5 * p1

   Bewusst nicht gerechnet: Totvolumen der Zylinderdeckel und das Volumen von
   Schlauch und Ventil. Bei kurzem Hub kommen dadurch zweistellige Prozente auf
   den Luftverbrauch obendrauf — die Seite sagt das auch. */
(function (global) {
  'use strict';

  var UMGEBUNG = 1.013;                  // bar absolut, Normzustand nach DIN 1343

  function rund(x, stellen) {
    var f = Math.pow(10, stellen === undefined ? 3 : stellen);
    return Math.round(x * f) / f;
  }

  /* ---------- Flaechen ---------- */
  function kolbenflaeche(D) {
    return !(D > 0) ? NaN : Math.PI * D * D / 4;
  }
  function ringflaeche(D, d) {
    if (!(D > 0) || !(d > 0) || d >= D) return NaN;
    return Math.PI * (D * D - d * d) / 4;
  }

  /* ---------- Kraft ----------
     F = p * A. Der Wirkungsgrad deckt Dichtungs- und Fuehrungsreibung ab;
     beim Pneumatikzylinder liegt er bei 0,85 bis 0,95, beim Hydraulik-
     zylinder hoeher. */
  function kraft(p, A, eta) {
    if (!(p > 0) || !(A > 0)) return NaN;
    var e = eta === undefined ? 1 : (eta > 1 ? eta / 100 : eta);
    return p * 0.1 * A * e;
  }
  function druckAusKraft(F, A, eta) {
    if (!(F > 0) || !(A > 0)) return NaN;
    var e = eta === undefined ? 1 : (eta > 1 ? eta / 100 : eta);
    return F / (0.1 * A * e);
  }
  function flaecheAusKraft(F, p, eta) {
    if (!(F > 0) || !(p > 0)) return NaN;
    var e = eta === undefined ? 1 : (eta > 1 ? eta / 100 : eta);
    return F / (0.1 * p * e);
  }

  /* ---------- Geschwindigkeit und Zeit ----------
     v [m/s] = Q [l/min] * 1e6 mm3/l / (60 s * A [mm2] * 1000 mm/m) */
  function geschwindigkeit(Q, A) {
    if (!(Q > 0) || !(A > 0)) return NaN;
    return Q * 1e6 / (60 * A * 1000);
  }
  function volumenstrom(v, A) {
    if (!(v > 0) || !(A > 0)) return NaN;
    return v * 60 * A * 1000 / 1e6;
  }
  function hubzeit(s, v) {
    if (!(s > 0) || !(v > 0)) return NaN;
    return s / 1000 / v;                 // s in mm, v in m/s -> Sekunden
  }

  /* ---------- Luftverbrauch ----------
     Im Zylinder steht die Luft unter Druck. Umgerechnet auf den Normzustand
     ist es um das Verdichtungsverhaeltnis mehr — das ist die Menge, die der
     Kompressor liefern muss. */
  function verdichtung(p) {
    if (!isFinite(p) || p < 0) return NaN;
    return (p + UMGEBUNG) / UMGEBUNG;
  }
  /* Normliter fuer einen Hub ueber die Flaeche A und den Weg s.
     Gerechnet wird isotherm bei Umgebungstemperatur, so wie Festo und die
     Praxis es tun. Streng auf 0 Grad nach DIN 1343 bezogen waeren es rund
     7 Prozent weniger — die Rechnung liegt also auf der sicheren Seite. */
  function luftJeHub(A, s, p) {
    if (!(A > 0) || !(s > 0)) return NaN;
    var v = verdichtung(p);
    if (!isFinite(v)) return NaN;
    return A * s / 1e6 * v;              // mm3 -> l, dann verdichtet
  }
  // Ein Doppelhub ist vor und zurueck: Kolbenflaeche hin, Ringflaeche zurueck
  function luftJeDoppelhub(D, d, s, p) {
    var hin = luftJeHub(kolbenflaeche(D), s, p);
    var zur = luftJeHub(ringflaeche(D, d), s, p);
    return isFinite(hin) && isFinite(zur) ? hin + zur : NaN;
  }
  function luftJeMinute(vJeDoppelhub, takte) {
    if (!(vJeDoppelhub > 0) || !(takte > 0)) return NaN;
    return vJeDoppelhub * takte;
  }

  /* ---------- Druckuebersetzer ----------
     Grosse Flaeche treibt kleine Flaeche: p2 = p1 * A1 / A2. Das Verhaeltnis
     der Flaechen ist das Uebersetzungsverhaeltnis. */
  function uebersetzer(p1, A1, A2) {
    if (!(p1 > 0) || !(A1 > 0) || !(A2 > 0)) return NaN;
    return p1 * A1 / A2;
  }

  /* ---------- Kv-Wert ----------
     Fluessigkeit: Kv = Q * sqrt(rho_rel / dp), Q in m3/h, dp in bar.
     rho_rel ist die Dichte bezogen auf Wasser, fuer Hydraulikoel rund 0,87. */
  function kvFluessig(Q, dp, dichteRel) {
    if (!(Q > 0) || !(dp > 0)) return NaN;
    var r = dichteRel > 0 ? dichteRel : 1;
    return Q * Math.sqrt(r / dp);
  }
  function durchflussFluessig(kv, dp, dichteRel) {
    if (!(kv > 0) || !(dp > 0)) return NaN;
    var r = dichteRel > 0 ? dichteRel : 1;
    return kv * Math.sqrt(dp / r);
  }

  /* Luft: oberhalb des kritischen Druckverhaeltnisses stroemt sie mit
     Schallgeschwindigkeit, mehr Druckabfall bringt dann keinen Durchfluss
     mehr. Darum wird dp auf die Haelfte des Eingangsdrucks begrenzt. */
  function luftdurchsatz(kv, p1, p2, T) {
    if (!(kv > 0) || !(p1 > 0)) return NaN;
    var p1a = p1 + UMGEBUNG;
    var p2a = (p2 >= 0 ? p2 : 0) + UMGEBUNG;
    if (p2a > p1a) return NaN;
    var kritisch = p2a < 0.5 * p1a;
    if (kritisch) p2a = 0.5 * p1a;       // Sperrgrenze
    var dp = p1a - p2a;
    if (T !== undefined && !(T > 150)) return NaN;   // T in Kelvin, nicht in Grad
    var t = T > 0 ? T : 293;
    /* 514 ist die Konstante von Buerkert. Samson rechnet mit 519, dem analytisch
       sauberen sqrt(273000/1,013). Der Unterschied ist 1 Prozent; 514 liegt
       naeher an dem, was Festo fuer seine Ventile angibt, und auf der sicheren
       Seite. rho_n = 1,293 kg/m3 ist Luft bei 0 Grad und 1,013 bar. */
    return { qn: 514 * kv * Math.sqrt(dp * p2a / (1.293 * t)), kritisch: kritisch };
  }

  /* ---------- Rohr und Schlauch ----------
     d aus Volumenstrom und gewuenschter Stroemungsgeschwindigkeit. */
  function rohrGeschwindigkeit(Q, d) {
    return geschwindigkeit(Q, kolbenflaeche(d));
  }
  function rohrDurchmesser(Q, v) {
    if (!(Q > 0) || !(v > 0)) return NaN;
    var A = Q * 1e6 / (60 * v * 1000);   // mm2
    return Math.sqrt(4 * A / Math.PI);
  }

  /* Richtwerte fuer die Stroemungsgeschwindigkeit. Zu schnell heisst
     Druckverlust und Geraeusch, zu langsam heisst unnoetig dickes Rohr. */
  var RICHTWERTE = [
    { was: 'Hydraulik Saugleitung',   von: 0.5, bis: 1.5 },
    { was: 'Hydraulik Druckleitung',  von: 3,   bis: 6 },
    { was: 'Hydraulik Rücklauf',      von: 2,   bis: 3 },
    { was: 'Druckluft Hauptleitung',  von: 6,   bis: 8 },
    { was: 'Druckluft Verteilleitung', von: 10,  bis: 15 },
    { was: 'Druckluft Anschluss',     von: 10,  bis: 20 }
  ];

  // Uebliche Zylinderdurchmesser nach ISO 15552 und die zugehoerige Kolbenstange
  var ZYLINDER = [
    { D: 32, d: 12 }, { D: 40, d: 16 }, { D: 50, d: 20 }, { D: 63, d: 20 },
    { D: 80, d: 25 }, { D: 100, d: 25 }, { D: 125, d: 32 }, { D: 160, d: 40 },
    { D: 200, d: 40 }, { D: 250, d: 50 }, { D: 320, d: 63 }
  ];

  var F = { UMGEBUNG: UMGEBUNG, rund: rund,
            kolbenflaeche: kolbenflaeche, ringflaeche: ringflaeche,
            kraft: kraft, druckAusKraft: druckAusKraft, flaecheAusKraft: flaecheAusKraft,
            geschwindigkeit: geschwindigkeit, volumenstrom: volumenstrom, hubzeit: hubzeit,
            verdichtung: verdichtung, luftJeHub: luftJeHub,
            luftJeDoppelhub: luftJeDoppelhub, luftJeMinute: luftJeMinute,
            uebersetzer: uebersetzer,
            kvFluessig: kvFluessig, durchflussFluessig: durchflussFluessig,
            luftdurchsatz: luftdurchsatz,
            rohrGeschwindigkeit: rohrGeschwindigkeit, rohrDurchmesser: rohrDurchmesser,
            RICHTWERTE: RICHTWERTE, ZYLINDER: ZYLINDER };

  if (typeof module !== 'undefined' && module.exports) module.exports = F;
  else global.FLUID = F;
})(typeof window !== 'undefined' ? window : globalThis);
