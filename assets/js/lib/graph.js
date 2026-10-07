/* =========================================================================
   graph.js — figure de graphe reutilisable.

   Un graphe = des sommets a position fixe + une liste d'aretes. Tout le
   reste (couleur, bulles de groupe, aretes mises en avant, clic sur un
   sommet) est decide par la page qui l'utilise, via des fonctions.

   Usage :
     var fig = new CI.GraphFig(document.getElementById("mafig"), {
       names: ["a","b"], pos: [[10,10],[50,50]], edges: [[1,0]]
     });
     fig.draw({ groupOf: u => grp[u], edgeClass: (e,k) => "edge" });
   ========================================================================= */
window.CI = window.CI || {};

(function (CI) {
  "use strict";

  function GraphFig(svgEl, def) {
    this.svg = svgEl;
    this.names = def.names;
    this.pos = def.pos;
    this.edges = def.edges;
    this.radius = def.radius || 21;
    this.onVertexClick = def.onVertexClick || null;
    this.onEdgeClick = def.onEdgeClick || null;
  }

  /** Degre de chaque sommet dans le graphe de depart. */
  GraphFig.prototype.degrees = function () {
    var d = this.names.map(function () { return 0; });
    this.edges.forEach(function (e) { d[e[0]]++; d[e[1]]++; });
    return d;
  };

  /** Indices des aretes dont les extremites sont dans deux groupes differents. */
  GraphFig.prototype.crossing = function (groupOf) {
    var out = [];
    this.edges.forEach(function (e, k) {
      if (groupOf(e[0]) !== groupOf(e[1])) out.push(k);
    });
    return out;
  };

  /**
   * opts :
   *   groupOf(u)        -> identifiant de groupe du sommet u (obligatoire)
   *   edgeClass(e, k)   -> classe CSS de l'arete k    (defaut : .edge / .edge.dead)
   *   vertexClass(u)    -> classe CSS du groupe <g>   (defaut : g0..g5 par groupe)
   *   vertexNote(u)     -> petit texte sous le sommet (optionnel)
   *   edgeLabel(e, k)   -> etiquette au milieu d'une arete (optionnel)
   *   blobs             -> false pour ne pas dessiner les bulles de groupe
   */
  GraphFig.prototype.draw = function (opts) {
    opts = opts || {};
    var self = this;
    var groupOf = opts.groupOf || function (u) { return u; };
    CI.clear(this.svg);

    // --- index des groupes, dans un ordre stable (pour les couleurs)
    var order = [], byGroup = {};
    this.names.forEach(function (_, u) {
      var g = groupOf(u);
      if (!(g in byGroup)) { byGroup[g] = []; order.push(g); }
      byGroup[g].push(u);
    });
    var slotOf = {};
    order.forEach(function (g, i) { slotOf[g] = i % 6; });

    // --- bulles de groupe
    if (opts.blobs !== false) {
      var wrap = CI.svg("g", { opacity: "0.13" });
      order.forEach(function (g) {
        if (byGroup[g].length < 2) return;
        var pts = byGroup[g].map(function (u) { return self.pos[u]; });
        wrap.appendChild(CI.svg("path", {
          d: CI.hullPath(pts),
          "class": "hull g" + slotOf[g],
          fill: "var(--gc)", stroke: "var(--gc)"
        }));
      });
      this.svg.appendChild(wrap);
    }

    // --- aretes
    this.edges.forEach(function (e, k) {
      var cls = opts.edgeClass
        ? opts.edgeClass(e, k)
        : "edge" + (groupOf(e[0]) === groupOf(e[1]) ? " dead" : "");
      var coords = {
        x1: self.pos[e[0]][0], y1: self.pos[e[0]][1],
        x2: self.pos[e[1]][0], y2: self.pos[e[1]][1]
      };
      // une arete fine se clique mal : on superpose une piste transparente large
      if (self.onEdgeClick) {
        var hit = CI.svg("line", Object.assign({}, coords, {
          stroke: "transparent", "stroke-width": 18, "class": "edge-hit"
        }));
        hit.addEventListener("click", function () { self.onEdgeClick(k, e); });
        self.svg.appendChild(hit);
      }
      self.svg.appendChild(CI.svg("line", Object.assign({}, coords, { "class": cls })));
    });

    // --- etiquettes d'arete
    if (opts.edgeLabel) {
      this.edges.forEach(function (e, k) {
        var txt = opts.edgeLabel(e, k);
        if (!txt) return;
        self.svg.appendChild(CI.svgText({
          x: (self.pos[e[0]][0] + self.pos[e[1]][0]) / 2,
          y: (self.pos[e[0]][1] + self.pos[e[1]][1]) / 2 - 10,
          "class": "elabel"
        }, txt));
      });
    }

    // --- sommets
    this.names.forEach(function (name, u) {
      var cls = opts.vertexClass ? opts.vertexClass(u) : ("g" + slotOf[groupOf(u)]);
      var g = CI.svg("g", { "class": cls });

      var circle = CI.svg("circle", {
        cx: self.pos[u][0], cy: self.pos[u][1], r: self.radius,
        "class": "vcirc" + (self.onVertexClick ? " clickable" : "")
      });
      if (self.onVertexClick) {
        circle.addEventListener("click", function () { self.onVertexClick(u); });
      }
      g.appendChild(circle);
      g.appendChild(CI.svgText({ x: self.pos[u][0], y: self.pos[u][1], "class": "vlabel" }, name));

      if (opts.vertexNote) {
        var note = opts.vertexNote(u);
        if (note) {
          g.appendChild(CI.svgText({
            x: self.pos[u][0], y: self.pos[u][1] + self.radius + 17, "class": "vnote"
          }, note));
        }
      }
      self.svg.appendChild(g);
    });
  };

  CI.GraphFig = GraphFig;

  /* ---------------------------------------------------------------------
     Le graphe fil rouge des lecons : deux triangles relies par un pont.
     Coupe minimum = le pont c-d, de valeur 1.
     Les aretes sont stockees (u, v) avec u > v, comme la collecte depuis
     les listes d'adjacence.
     --------------------------------------------------------------------- */
  CI.FIL_ROUGE = {
    names: ["a", "b", "c", "d", "e", "f"],
    pos: [[110, 70], [55, 185], [175, 185], [345, 185], [465, 185], [405, 70]],
    edges: [[1, 0], [2, 0], [2, 1], [3, 2], [4, 3], [5, 3], [5, 4]],
    viewBox: "0 0 520 250",
    bridge: 3 // index de l'arete c-d dans edges
  };
})(window.CI);
