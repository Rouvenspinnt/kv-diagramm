/* Zerspanung und Gewinde: Rechenkern und Tabellen.
   Laeuft im Browser und unter node (test-fertigung.js).

   Quellen der Tabellen:
   - Steigungen: DIN 13-1 (metrisches ISO-Regelgewinde) und DIN 13-2..-10 (Feingewinde)
   - Durchgangsloecher: DIN EN 20273
   - Kernlochbohrer beim Regelgewinde nachgeschlagen (Spalte b, DIN 336),
     beim Feingewinde gerechnet als d - P
   - d1 = d - 1.0825*P ist der Kerndurchmesser des Gewindeprofils (Innengewinde),
     nicht der Bolzenkern d3; Flankendurchmesser d2 = d - 0.6495*P
   - Schnittgeschwindigkeiten sind Richtwerte, kein Ersatz fuer das Datenblatt
     des Werkzeugs. */
(function (global) {
  'use strict';

  /* ---------- Schnittgeschwindigkeit und Drehzahl ---------- */

  // n in 1/min aus vc in m/min und d in mm
  function drehzahl(vc, d) {
    if (!(vc > 0) || !(d > 0)) return NaN;
    return vc * 1000 / (Math.PI * d);
  }
  function schnittgeschwindigkeit(n, d) {
    if (!(n > 0) || !(d > 0)) return NaN;
    return Math.PI * d * n / 1000;
  }

  /* ---------- Vorschub ----------
     fz ist der Vorschub je Zahn, f der je Umdrehung, vf der je Minute. */
  function vorschub(n, z, fz) {
    if (!(n > 0) || !(z > 0) || !(fz > 0)) return NaN;
    return n * z * fz;
  }
  function zahnvorschub(vf, n, z) {
    if (!(vf > 0) || !(n > 0) || !(z > 0)) return NaN;
    return vf / (n * z);
  }

  /* ---------- Hauptzeit ----------
     L ist der ganze Weg: Werkstueck plus An- und Ueberlauf.
     Beim Bohren mit Spiralbohrer kommt der Anschnitt dazu; bei 118 Grad
     Spitzenwinkel ist die Spitze rund 0,3*d lang. */
  function bohrWeg(l, d, durchgang) {
    if (!(l > 0) || !(d > 0)) return NaN;
    return l + (durchgang ? 0.3 * d + 2 : 0.3 * d);   // 2 mm Ueberlauf beim Durchbohren
  }
  function hauptzeit(L, vf, schnitte) {
    if (!(L > 0) || !(vf > 0)) return NaN;
    return L * (schnitte > 0 ? schnitte : 1) / vf;    // in min
  }

  /* ---------- Metrisches ISO-Gewinde ----------
     d  Nenndurchmesser in mm
     P  Steigung des Regelgewindes
     fein  uebliche Feingewinde-Steigungen zu diesem Durchmesser
     dg  Durchgangsloch nach DIN EN 20273 [fein, mittel, grob], wo genormt */
  var GEWINDE = [
    { d: 1,   P: 0.25, fein: [0.2],            dg: [1.1, 1.2, 1.3], b: 0.75 },
    { d: 1.2, P: 0.25, fein: [0.2],            dg: [1.3, 1.4, 1.5], b: 0.95 },
    { d: 1.6, P: 0.35, fein: [0.2],            dg: [1.7, 1.8, 2.0], b: 1.25 },
    { d: 2,   P: 0.4,  fein: [0.25],           dg: [2.2, 2.4, 2.6], b: 1.6 },
    { d: 2.5, P: 0.45, fein: [0.35],           dg: [2.7, 2.9, 3.1], b: 2.05 },
    { d: 3,   P: 0.5,  fein: [0.35],           dg: [3.2, 3.4, 3.6], b: 2.5 },
    { d: 4,   P: 0.7,  fein: [0.5],            dg: [4.3, 4.5, 4.8], b: 3.3 },
    { d: 5,   P: 0.8,  fein: [0.5],            dg: [5.3, 5.5, 5.8], b: 4.2 },
    { d: 6,   P: 1,    fein: [0.75],           dg: [6.4, 6.6, 7.0], b: 5 },
    { d: 8,   P: 1.25, fein: [1, 0.75],        dg: [8.4, 9.0, 10.0], b: 6.8 },
    { d: 10,  P: 1.5,  fein: [1.25, 1, 0.75],  dg: [10.5, 11.0, 12.0], b: 8.5 },
    { d: 12,  P: 1.75, fein: [1.5, 1.25, 1],   dg: [13.0, 13.5, 14.5], b: 10.2 },
    { d: 14,  P: 2,    fein: [1.5, 1.25, 1],   dg: [15.0, 15.5, 16.5], b: 12 },
    { d: 16,  P: 2,    fein: [1.5, 1],         dg: [17.0, 17.5, 18.5], b: 14 },
    { d: 18,  P: 2.5,  fein: [2, 1.5, 1],      dg: [19.0, 20.0, 21.0], b: 15.5 },
    { d: 20,  P: 2.5,  fein: [2, 1.5, 1],      dg: [21.0, 22.0, 24.0], b: 17.5 },
    { d: 22,  P: 2.5,  fein: [2, 1.5, 1],      dg: [23.0, 24.0, 26.0], b: 19.5 },
    { d: 24,  P: 3,    fein: [2, 1.5, 1],      dg: [25.0, 26.0, 28.0], b: 21 },
    { d: 27,  P: 3,    fein: [2, 1.5, 1],      dg: [28.0, 30.0, 32.0], b: 24 },
    { d: 30,  P: 3.5,  fein: [3, 2, 1.5, 1],      dg: [31.0, 33.0, 35.0], b: 26.5 },
    { d: 33,  P: 3.5,  fein: [3, 2, 1.5],         dg: [34.0, 36.0, 38.0], b: 29.5 },
    { d: 36,  P: 4,    fein: [3, 2, 1.5],      dg: [37.0, 39.0, 42.0], b: 32 },
    { d: 39,  P: 4,    fein: [3, 2, 1.5],      dg: [40.0, 42.0, 45.0], b: 35 },
    { d: 42,  P: 4.5,  fein: [4, 3, 2, 1.5],      dg: [43.0, 45.0, 48.0], b: 37.5 },
    { d: 45,  P: 4.5,  fein: [4, 3, 2, 1.5],      dg: [46.0, 48.0, 52.0], b: 40.5 },
    { d: 48,  P: 5,    fein: [4, 3, 2, 1.5],      dg: [50.0, 52.0, 56.0], b: 43 },
    { d: 52,  P: 5,    fein: [4, 3, 2, 1.5],      dg: [54.0, 56.0, 62.0], b: 47 },
    { d: 56,  P: 5.5,  fein: [4, 3, 2, 1.5],        dg: [58.0, 62.0, 66.0], b: 50.5 },
    { d: 60,  P: 5.5,  fein: [4, 3, 2, 1.5],        dg: [62.0, 66.0, 70.0], b: 54.5 },
    { d: 64,  P: 6,    fein: [4, 3, 2, 1.5],        dg: [66.0, 70.0, 74.0], b: 58 }
  ];

  function rund(x, stellen) {
    var f = Math.pow(10, stellen === undefined ? 2 : stellen);
    return Math.round(x * f) / f;
  }

  /* Kernlochbohrer: beim Regelgewinde der Wert aus der Spalte b. Die Faustregel
     d - P wuerde an fuenf Groessen daneben liegen (M1, M1,2, M1,6, M2,5 runden
     falsch, M12 gibt 10,3 statt 10,2). Beim Feingewinde stimmt d - P. */
  function gewinde(d, P) {
    var e = null, i;
    for (i = 0; i < GEWINDE.length; i++) if (Math.abs(GEWINDE[i].d - d) < 1e-9) { e = GEWINDE[i]; break; }
    if (!e) return null;
    var p = P > 0 ? P : e.P;
    var regel = Math.abs(p - e.P) < 1e-9;
    return {
      d: e.d,
      P: p,
      regel: regel,
      // Beim Regelgewinde der genormte Bohrer, beim Feingewinde die Regel d - P.
      // d - P trifft fast alle Groessen, aber M8 (6,75) und M12 (10,25) liegen
      // zwischen zwei Bohrern der Reihe; dort gilt der Tabellenwert.
      kernloch: regel ? e.b : rund(e.d - p, 2),
      d1: rund(e.d - 1.0825 * p, 3),       // Kerndurchmesser des Gewindeprofils, nicht des Bolzens
      d2: rund(e.d - 0.6495 * p, 3),       // Flankendurchmesser
      steigungswinkel: rund(Math.atan(p / (Math.PI * (e.d - 0.6495 * p))) * 180 / Math.PI, 2),
      fein: e.fein,
      dg: e.dg
    };
  }

  // Welches Gewinde passt in ein vorhandenes Loch? Gibt die Groesse zurueck,
  // deren Kernloch am besten passt.
  function gewindeZuBohrer(bohrer) {
    if (!(bohrer > 0)) return null;
    var best = null, abw = Infinity;
    GEWINDE.forEach(function (e) {
      var k = e.b, a = Math.abs(k - bohrer);
      if (a < abw) { abw = a; best = e; }
    });
    return abw <= 0.25 ? gewinde(best.d) : null;
  }

  /* ---------- Richtwerte fuer die Schnittgeschwindigkeit ----------
     vc in m/min. Spanne, weil es von Kuehlung, Steifigkeit und Zustellung
     abhaengt; in der Mitte faengt man an. */
  var VC = [
    { werkstoff: 'Baustahl S235',        hss: [25, 35],  hm: [120, 200] },
    { werkstoff: 'Vergütungsstahl C45',  hss: [20, 30],  hm: [100, 180] },
    { werkstoff: 'Legierter Stahl 42CrMo4', hss: [15, 25], hm: [80, 150] },
    { werkstoff: 'Edelstahl V2A / V4A',  hss: [10, 18],  hm: [60, 120] },
    { werkstoff: 'Grauguss GJL-250',     hss: [18, 28],  hm: [80, 150] },
    { werkstoff: 'Aluminium AlMg / AlCuMg', hss: [60, 120], hm: [300, 1000] },
    { werkstoff: 'Messing / Bronze',     hss: [40, 80],  hm: [200, 400] },
    { werkstoff: 'Kupfer',               hss: [40, 70],  hm: [150, 300] },
    { werkstoff: 'Kunststoff PA / POM',  hss: [80, 200], hm: [200, 600] }
  ];

  var F = { drehzahl: drehzahl, schnittgeschwindigkeit: schnittgeschwindigkeit,
            vorschub: vorschub, zahnvorschub: zahnvorschub,
            bohrWeg: bohrWeg, hauptzeit: hauptzeit,
            GEWINDE: GEWINDE, gewinde: gewinde, gewindeZuBohrer: gewindeZuBohrer,
            VC: VC, rund: rund };

  if (typeof module !== 'undefined' && module.exports) module.exports = F;
  else global.FERT = F;
})(typeof window !== 'undefined' ? window : globalThis);
