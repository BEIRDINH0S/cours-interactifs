/* =========================================================================
   core.js — briques de base partagees par tous les modules.
   Script classique (pas de module ES) pour que l'ouverture directe d'un
   fichier HTML, sans serveur, continue de fonctionner.
   ========================================================================= */
window.CI = window.CI || {};

(function (CI) {
  "use strict";

  /* ---------------------------------------------------------------- DOM */

  CI.el = function (id) { return document.getElementById(id); };

  CI.clear = function (node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
    return node;
  };

  /** Cree un element : CI.h("div", {class:"x"}, "texte" | [enfants]) */
  CI.h = function (tag, attrs, children) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === "html") e.innerHTML = attrs[k];
      else if (k === "text") e.textContent = attrs[k];
      else if (k === "style" && typeof attrs[k] === "object") Object.assign(e.style, attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    if (children == null) return e;
    (Array.isArray(children) ? children : [children]).forEach(function (c) {
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return e;
  };

  /**
   * Rend un tableau de valeurs sous forme de cases indexees.
   * opts : { changed:[indices], dimZero:bool, labels:[...] }
   */
  CI.cells = function (target, values, opts) {
    opts = opts || {};
    var changed = opts.changed || [];
    CI.clear(target);
    values.forEach(function (v, k) {
      var cls = "cell";
      if (changed.indexOf(k) >= 0) cls += " chg";
      if (opts.dimZero && v === 0) cls += " zero";
      target.appendChild(CI.h("div", { "class": cls }, [
        CI.h("div", { "class": "ix", text: opts.labels ? opts.labels[k] : String(k) }),
        CI.h("div", { "class": "bx", text: String(v) })
      ]));
    });
  };

  /**
   * Rend une suite de pastilles.
   * items : [{ label, index, state }]  state : "cur" | "done-ok" | "done-no" | "unused"
   */
  CI.chips = function (target, items) {
    CI.clear(target);
    items.forEach(function (it) {
      target.appendChild(CI.h("div", { "class": "chip " + (it.state || "") }, [
        CI.h("span", { "class": "i", text: "[" + it.index + "]" }),
        document.createTextNode(it.label)
      ]));
    });
  };

  /* ---------------------------------------------------------------- SVG */

  var NS = "http://www.w3.org/2000/svg";

  CI.svg = function (tag, attrs) {
    var e = document.createElementNS(NS, tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  };

  CI.svgText = function (attrs, txt) {
    var e = CI.svg("text", attrs);
    e.textContent = txt;
    return e;
  };

  /**
   * Enveloppe convexe d'un nuage de points (Andrew monotone chain).
   * Rendue en chemin ; tracee avec un stroke epais et des jointures rondes,
   * elle donne la bulle arrondie qui entoure un groupe de sommets.
   */
  CI.hullPath = function (pts) {
    if (!pts.length) return "";
    if (pts.length === 1) return "M" + pts[0][0] + " " + pts[0][1] + " L" + pts[0][0] + " " + pts[0][1];
    if (pts.length === 2) return "M" + pts[0][0] + " " + pts[0][1] + " L" + pts[1][0] + " " + pts[1][1];

    var p = pts.slice().sort(function (u, v) { return u[0] - v[0] || u[1] - v[1]; });
    function cross(o, a, b) {
      return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    }
    var lo = [], up = [], i;
    for (i = 0; i < p.length; i++) {
      while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p[i]) <= 0) lo.pop();
      lo.push(p[i]);
    }
    for (i = p.length - 1; i >= 0; i--) {
      while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p[i]) <= 0) up.pop();
      up.push(p[i]);
    }
    var h = lo.slice(0, -1).concat(up.slice(0, -1));
    return "M" + h.map(function (q) { return q[0] + " " + q[1]; }).join(" L") + " Z";
  };

  /* ---------------------------------------------------------------- divers */

  /** Melange de Fisher-Yates, identique a celui du TP1 (tirage dans [i, m-1]). */
  CI.fisherYates = function (arr) {
    var a = arr.slice();
    for (var i = 0; i < a.length - 1; i++) {
      var j = i + Math.floor(Math.random() * (a.length - i));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  /**
   * Nom lisible d'une arete. Les aretes sont stockees (u, v) avec u > v,
   * comme la collecte du TP1 ; on les affiche dans l'ordre des sommets.
   */
  CI.edgeName = function (names, e) {
    var lo = Math.min(e[0], e[1]), hi = Math.max(e[0], e[1]);
    return names[lo] + "—" + names[hi];
  };

  /** 3,6 % plutot que 3.6 % */
  CI.pct = function (x, digits) {
    return (x * 100).toFixed(digits == null ? 1 : digits).replace(".", ",") + " %";
  };

  /** En-tete de navigation commune a toutes les pages de module. */
  CI.breadcrumb = function (target, items) {
    CI.clear(target);
    items.forEach(function (it, i) {
      if (i) target.appendChild(CI.h("span", { "class": "sep", text: "/" }));
      target.appendChild(it.href
        ? CI.h("a", { href: it.href, text: it.label })
        : CI.h("span", { text: it.label }));
    });
  };
})(window.CI);
