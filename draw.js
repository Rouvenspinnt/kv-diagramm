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

    /* Einzelkurve mit Achsen. Eine Reihe, also keine Legende — der Titel nennt sie.
       Farben der Kurve kommen aus den Tokens, Beschriftungen bleiben Textfarbe. */
    chart: function (o) {
      var w = o.w || 440, h = o.h || 206, L = 52, R = 18, T = 28, B = 32;
      var fx = function (v) { return esc(String(o.fx(v)).trim()); };
      var fy = function (v) { return esc(String(o.fy(v)).trim()); };
      var xs = o.xs, ys = o.ys, n = xs.length;
      var tr = o.logx ? Math.log : function (v) { return v; };
      var x0 = tr(o.x0), x1 = tr(o.x1);
      var y0 = 0, y1 = o.y1 || Math.max.apply(null, ys) * 1.12;
      if (!(x1 > x0) || !(y1 > y0) || n < 2) return '';
      function px(v) { return L + (tr(v) - x0) / (x1 - x0) * (w - L - R); }
      function py(v) { return h - B - (Math.min(v, y1) - y0) / (y1 - y0) * (h - T - B); }

      var g = '', i, v;
      for (i = 0; i <= 3; i++) {                       // Achsenteilung, zurueckhaltend
        v = y0 + (y1 - y0) * i / 3;
        g += '<line class="grid" x1="' + L + '" y1="' + py(v).toFixed(1) + '" x2="' + (w - R) +
             '" y2="' + py(v).toFixed(1) + '"/>' +
             '<text class="tick" x="' + (L - 7) + '" y="' + (py(v) + 3.5).toFixed(1) +
             '" text-anchor="end">' + fy(v) + '</text>';
      }
      for (i = 0; i <= 3; i++) {
        var xv = o.logx ? Math.exp(x0 + (x1 - x0) * i / 3) : x0 + (x1 - x0) * i / 3;
        g += '<text class="tick" x="' + px(xv).toFixed(1) + '" y="' + (h - B + 15) + '">' +
             fx(xv) + '</text>';
      }
      var zuege = [], lauf = [];              // ueber dem Deckel bricht die Kurve ab,
      for (i = 0; i < n; i++) {                 // sonst sieht die Kappung aus wie ein Plateau
        if (ys[i] > y1) { if (lauf.length > 1) zuege.push(lauf); lauf = []; continue; }
        lauf.push(px(xs[i]).toFixed(1) + ',' + py(ys[i]).toFixed(1));
      }
      if (lauf.length > 1) zuege.push(lauf);
      var body =
        '<line class="axis" x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + (h - B) + '"/>' +
        '<line class="axis" x1="' + L + '" y1="' + (h - B) + '" x2="' + (w - R) + '" y2="' + (h - B) + '"/>' +
        g +
        (o.mark ? '<line class="mark" x1="' + px(o.mark.x).toFixed(1) + '" y1="' + T + '" x2="' +
                  px(o.mark.x).toFixed(1) + '" y2="' + (h - B) + '"/>' +
                  '<text class="tick hi" x="' + px(o.mark.x).toFixed(1) + '" y="' + (T + 10) + '">' +
                  esc(o.mark.label) + '</text>' : '') +
        zuege.map(function (z) { return '<polyline class="curve" points="' + z.join(' ') + '"/>'; }).join('') +
        (o.point ? '<circle class="pt" cx="' + px(o.point.x).toFixed(1) + '" cy="' +
                   py(o.point.y).toFixed(1) + '" r="4.5"/>' +
                   '<text class="ptlab" x="' + Math.min(w - R - 4, px(o.point.x) + 9).toFixed(1) +
                   '" y="' + Math.max(T + 10, py(o.point.y) - 9).toFixed(1) + '" text-anchor="start">' +
                   esc(o.point.label) + '</text>' : '') +
        '<text class="axlab" x="' + (w - R) + '" y="' + (h - 4) + '" text-anchor="end">' + esc(o.xlab) + '</text>' +
        '<text class="axlab" x="6" y="' + (T - 14) + '" text-anchor="start">' + esc(o.ylab) + '</text>' +
        '<line class="cross" x1="0" y1="' + T + '" x2="0" y2="' + (h - B) + '" style="display:none"/>' +
        '<text class="read" x="0" y="' + (T + 25) + '" style="display:none"></text>' +
        '<rect class="hit" x="' + L + '" y="' + T + '" width="' + (w - L - R) + '" height="' + (h - T - B) +
        '" fill="transparent"/>';
      return D.svg(w, h, o.title, body);
    },

    /* Kurve einhaengen und den Ablesestrich verdrahten */
    mountChart: function (el, o) {
      D.mount(el, D.chart(o));
      var svg = el.querySelector('svg'), hit = svg && svg.querySelector('.hit');
      if (!hit) return;
      var cross = svg.querySelector('.cross'), read = svg.querySelector('.read');
      var w = o.w || 440, L = 52, R = 18, n = o.xs.length;
      function show(e) {
        var r = svg.getBoundingClientRect();
        var t = ((e.clientX - r.left) / r.width * w - L) / (w - L - R);
        var i = Math.max(0, Math.min(n - 1, Math.round(t * (n - 1))));
        var x = L + (i / (n - 1)) * (w - L - R);
        cross.setAttribute('x1', x); cross.setAttribute('x2', x);
        cross.style.display = '';
        read.setAttribute('x', x < w / 2 ? x + 6 : x - 6);
        read.setAttribute('text-anchor', x < w / 2 ? 'start' : 'end');
        read.textContent = o.readout(o.xs[i], o.ys[i]);
        read.style.display = '';
      }
      function hide() { cross.style.display = 'none'; read.style.display = 'none'; }
      hit.addEventListener('pointermove', show);
      hit.addEventListener('pointerleave', hide);
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
