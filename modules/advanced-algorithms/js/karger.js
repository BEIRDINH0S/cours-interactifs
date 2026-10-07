/* =========================================================================
   karger.js — deroule la boucle de contraction du TP1, etape par etape.

   La trace est construite une fois pour un ordre donne : chaque etape
   contient une copie complete de l'etat (groupe, taille, membres), donc
   l'affichage d'une etape ne depend que de son indice. Avancer, reculer ou
   deplacer le curseur revient a reafficher, jamais a rejouer.
   ========================================================================= */
(function (CI, CODE) {
  "use strict";

  var G = CI.FIL_ROUGE;
  var NAME = G.names, EDGES = G.edges, N = NAME.length, M = EDGES.length;

  CI.breadcrumb(CI.el("crumb"), [
    { label: "Cours interactifs", href: "../../index.html" },
    { label: "Advanced Algorithms", href: "index.html" },
    { label: "Karger pas à pas" }
  ]);

  /* Deux ordres choisis pour ce qu'ils montrent, plus le tirage aleatoire. */
  var PRESETS = {
    A: [[1, 0], [2, 1], [2, 0], [4, 3], [5, 4], [3, 2], [5, 3]],  // 1 rejet, coupe = 1
    B: [[3, 2], [1, 0], [5, 4], [2, 0], [4, 3], [2, 1], [5, 3]]   // le pont part en premier
  };

  /* ------------------------------------------------ construction de la trace */

  function buildTrace(order) {
    var groupe = [], taille = [], membres = [], k;
    for (k = 0; k < N; k++) { groupe.push(k); taille.push(1); membres.push([k]); }
    var nb = N, tours = 0, contr = 0, rej = 0;

    var steps = [], curI = 0;

    function push(o) {
      o.state = {
        groupe: groupe.slice(),
        taille: taille.slice(),
        membres: membres.map(function (l) { return l.slice(); }),
        nb: nb, tours: tours, contr: contr, rej: rej
      };
      o.i = (o.i === undefined) ? -1 : o.i;
      o.chg = o.chg || [];
      o.doneUpTo = (o.i >= 0) ? o.i : curI;
      steps.push(o);
    }

    push({
      file: "main", line: 2, phase: "état initial",
      say: "Chaque sommet est seul dans son groupe : <code>groupe[u] = u</code>, " +
           "<code>taille[k] = 1</code>. Le tableau <code>ordre[]</code> est déjà tiré et ne bougera " +
           "plus — tout l'aléatoire de l'algorithme est là-dedans, pas dans le choix de la coupe."
    });

    var i;
    for (i = 0; i < M && nb > 2; i++) {
      var a = order[i][0], b = order[i][1];

      push({
        file: "main", line: 9, phase: "tour " + (i + 1) + " — lecture", i: i, cur: [a, b],
        say: "On lit <code>ordre[" + i + "]</code> : l'arête <code>" + CI.edgeName(NAME, [a, b]) +
             "</code>. Dans le code, <code>a = " + a + "</code> et <code>b = " + b + "</code>."
      });

      var ga = groupe[a], gb = groupe[b];

      if (ga !== gb) {
        push({
          file: "main", line: 14, phase: "tour " + (i + 1) + " — test", i: i, cur: [a, b],
          say: "<code>groupe[" + a + "] = " + ga + "</code> et <code>groupe[" + b + "] = " + gb +
               "</code> : <span class='k-ok'>groupes différents</span>, l'arête existe encore dans " +
               "le multigraphe contracté. On contracte."
        });

        var grand = groupe[a], petit = groupe[b], swapped = false;
        if (taille[petit] > taille[grand]) {
          var t = grand; grand = petit; petit = t; swapped = true;
        }
        push({
          file: "cs", line: swapped ? 12 : 8, phase: "contraction_simulee — qui absorbe qui",
          i: i, cur: [a, b],
          say: swapped
            ? "<code>taille[" + petit + "] = " + taille[petit] + "</code> dépasse <code>taille[" +
              grand + "] = " + taille[grand] + "</code> : on échange. Le groupe <code>" + petit +
              "</code> absorbe le groupe <code>" + grand + "</code>. C'est l'union par taille — on " +
              "renomme toujours le plus petit, donc un sommet n'est renommé que quand son groupe " +
              "double, au plus log₂(n) fois."
            : "Groupe de " + NAME[a] + " = <code>" + grand + "</code>, groupe de " + NAME[b] +
              " = <code>" + petit + "</code>. Tailles " + taille[grand] + " et " + taille[petit] +
              " : pas d'échange, le groupe <code>" + grand + "</code> absorbe l'autre."
        });

        var renamed = membres[petit].slice();
        renamed.forEach(function (x) { groupe[x] = grand; });
        push({
          file: "cs", line: 19, phase: "contraction_simulee — renommage", i: i, cur: [a, b],
          chg: renamed,
          say: "On parcourt <code>membres[" + petit + "]</code> et on réétiquette : " +
               renamed.map(function (x) { return "<code>groupe[" + x + "] = " + grand + "</code>"; }).join(", ") +
               ". <strong>Le graphe lui-même n'est pas touché</strong> — ni les arêtes, ni les " +
               "listes d'adjacence."
        });

        membres[grand] = membres[grand].concat(membres[petit]);
        membres[petit] = [];
        taille[grand] += taille[petit];
        taille[petit] = 0;
        nb--; contr++; tours = i + 1;
        push({
          file: "cs", line: 29, phase: "contraction_simulee — listes et tailles", i: i, cur: [a, b],
          chgT: [grand, petit],
          say: "Les deux listes sont concaténées en O(1) — on branche <code>dern</code> sur " +
               "<code>prem</code>. <code>taille[" + grand + "] = " + taille[grand] + "</code>, et " +
               "<code>taille[" + petit + "] = 0</code> marque le groupe absorbé. De retour dans " +
               "<code>main</code>, <code>nb_groupes--</code> → <strong>" + nb + "</strong>."
        });
      } else {
        rej++; tours = i + 1;
        push({
          file: "main", line: 14, phase: "tour " + (i + 1) + " — rejet", i: i, cur: [a, b],
          rejected: true,
          say: "<code>groupe[" + a + "] = groupe[" + b + "] = " + ga + "</code> : " +
               "<span class='k-no'>même groupe</span>. Cette arête a déjà été absorbée par une " +
               "contraction précédente — dans le multigraphe, elle est devenue une boucle. On la " +
               "saute, <code>nb_groupes</code> ne bouge pas : c'est un <strong>tour de boucle sans " +
               "contraction</strong>."
        });
      }
      curI = i + 1;
    }

    tours = i;
    push({
      file: "main", line: 7, phase: "sortie de boucle",
      say: "<code>nb_groupes = " + nb + "</code> : la condition <code>nb_groupes > 2</code> est " +
           "fausse, on sort. Bilan : <strong>" + contr + " contractions</strong> — exactement " +
           "<code>n−2 = " + (N - 2) + "</code>, ce n'est jamais autre chose — en <strong>" + tours +
           " tours</strong> de boucle, dont " + rej + " rejet" + (rej > 1 ? "s" : "") + "."
    });

    var cross = [];
    EDGES.forEach(function (e, idx) { if (groupe[e[0]] !== groupe[e[1]]) cross.push(idx); });
    push({
      file: "vc", line: 11, phase: "valeur_coupe — question 14", cross: cross, done: true,
      say: "On relit le <strong>graphe de départ</strong>, celui qui n'a jamais été modifié, et on " +
           "compte les arêtes dont les deux extrémités portent des étiquettes différentes : " +
           cross.map(function (idx) {
             return "<code>" + CI.edgeName(NAME, EDGES[idx]) + "</code>";
           }).join(", ") + ". <strong>Coupe = " + cross.length + "</strong>" +
           (cross.length === 1
             ? ". C'est la coupe minimum : ce tirage a eu de la chance."
             : ". La coupe minimum vaut 1 — ce tirage a contracté le pont, l'algorithme rend une " +
               "coupe trop grosse. Ce n'est pas un bug, c'est la borne 2/(n(n−1)) qui parle.")
    });

    return steps;
  }

  /* ------------------------------------------------ affichage */

  var fig = new CI.GraphFig(CI.el("svg"), { names: NAME, pos: G.pos, edges: EDGES });
  var code = new CI.CodePanel(
    { tabs: CI.el("tabs"), pre: CI.el("code"), note: CI.el("codenote") },
    CODE
  );

  var order, trace, results;

  function sameEdge(cur, u, v) {
    return cur && ((cur[0] === u && cur[1] === v) || (cur[0] === v && cur[1] === u));
  }

  function draw(idx) {
    var step = trace[idx], s = step.state;

    fig.draw({
      groupOf: function (u) { return s.groupe[u]; },
      edgeClass: function (e, k) {
        if (sameEdge(step.cur, e[0], e[1])) return "edge cur";
        if (step.cross && step.cross.indexOf(k) >= 0) return "edge cross";
        return "edge" + (s.groupe[e[0]] === s.groupe[e[1]] ? " dead" : "");
      },
      vertexNote: function (u) { return "groupe[" + u + "]=" + s.groupe[u]; },
      edgeLabel: function (e) {
        if (!sameEdge(step.cur, e[0], e[1])) return null;
        return step.rejected ? "rejetée" : "ordre[" + step.i + "]";
      }
    });

    CI.el("phase").textContent = step.phase;
    CI.el("say").innerHTML = step.say;
    CI.el("c-tours").textContent = s.tours;
    CI.el("c-contr").textContent = s.contr + " / " + (N - 2);
    CI.el("c-rej").textContent = s.rej;
    CI.el("c-grp").textContent = s.nb;

    CI.cells(CI.el("arr-groupe"), s.groupe, { changed: step.chg });
    CI.cells(CI.el("arr-taille"), s.taille, { changed: step.chgT || [], dimZero: true });

    var mb = CI.clear(CI.el("membres"));
    var slot = 0, slotOf = {};
    s.groupe.forEach(function (g) { if (!(g in slotOf)) slotOf[g] = (slot++) % 6; });
    s.membres.forEach(function (list, k) {
      if (s.taille[k] === 0) return;
      mb.appendChild(CI.h("div", { "class": "mrow g" + (slotOf[k] === undefined ? 0 : slotOf[k]) }, [
        CI.h("b", { text: "membres[" + k + "]" }),
        CI.h("span", { text: list.map(function (x) { return x + " (" + NAME[x] + ")"; }).join("  ") }),
        CI.h("span", { "class": "tail", text: "taille " + s.taille[k] })
      ]));
    });

    CI.chips(CI.el("chips"), order.map(function (e, k) {
      var state = "unused";
      if (k === step.i) state = "cur";
      else if (k < step.doneUpTo) state = (results[k] === "no" ? "done-no" : "done-ok");
      return { index: k, label: CI.edgeName(NAME, e), state: state };
    }));

    code.show(step.file, step.line);
  }

  var stepper = new CI.Stepper({
    render: draw,
    els: {
      prev: CI.el("prev"), next: CI.el("next"), play: CI.el("play"),
      scrub: CI.el("scrub"), label: CI.el("stepno")
    }
  });

  function load(newOrder) {
    order = newOrder;
    trace = buildTrace(order);
    results = [];
    trace.forEach(function (s) {
      if (s.i < 0) return;
      if (s.rejected) results[s.i] = "no";
      else if (results[s.i] !== "no") results[s.i] = "ok";
    });
    stepper.stop();
    stepper.reset(trace.length, 0);
  }

  var BUTTONS = { pA: "A", pB: "B", pR: "R" };
  Object.keys(BUTTONS).forEach(function (id) {
    CI.el(id).onclick = function () {
      Object.keys(BUTTONS).forEach(function (other) {
        CI.el(other).setAttribute("aria-pressed", other === id ? "true" : "false");
      });
      load(BUTTONS[id] === "R"
        ? CI.fisherYates(EDGES)
        : PRESETS[BUTTONS[id]].map(function (e) { return [e[0], e[1]]; }));
    };
  });

  load(PRESETS.A.map(function (e) { return [e[0], e[1]]; }));
})(window.CI, window.CI_TP1_CODE);
