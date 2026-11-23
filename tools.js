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
    ['fertigung', 'Fertigung & Zerspanung'],
    ['wissen',    'Nachschlagen']
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
          'cos phi', 'frequenz', 'zeigerdiagramm'] },

    { id: 'leitung', titel: 'Leitung & Absicherung', gebiet: 'elektro',
      datei: 'leitung.html#auslegen',
      kurz: 'Querschnitt aus Strom, Länge und Spannungsfall, mit Verlegeart und Sicherung',
      w: ['leitungsquerschnitt', 'querschnitt', 'kabel', 'leitung', 'adern',
          'strombelastbarkeit', 'verlegeart', 'belastbarkeit', 'haeufung', 'häufung',
          'absicherung', 'sicherung', 'ls-schalter', 'leitungsschutzschalter',
          'vde 0298', 'vde 0100', 'kupfer', 'aluminium'] },

    { id: 'spannungsfall', titel: 'Spannungsfall', gebiet: 'elektro',
      datei: 'leitung.html#fall',
      kurz: 'Wie viel Spannung auf der Strecke bleibt, in Volt und in Prozent',
      w: ['spannungsfall', 'spannungsabfall', 'delta u', 'leitungsverlust',
          'leitungslaenge', 'leitungslänge', 'prozent', 'kappa', 'leitfaehigkeit',
          'leitfähigkeit'] },

    { id: 'absicherung', titel: 'Absicherung & Auslösung', gebiet: 'elektro',
      datei: 'leitung.html#schutz',
      kurz: 'Kennlinie B, C und D und ab welchem Strom der Schalter sofort auslöst',
      w: ['kennlinie', 'ausloesung', 'auslösung', 'ausloesestrom', 'auslösestrom',
          'b16', 'c16', 'automat', 'leitungsschutzschalter', 'ls', 'schmelzsicherung',
          'ueberstrom', 'überstrom', 'kurzschluss'] },

    { id: 'motorstrom', titel: 'Motorstrom', gebiet: 'elektro',
      datei: 'drehstrom.html#motor',
      kurz: 'Nennstrom und Anlaufstrom aus Leistung, cos φ und Wirkungsgrad',
      w: ['motorstrom', 'nennstrom', 'anlaufstrom', 'typenschild', 'drehstrommotor',
          'motor', 'wirkungsgrad', 'cos phi', 'scheinleistung', 'blindleistung',
          'kva', 'kvar', 'ie3'] },

    { id: 'sterndreieck', titel: 'Stern & Dreieck', gebiet: 'elektro',
      datei: 'drehstrom.html#schaltung',
      kurz: 'Strangwerte, Klemmbrett mit Brücken und warum der Stern ein Drittel bringt',
      w: ['stern', 'dreieck', 'sterndreieck', 'stern-dreieck', 'y', 'delta',
          'strangspannung', 'strangstrom', 'klemmbrett', 'klemmkasten', 'bruecken',
          'brücken', 'anlauf', 'wurzel 3', '400/690'] },

    { id: 'kompensation', titel: 'Blindleistung kompensieren', gebiet: 'elektro',
      datei: 'drehstrom.html#kompensation',
      kurz: 'Kondensatorgröße, um den Leistungsfaktor anzuheben',
      w: ['kompensation', 'blindleistung', 'blindstrom', 'cos phi', 'leistungsfaktor',
          'kondensator', 'kvar', 'mikrofarad', 'phasenschieber', 'ueberkompensation',
          'überkompensation'] },

    { id: 'rcglied', titel: 'RC-Glied & Zeitkonstante', gebiet: 'elektro',
      datei: 'kondensator.html#rc',
      kurz: 'Zeitkonstante, Ladekurve und Spannung nach der Zeit, mit Diagramm',
      w: ['rc', 'rc-glied', 'zeitkonstante', 'tau', 'ladekurve', 'laden', 'entladen',
          'kondensator', 'e-funktion', 'verzoegerung', 'verzögerung', 'wischkontakt',
          '63 prozent'] },

    { id: 'spule', titel: 'Spule & Freilauf', gebiet: 'elektro',
      datei: 'kondensator.html#rl',
      kurz: 'Zeitkonstante L/R, gespeicherte Energie und warum die Freilaufdiode sitzt',
      w: ['spule', 'induktivitaet', 'induktivität', 'rl', 'rl-glied', 'henry',
          'freilaufdiode', 'freilauf', 'abschaltspitze', 'schuetz', 'schütz',
          'magnetventil', 'relais'] },

    { id: 'pufferzeit', titel: 'Pufferzeit', gebiet: 'elektro',
      datei: 'kondensator.html#puffer',
      kurz: 'Wie lange ein Kondensator eine Last über den Spannungseinbruch trägt',
      w: ['pufferzeit', 'puffer', 'stuetzkondensator', 'stützkondensator', 'ueberbrueckung',
          'überbrückung', 'spannungseinbruch', 'netzausfall', 'sps', 'backup'] },

    { id: 'trafo', titel: 'Transformator', gebiet: 'elektro',
      datei: 'trafo.html#uebersetzung',
      kurz: 'Windungen, Spannungen und Ströme ineinander, mit Wirkungsgrad',
      w: ['trafo', 'transformator', 'uebersetzung', 'übersetzung', 'windungen',
          'windungszahl', 'primaer', 'primär', 'sekundaer', 'sekundär', 'wicklung',
          'netztrafo', 'klingeltrafo'] },

    { id: 'gleichrichter', titel: 'Gleichrichter & Glättung', gebiet: 'elektro',
      datei: 'trafo.html#gleich',
      kurz: 'Scheitelwert, Brummspannung und der nötige Ladekondensator',
      w: ['gleichrichter', 'bruecke', 'brücke', 'brueckengleichrichter', 'einweg',
          'diode', 'glaettung', 'glättung', 'ladekondensator', 'brummspannung',
          'brummen', 'ripple', 'netzteil', 'scheitelwert', 'wurzel 2'] },

    { id: 'drehzahl', titel: 'Drehzahl & Schnittgeschwindigkeit', gebiet: 'fertigung',
      datei: 'zerspanung.html#drehzahl',
      kurz: 'vc, Durchmesser und Drehzahl ineinander, mit Richtwerten je Werkstoff',
      w: ['schnittgeschwindigkeit', 'vc', 'drehzahl', 'spindel', 'umdrehungen',
          'bohren', 'fraesen', 'drehen', 'richtwerte', 'hss', 'hartmetall', 'u/min'] },

    { id: 'vorschub', titel: 'Vorschub', gebiet: 'fertigung', datei: 'zerspanung.html#vorschub',
      kurz: 'Zahnvorschub, Umdrehungsvorschub und Vorschubgeschwindigkeit',
      w: ['vorschub', 'zahnvorschub', 'fz', 'vf', 'zaehne', 'schneiden', 'fraeser'] },

    { id: 'hauptzeit', titel: 'Hauptzeit', gebiet: 'fertigung', datei: 'zerspanung.html#hauptzeit',
      kurz: 'Wie lange der Schnitt dauert, mit Anschnitt beim Bohren',
      w: ['hauptzeit', 'schnittzeit', 'dauer', 'anschnitt', 'ueberlauf', 'bohrtiefe', 'th'] },

    { id: 'gewinde', titel: 'Gewinde & Kernloch', gebiet: 'fertigung', datei: 'gewinde.html',
      kurz: 'Kernlochbohrer, Steigung und Durchgangsloch von M1 bis M64',
      w: ['gewinde', 'kernloch', 'kernlochbohrer', 'vorbohren', 'gewindebohrer', 'steigung',
          'metrisch', 'feingewinde', 'durchgangsloch', 'schraube', 'm8', 'm10', 'm12',
          'din 13', 'din en 20273'] },

    { id: 'passung', titel: 'ISO-Passungen', gebiet: 'fertigung', datei: 'passungen.html',
      kurz: 'Spiel und Übermaß einer Paarung wie H7/g6, in Mikrometern',
      w: ['passung', 'toleranz', 'h7', 'g6', 'k6', 'n6', 'p6', 'spiel', 'uebermass',
          'presssitz', 'uebergangspassung', 'iso 286', 'grenzmass', 'it7', 'welle', 'bohrung'] },

    { id: 'normsignal', titel: 'Normsignal skalieren', gebiet: 'messen',
      datei: 'normsignal.html#norm',
      kurz: '4–20 mA oder 0–10 V auf den Messbereich, in beide Richtungen',
      w: ['normsignal', 'einheitssignal', '4-20ma', '4 20 ma', '0-10v', '0 10 v', 'skalieren',
          'messbereich', 'sensor', 'transmitter', 'lebende null', 'drahtbruch', 'strommessung'] },

    { id: 'sps', titel: 'SPS-Rohwert', gebiet: 'messen', datei: 'normsignal.html#sps',
      kurz: 'Rohwert 0–27648 in den Messwert und zurück, mit Über- und Untersteuerung',
      w: ['rohwert', 'analogwert', '27648', '32767', 'peripheriewort', 'norm_x', 'scale',
          'siemens', 's7', 'tia', 'analogeingang', 'ueberlauf', 'ue', 'drahtbruch'] },

    { id: 'abweichung', titel: 'Abweichung & Toleranz', gebiet: 'messen',
      datei: 'normsignal.html#abweichung',
      kurz: 'Absolute und relative Abweichung, Toleranzband aus v. M. und v. E.',
      w: ['messabweichung', 'fehler', 'genauigkeit', 'toleranz', 'kalibrieren', 'pruefen',
          'vom messwert', 'vom endwert', 'v.m.', 'v.e.', 'messunsicherheit'] },

    { id: 'pt100', titel: 'Pt100 & Pt1000', gebiet: 'messen', datei: 'temperatur.html#pt',
      kurz: 'Widerstand und Temperatur ineinander, mit Leitungsfehler im Zweileiter',
      w: ['pt100', 'pt1000', 'widerstandsthermometer', 'temperaturfuehler', 'ohm',
          'kennlinie', 'din en 60751', 'callendar', 'zweileiter', 'vierleiter', 'klixon'] },

    { id: 'thermo', titel: 'Thermoelement', gebiet: 'messen', datei: 'temperatur.html#thermo',
      kurz: 'Typ K, J und T: Millivolt und Temperatur, mit Vergleichsstelle',
      w: ['thermoelement', 'thermoelemente', 'typ k', 'typ j', 'typ t', 'nicr', 'nicrni',
          'millivolt', 'mv', 'vergleichsstelle', 'kaltstelle', 'klemmentemperatur', 'ofen'] },

    { id: 'drehmoment', titel: 'Leistung, Drehzahl, Moment', gebiet: 'antrieb',
      datei: 'antrieb.html#moment',
      kurz: 'Zwei der drei Größen eintragen, die dritte kommt heraus',
      w: ['drehmoment', 'moment', 'nm', 'leistung', 'kw', 'drehzahl', 'welle',
          'typenschild', 'winkelgeschwindigkeit', 'omega', 'wirkungsgrad', 'p=m*omega'] },

    { id: 'asm', titel: 'Asynchronmotor', gebiet: 'antrieb', datei: 'antrieb.html#motor',
      kurz: 'Synchrondrehzahl, Schlupf, Polzahl und Betrieb am Umrichter',
      w: ['asynchronmotor', 'drehstrommotor', 'schlupf', 'synchrondrehzahl', 'polzahl',
          'polpaare', 'vierpolig', '1450', 'umrichter', 'fu', 'frequenzumrichter',
          'feldschwaechung', 'drehfeld'] },

    { id: 'getriebe', titel: 'Getriebe & Riemen', gebiet: 'antrieb', datei: 'antrieb.html#getriebe',
      kurz: 'Übersetzung, Abtriebsdrehzahl und -moment, auch mehrstufig',
      w: ['getriebe', 'uebersetzung', 'riemen', 'riementrieb', 'zahnrad', 'zaehnezahl',
          'abtrieb', 'untersetzung', 'stufen', 'schneckengetriebe', 'wirkungsgrad'] },

    { id: 'hebel', titel: 'Hebel', gebiet: 'antrieb', datei: 'mechanik.html#hebel',
      kurz: 'Kraft und Hebelarm im Gleichgewicht, ein- und zweiseitig',
      w: ['hebel', 'hebelgesetz', 'hebelarm', 'drehmoment', 'drehpunkt', 'gleichgewicht',
          'kraft', 'last', 'wippe', 'brechstange', 'zange'] },

    { id: 'spannung', titel: 'Flächenpressung & Sicherheit', gebiet: 'antrieb',
      datei: 'mechanik.html#spannung',
      kurz: 'σ = F/A mit Sicherheit gegen die Streckgrenze, je Werkstoff',
      w: ['flaechenpressung', 'spannung', 'sigma', 'zugspannung', 'druck', 'querschnitt',
          'streckgrenze', 'rp02', 'zugfestigkeit', 'sicherheit', 'festigkeit', 'mpa',
          'n/mm2', 'werkstoff'] },

    { id: 'schraube', titel: 'Schraubenanzugsmoment', gebiet: 'antrieb',
      datei: 'mechanik.html#schraube',
      kurz: 'Richtwerte für 8.8, 10.9 und 12.9, mit Reibungskorrektur',
      w: ['anzugsmoment', 'drehmoment schraube', 'festigkeitsklasse', '8.8', '10.9', '12.9',
          'vorspannkraft', 'drehmomentschluessel', 'vdi 2230', 'reibung', 'anziehen'] },

    { id: 'zylinder', titel: 'Zylinderkraft', gebiet: 'fluid', datei: 'pneumatik.html#kraft',
      kurz: 'Kraft beim Aus- und Einfahren aus Bohrung, Stange und Druck',
      w: ['zylinder', 'kolben', 'kolbenstange', 'bohrung', 'kraft', 'pneumatik', 'hydraulik',
          'ringflaeche', 'kolbenflaeche', 'bar', 'druck', 'ausfahren', 'einfahren'] },

    { id: 'kolbentempo', titel: 'Kolbengeschwindigkeit', gebiet: 'fluid',
      datei: 'pneumatik.html#tempo',
      kurz: 'Volumenstrom und Fläche geben Geschwindigkeit und Hubzeit',
      w: ['kolbengeschwindigkeit', 'geschwindigkeit', 'volumenstrom', 'hubzeit', 'hub',
          'l/min', 'pumpe', 'foerdermenge', 'drossel'] },

    { id: 'luftverbrauch', titel: 'Luftverbrauch', gebiet: 'fluid', datei: 'pneumatik.html#luft',
      kurz: 'Normliter je Hub und je Minute, mit dem Verdichtungsverhältnis',
      w: ['luftverbrauch', 'druckluft', 'normliter', 'nl', 'kompressor', 'verdichtung',
          'verbrauch', 'takte', 'doppelhub'] },

    { id: 'drucküb', titel: 'Druckübersetzer', gebiet: 'fluid',
      datei: 'pneumatik.html#uebersetzer',
      kurz: 'Flächenverhältnis, Druck und der Weg, der dabei verloren geht',
      w: ['druckuebersetzer', 'uebersetzer', 'booster', 'flaechenverhaeltnis', 'luft oel',
          'hochdruck', 'pressen'] },

    { id: 'kvwert', titel: 'Kv-Wert', gebiet: 'fluid', datei: 'stroemung.html#kv',
      kurz: 'Ventil nach Durchfluss und Druckabfall, für Wasser, Öl und Luft',
      w: ['kv', 'kv-wert', 'kvs', 'ventil', 'ventilauswahl', 'durchfluss', 'druckabfall',
          'drosselung', 'durchflusskoeffizient', 'sperrgrenze', 'kritisch'] },

    { id: 'rohr', titel: 'Rohr & Schlauch', gebiet: 'fluid', datei: 'stroemung.html#rohr',
      kurz: 'Innendurchmesser aus Volumenstrom und Strömungsgeschwindigkeit',
      w: ['rohr', 'schlauch', 'querschnitt', 'innendurchmesser', 'nennweite', 'stroemung',
          'stroemungsgeschwindigkeit', 'druckverlust', 'saugleitung', 'druckleitung'] },

    { id: 'drehstrommotor', titel: 'Drehstrommotor', gebiet: 'wissen',
      datei: 'nachschlagen.html#drehstrommotor',
      kurz: 'Drehfeld, Synchrondrehzahl und warum der Läufer nachhängen muss',
      w: ['drehstrommotor', 'drehstrom motor', 'asynchronmotor', 'asynchronmaschine',
          'drehfeld', 'schlupf', 'synchrondrehzahl', 'polzahl', 'polpaare', 'kaefiglaeufer',
          'käfigläufer', 'drehrichtung', 'motor erklaert', 'induktion', 'typenschild',
          '1450', '1500'] },

    { id: 'sterndreieck-warum', titel: 'Warum Stern-Dreieck drittelt', gebiet: 'wissen',
      datei: 'nachschlagen.html#sterndreieck-warum',
      kurz: 'Zweimal Wurzel 3 ergibt ein Drittel Strom und ein Drittel Moment',
      w: ['stern dreieck', 'sterndreieck', 'y/d', 'warum drittel', 'anlauf',
          'anlaufstrom senken', 'strangspannung', 'umschaltung', '400/690', '230/400',
          'typenschild', 'moment quadrat'] },

    { id: 'fi', titel: 'FI-Schalter', gebiet: 'wissen',
      datei: 'nachschlagen.html#fi',
      kurz: 'Wie der Summenstrom verglichen wird, und die Typen AC, A, F und B',
      w: ['fi', 'fi schalter', 'rcd', 'fehlerstrom', 'fehlerstromschutzschalter',
          'summenstrom', '30 ma', 'typ a', 'typ b', 'typ f', 'personenschutz',
          'differenzstrom', 'umrichter fi', 'saettigung'] },

    { id: 'umrichter', titel: 'Frequenzumrichter', gebiet: 'wissen',
      datei: 'nachschlagen.html#umrichter',
      kurz: 'U/f konstant, Feldschwächung und warum der Lüfter mitsinkt',
      w: ['frequenzumrichter', 'fu', 'umrichter', 'u/f', 'spannungs frequenz verhaeltnis',
          'feldschwaechung', 'feldschwächung', 'drehzahlsteuerung', 'saettigung',
          'sättigung', 'fremdluefter', 'fremdlüfter', 'eigenbelueftet', 'nennfrequenz',
          'vfd'] },

    { id: 'schuetz', titel: 'Schütz & Selbsthaltung', gebiet: 'wissen',
      datei: 'nachschlagen.html#schuetz',
      kurz: 'Haupt- und Hilfskontakte, Selbsthaltung und warum Aus ein Öffner ist',
      w: ['schuetz', 'schütz', 'relais', 'selbsthaltung', 'haltekontakt', 'oeffner',
          'öffner', 'schliesser', 'schließer', 'aus taster', 'ruhestrom', 'drahtbruch',
          'freilaufdiode', 'rc glied', 'spulenbeschaltung', 'motorschuetz'] },

    { id: 'sps-zyklus', titel: 'Der SPS-Zyklus', gebiet: 'wissen',
      datei: 'nachschlagen.html#sps-zyklus',
      kurz: 'Prozessabbild, Zykluszeit und die zwei typischen Stolperfallen',
      w: ['sps', 'zyklus', 'zykluszeit', 'prozessabbild', 'pae', 'paa', 'eingaenge lesen',
          'ausgaenge schreiben', 'doppelte zuweisung', 'plc', 'programmdurchlauf',
          'alarmeingang', 'schneller zaehler', 's7', 'tia'] },

    { id: 'kv-lesen', titel: 'Das KV-Diagramm lesen', gebiet: 'wissen',
      datei: 'nachschlagen.html#kv-lesen',
      kurz: 'Gray-Code, Blockregeln, Rand und Don’t Care',
      w: ['kv diagramm lesen', 'karnaugh', 'gray code', 'bloecke', 'blöcke',
          'zusammenfassen', 'rand', 'dont care', 'don’t care', 'minimieren', 'vereinfachen',
          'zweierpotenz', 'nachbarfeld', 'wahrheitstabelle'] },

    { id: 'regelkreis', titel: 'P, I und D', gebiet: 'wissen',
      datei: 'nachschlagen.html#regelkreis',
      kurz: 'Was die drei Regleranteile tun und wie man sie von Hand einstellt',
      w: ['pid', 'pi regler', 'p anteil', 'i anteil', 'd anteil', 'regler', 'regelkreis',
          'regelabweichung', 'ueberschwingen', 'überschwingen', 'totzeit', 'einstellen',
          'sollwert', 'istwert', 'stellgroesse'] },

    { id: 'vier-zwanzig', titel: 'Warum 4–20 mA', gebiet: 'wissen',
      datei: 'nachschlagen.html#vier-zwanzig',
      kurz: 'Lebende Null, Zweileitertechnik und warum Strom nicht verfälscht wird',
      w: ['warum 4 20 ma', 'lebende null', 'drahtbrucherkennung', 'zweileiter',
          'vierleiter', '0 10 v', 'spannungsfall messleitung', 'stromsignal',
          'einheitssignal', 'sensor leitung', '0 20 ma'] },

    { id: 'temperaturfuehler', titel: 'Pt100 oder Thermoelement', gebiet: 'wissen',
      datei: 'nachschlagen.html#temperaturfuehler',
      kurz: 'Welcher Fühler wofür, und was jeder von beiden braucht',
      w: ['pt100 oder thermoelement', 'welcher fuehler', 'welcher fühler',
          'widerstandsthermometer', 'vergleichsstelle', 'kaltstelle', 'zweileiter pt100',
          'dreileiter', 'vierleiter', 'typ k', 'typ j', 'platin',
          'temperaturmessung vergleich'] },

    { id: 'passung-lesen', titel: 'H7/g6 lesen', gebiet: 'wissen',
      datei: 'nachschlagen.html#passung-lesen',
      kurz: 'Großbuchstabe, Kleinbuchstabe, IT-Grad und die Einheitsbohrung',
      w: ['h7/g6 lesen', 'passung lesen', 'was bedeutet h7', 'toleranzfeld', 'it grad',
          'einheitsbohrung', 'einheitswelle', 'spielpassung', 'uebergangspassung',
          'übergangspassung', 'presspassung', 'abmass', 'abmaß', 'grossbuchstabe',
          'großbuchstabe'] },

    { id: 'vc-konstant', titel: 'Warum vc gleich bleibt', gebiet: 'wissen',
      datei: 'nachschlagen.html#vc-konstant',
      kurz: 'Schnittgeschwindigkeit, Standzeit und G96 beim Plandrehen',
      w: ['warum vc', 'standzeit', 'schnittgeschwindigkeit konstant', 'g96', 'plandrehen',
          'grenzdrehzahl', 'verschleiss', 'verschleiß', 'schneidstoff', 'drehzahl anpassen',
          'durchmesser klein'] },

    { id: 'ventil-benennung', titel: '5/2-Wegeventil', gebiet: 'wissen',
      datei: 'nachschlagen.html#ventil-benennung',
      kurz: 'Was die Zahlen heißen, die Anschlussnummern und monostabil gegen bistabil',
      w: ['5/2 wegeventil', '3/2 wegeventil', 'wegeventil', 'anschluesse', 'anschlüsse',
          'schaltstellungen', 'iso 11727', 'monostabil', 'bistabil', 'impulsventil',
          'doppeltwirkend', 'einfachwirkend', 'anschlussbezeichnung', 'p a b r s',
          'not aus ventil'] },

    { id: 'vorspannung', titel: 'Warum mit Drehmoment anziehen', gebiet: 'wissen',
      datei: 'nachschlagen.html#vorspannung',
      kurz: 'Vorspannkraft, Reibschluss und warum die Reibungszahl alles entscheidet',
      w: ['vorspannkraft', 'anzugsmoment warum', 'reibschluss', 'reibungszahl', '0,14',
          'geschmiert', 'drehmomentschluessel', 'drehmomentschlüssel',
          'drehwinkelgesteuert', 'streuung', 'schraube reisst', 'schraube reißt',
          'abscheren', 'gewindereibung', 'kopfreibung'] },
  ];

  /* Suche: jedes eingetippte Wort muss irgendwo vorkommen. Treffer im Titel
     wiegen schwerer als Treffer in den Stichworten, damit die offensichtliche
     Antwort oben steht. */
  function norm(s) {
    return String(s).toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
  }

  /* Fuellwoerter einer gesprochenen Frage. Ohne sie waere "wie funktioniert ein
     Drehstrommotor" ohne Treffer, weil jedes Wort vorkommen muss. */
  var FUELL = ('wie was warum wieso weshalb wofuer wozu wann wo welche welcher welches ' +
    'ist sind war hat habe haben kann koennen muss soll darf tut macht machen geht gehen ' +
    'funktioniert funktionieren bedeutet heisst erklaer erklaere erklaeren erklaerung ' +
    'der die das den dem des ein eine einen einem einer eines kein keine ' +
    'und oder aber nicht man ich mir mich mein meine du dir sie es ' +
    'bei von mit fuer ueber unter zu zum zur im in am an auf aus als ' +
    'bitte mal denn doch so dann noch nur auch sich seine ihre').split(' ');

  function suche(frage, liste) {
    var alle = norm(frage).split(/[\s,]+/).filter(Boolean);
    var worte = alle.filter(function (w) { return FUELL.indexOf(w) < 0; });
    if (!worte.length) worte = alle;         // nur Fuellwoerter: dann eben die
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
