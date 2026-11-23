/* Schaltbilder: kleine SVG-Bausteine, die sich mit den eingegebenen Werten beschriften.
   Symbole nach IEC 60617: Widerstand als leeres Rechteck, Spule als ausgefuelltes,
   Kondensator als zwei Platten. Geteilt von ohm.html, led.html und wechselstrom.html. */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var D = {
    svg: function (w, h, label, inner) {
      return '<svg class="schema" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' +
             esc(label) + '">' + inner + '</svg>';
    },
    // Leitung. points: "x1,y1 x2,y2 ..."
    wire: function (points, cls) {
      return '<polyline class="wire draw ' + (cls || '') + '" points="' + points + '"/>';
    },
    text: function (x, y, s, cls) {
      return '<text class="late ' + (cls || '') + '" x="' + x + '" y="' + y + '">' + esc(s) + '</text>';
    },
    dot: function (x, y) { return '<circle class="dot late" cx="' + x + '" cy="' + y + '" r="3"/>'; },

    // Widerstand, waagerecht oder senkrecht, mittig auf (x, y)
    res: function (x, y, vert) {
      var w = vert ? 22 : 54, h = vert ? 54 : 22;
      return '<rect class="part late" x="' + (x - w / 2) + '" y="' + (y - h / 2) +
             '" width="' + w + '" height="' + h + '" rx="2"/>';
    },
    coil: function (x, y) {
      return '<rect class="part fill late" x="' + (x - 27) + '" y="' + (y - 9) +
             '" width="54" height="18" rx="2"/>';
    },
    cap: function (x, y) {
      return '<path class="part late" d="M' + (x - 5) + ' ' + (y - 15) + 'v30M' + (x + 5) + ' ' +
             (y - 15) + 'v30" fill="none"/>';
    },
    // Leuchtdiode, Stromrichtung nach rechts
    led: function (x, y) {
      return '<path class="part late" d="M' + (x - 11) + ' ' + (y - 12) + 'L' + (x + 9) + ' ' + y +
             'L' + (x - 11) + ' ' + (y + 12) + 'Z"/>' +
             '<path class="part late" d="M' + (x + 9) + ' ' + (y - 13) + 'v26" fill="none"/>' +
             '<path class="wire late hot" d="M' + (x + 2) + ' ' + (y - 16) + 'l9-9M' + (x + 9) + ' ' +
             (y - 20) + 'l8-8" stroke-width="1.3"/>' +
             '<path class="arrow late" d="M' + (x + 17) + ' ' + (y - 29) + 'l5-1-1 5z"/>' +
             '<path class="arrow late" d="M' + (x + 10) + ' ' + (y - 24) + 'l5-1-1 5z"/>';
    },
    // Quelle: Kreis mit = fuer Gleich-, ~ fuer Wechselspannung
    source: function (x, y, ac) {
      return '<circle class="part late" cx="' + x + '" cy="' + y + '" r="17"/>' +
             (ac ? '<path class="wire late" d="M' + (x - 8) + ' ' + y + 'q4 -6 8 0t8 0" fill="none"/>'
                 : '<path class="wire late" d="M' + (x - 8) + ' ' + (y - 4) + 'h16M' + (x - 8) + ' ' +
                   (y + 4) + 'h16" fill="none"/>');
    },
    ground: function (x, y) {
      return '<path class="wire late" d="M' + (x - 11) + ' ' + y + 'h22M' + (x - 7) + ' ' + (y + 5) +
             'h14M' + (x - 3) + ' ' + (y + 10) + 'h6" fill="none"/>';
    },
    // Pfeil fuer die Stromrichtung auf einer waagerechten Leitung
    flow: function (x, y) {
      return '<path class="arrow late" d="M' + (x - 6) + ' ' + (y - 5) + 'l11 5-11 5z"/>';
    },

    /* Zeichnet html in el. Beim ersten Mal laufen die Linien ein, danach nicht mehr —
       sonst wackelt das Bild bei jedem Tastendruck. */
    mount: function (el, html) {
      var again = el.dataset.drawn === '1';
      el.classList.add('dia');
      el.innerHTML = again ? html.replace(/\bdraw\b/g, '').replace(/\blate\b/g, '') : html;
      el.dataset.drawn = '1';
      if (again) return;
      Array.prototype.forEach.call(el.querySelectorAll('.draw'), function (p) {
        if (p.getTotalLength) p.style.setProperty('--len', Math.ceil(p.getTotalLength()));
      });
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else global.D = D;
})(typeof window !== 'undefined' ? window : globalThis);
