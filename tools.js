/* Verzeichnis aller Rechner. Eine einzige Quelle für Startseite, Suche und
   Navigationsleiste — ein neuer Rechner braucht genau einen Eintrag hier.

   gebiet   Schlüssel aus GEBIETE
   datei    Seite, optional mit #Anker auf den Abschnitt
   kurz     ein Satz, steht auf der Kachel
   w        Stichworte für die Suche: wonach jemand wirklich sucht
            (Formelzeichen, Synonyme, Werkstattsprache), nicht der Titel nochmal */
(function (global) {
  'use strict';

  var GEBIETE = [
    ['steuerung', 'Steuerungstechnik'],
    ['elektro',   'Elektrotechnik'],
    ['messen',    'Mess- & Regeltechnik'],
    ['antrieb',   'Antrieb & Mechanik'],
    ['fluid',     'Pneumatik & Hydraulik'],
    ['fertigung', 'Fertigung & Zerspanung']
  ];

  var TOOLS = [
    { id: 'kv', titel: 'KV-Diagramm', gebiet: 'steuerung', datei: 'kv-diagramm.html',
      kurz: 'Wertetabelle zu minimaler Gleichung, Logikplan und PDF',
      w: ['karnaugh', 'veitch', 'wahrheitstabelle', 'minimieren', 'dnf', 'knf',
          'logikplan', 'sps', 'boolesch', 'schaltalgebra', 'primimplikant'] },

    { id: 'ohm', titel: 'Ohm & Leistung', gebiet: 'elektro', datei: 'ohm.html',
      kurz: 'Zwei Größen eintragen, die anderen beiden stehen da',
      w: ['ohmsches gesetz', 'spannung', 'strom', 'widerstand', 'leistung',
          'volt', 'ampere', 'watt', 'u=r*i', 'p=u*i', 'kennlinie'] },

    { id: 'farbcode', titel: 'Widerstands-Farbcode', gebiet: 'elektro', datei: 'farbcode.html',
      kurz: 'Ringe ablesen oder einen Wert in Ringe umsetzen',
      w: ['ringe', 'farbringe', 'widerstand ablesen', 'toleranz', 'e-reihe',
          'normwert', 'gold', 'silber', '4 ringe', '5 ringe', '6 ringe'] },

    { id: 'led', titel: 'LED & Spannungsteiler', gebiet: 'elektro', datei: 'led.html',
      kurz: 'Vorwiderstand mit Normwert, Verlustleistung und Teiler unter Last',
      w: ['vorwiderstand', 'leuchtdiode', 'flussspannung', 'spannungsteiler',
          'querstrom', 'unbelastet', 'belastet', 'uf', 'if'] },

    { id: 'wechselstrom', titel: 'Wechselstrom & Resonanz', gebiet: 'elektro', datei: 'wechselstrom.html',
      kurz: 'Blindwiderstand, Scheinwiderstand, Phasenwinkel und Resonanzfrequenz',
      w: ['blindwiderstand', 'scheinwiderstand', 'impedanz', 'phasenwinkel',
          'resonanz', 'schwingkreis', 'kondensator', 'spule', 'xl', 'xc',
          'cos phi', 'frequenz', 'zeigerdiagramm'] }
  ];

  /* Suche: jedes eingetippte Wort muss irgendwo vorkommen. Treffer im Titel
     wiegen schwerer als Treffer in den Stichworten, damit die offensichtliche
     Antwort oben steht. */
  function norm(s) {
    return String(s).toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
  }

  function suche(frage, liste) {
    var worte = norm(frage).split(/[\s,]+/).filter(Boolean);
    if (!worte.length) return [];
    return (liste || TOOLS).map(function (t) {
      var titel = norm(t.titel), rest = norm(t.kurz + ' ' + t.w.join(' '));
      var punkte = 0;
      for (var i = 0; i < worte.length; i++) {
        if (titel.indexOf(worte[i]) >= 0) punkte += 10;
        else if (rest.indexOf(worte[i]) >= 0) punkte += 3;
        else return null;                       // ein Wort fehlt ganz: kein Treffer
      }
      if (norm(t.titel).indexOf(norm(frage)) === 0) punkte += 5;   // Titelanfang
      return { tool: t, punkte: punkte };
    }).filter(Boolean)
      .sort(function (a, b) { return b.punkte - a.punkte; })
      .map(function (r) { return r.tool; });
  }

  function gebietName(key) {
    for (var i = 0; i < GEBIETE.length; i++) if (GEBIETE[i][0] === key) return GEBIETE[i][1];
    return key;
  }

  function imGebiet(key) {
    return TOOLS.filter(function (t) { return t.gebiet === key; });
  }

  // Zu welchem Werkzeug gehört eine Datei? Für die Navigationsleiste.
  function ausDatei(datei) {
    var d = String(datei || '').toLowerCase().split('#')[0];
    for (var i = 0; i < TOOLS.length; i++) {
      if (TOOLS[i].datei.toLowerCase().split('#')[0] === d) return TOOLS[i];
    }
    return null;
  }

  var T = { GEBIETE: GEBIETE, TOOLS: TOOLS, suche: suche, gebietName: gebietName,
            imGebiet: imGebiet, ausDatei: ausDatei };

  if (typeof module !== 'undefined' && module.exports) module.exports = T;
  else global.TOOLS = T;
})(typeof window !== 'undefined' ? window : globalThis);
