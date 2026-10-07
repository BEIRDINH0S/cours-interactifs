/* =========================================================================
   lecon-mincut.js — la lecon « coupe minimum », une idee par ecran.

   Les etapes sont des donnees ; le lecteur qui les enchaine vit dans
   assets/js/lib/lesson.js et sert a toutes les lecons du site.
   ========================================================================= */
(function (CI) {
  "use strict";

  var G = CI.FIL_ROUGE;
  var NAME = G.names, EDGES = G.edges, N = NAME.length;


  /* ------------------------------------------------ outils communs */

  function freshGroups() {
    var g = [];
    for (var i = 0; i < N; i++) g.push(i);
    return g;
  }

  /** Contracte l'arete k dans l'etiquetage grp. Rend false si elle est deja interne. */
  function contract(grp, k) {
    var e = EDGES[k], ga = grp[e[0]], gb = grp[e[1]];
    if (ga === gb) return false;
    var keep = Math.min(ga, gb), drop = Math.max(ga, gb);
    for (var u = 0; u < N; u++) if (grp[u] === drop) grp[u] = keep;
    return true;
  }

  function nbGroups(grp) {
    var seen = {}, n = 0;
    grp.forEach(function (g) { if (!(g in seen)) { seen[g] = 1; n++; } });
    return n;
  }

  function cutValue(grp) {
    var v = 0;
    EDGES.forEach(function (e) { if (grp[e[0]] !== grp[e[1]]) v++; });
    return v;
  }

  /** Une execution complete de l'algorithme sur un ordre aleatoire. */
  function runOnce() {
    var order = CI.fisherYates(EDGES.map(function (e, k) { return k; }));
    var grp = freshGroups(), n = N;
    for (var i = 0; i < order.length && n > 2; i++) {
      if (contract(grp, order[i])) n--;
    }
    return cutValue(grp);
  }

  /** Combien d'aretes relient le groupe de u au groupe de v, apres contractions. */
  function parallelCount(grp, ga, gb) {
    var c = 0;
    EDGES.forEach(function (e) {
      var x = grp[e[0]], y = grp[e[1]];
      if ((x === ga && y === gb) || (x === gb && y === ga)) c++;
    });
    return c;
  }

  function bigNumber(x) {
    if (x < 1e6) return x.toLocaleString("fr-FR");
    var exp = Math.floor(Math.log10(x));
    return "10 puissance " + exp;
  }

  /* ------------------------------------------------ les etapes */

  var STEPS = [

    /* 1 ------------------------------------------------------------------ */
    {
      chap: "Le problème",
      titre: "Coupe le graphe en deux",
      say: "<p class='say'>Voici six points reliés par sept liens. Clique sur un point pour " +
           "l'envoyer de l'autre côté.</p>" +
           "<p class='say'>Les liens qui se retrouvent à cheval sur la séparation passent en rouge : " +
           "ce sont eux qu'on compte.</p>",
      goal: "Trouve une séparation qui ne coupe qu'<strong>un seul</strong> lien.",
      mount: function (api) {
        var side = [1, 1, 1, 1, 1, 1];
        api.fig.onVertexClick = function (u) { side[u] = 1 - side[u]; redraw(); };

        function redraw() {
          var cross = api.fig.crossing(function (u) { return side[u]; });
          api.fig.draw({
            groupOf: function (u) { return side[u]; }, blobs: false,
            edgeClass: function (e, k) { return "edge" + (cross.indexOf(k) >= 0 ? " cross" : ""); },
            vertexClass: function (u) { return side[u] === 0 ? "sideA" : "sideB"; }
          });

          var a = 0;
          side.forEach(function (s) { if (s === 0) a++; });
          var valide = (a > 0 && a < N);
          api.readout([{ t: "liens coupés", v: valide ? cross.length : "—",
                         cls: valide && cross.length === 1 ? "good" : "" }]);

          if (!valide) {
            api.fb("Tous les points sont du même côté : il n'y a pas de séparation.", "ko");
          } else if (cross.length === 1) {
            api.fb("Un seul lien coupé. Impossible de faire mieux ici — tu viens de trouver la " +
                   "<strong>coupe minimum</strong>.", "ok");
            api.solve();
          } else {
            api.fb(cross.length + " liens coupés. On peut descendre plus bas.");
          }
        }
        redraw();
      }
    },

    /* 2 ------------------------------------------------------------------ */
    {
      chap: "Le problème",
      titre: "Deux mots, et c'est tout",
      say: "<p class='say'>Une <strong>coupe</strong>, c'est exactement ce que tu viens de faire : " +
           "répartir les points en deux groupes, aucun vide.</p>" +
           "<p class='say'>Sa <strong>valeur</strong>, c'est le nombre de liens qui traversent. " +
           "Le problème de la <strong>coupe minimum</strong> demande celle de plus petite valeur.</p>" +
           "<p class='say'>Déplace encore quelques points pour voir la valeur bouger.</p>",
      mount: function (api) {
        var side = [0, 0, 0, 1, 1, 1];
        api.fig.onVertexClick = function (u) { side[u] = 1 - side[u]; redraw(); };

        function redraw() {
          var cross = api.fig.crossing(function (u) { return side[u]; });
          api.fig.draw({
            groupOf: function (u) { return side[u]; }, blobs: false,
            edgeClass: function (e, k) { return "edge" + (cross.indexOf(k) >= 0 ? " cross" : ""); },
            vertexClass: function (u) { return side[u] === 0 ? "sideA" : "sideB"; }
          });
          var A = [], B = [];
          NAME.forEach(function (n, u) { (side[u] === 0 ? A : B).push(n); });
          api.readout([
            { t: "groupe 1", v: A.length ? A.join(" ") : "vide", small: true },
            { t: "groupe 2", v: B.length ? B.join(" ") : "vide", small: true },
            { t: "valeur", v: cross.length, cls: cross.length === 1 ? "good" : "" }
          ]);
        }
        redraw();
        api.solve();
      }
    },

    /* 3 ------------------------------------------------------------------ */
    {
      chap: "Le problème",
      titre: "Pourquoi on ne peut pas toutes les essayer",
      say: "<p class='say'>Sur six points, tu peux tester les séparations à la main. Au-delà, le " +
           "nombre de coupes possibles vaut <strong>2<sup>n−1</sup> − 1</strong>.</p>" +
           "<p class='say'>Fais glisser le curseur et regarde combien de temps il faudrait pour " +
           "toutes les examiner, à un milliard par seconde.</p>",
      goal: "Monte jusqu'à ce que le temps dépasse l'âge de l'univers.",
      mount: function (api) {
        var n = 6;
        var slider = CI.h("input", { type: "range", min: "4", max: "120", value: "6", id: "n-coupes" });
        var lab = CI.h("span", { "class": "mono", text: "n = 6" });
        api.tools([lab, slider]);
        api.figHidden(true);

        var AGE_UNIVERS = 4.35e17; // secondes

        function redraw() {
          var coupes = Math.pow(2, n - 1) - 1;
          var secondes = coupes / 1e9;
          var txt;
          if (secondes < 60) txt = secondes.toFixed(secondes < 1 ? 6 : 1) + " s";
          else if (secondes < 3600) txt = (secondes / 60).toFixed(1) + " min";
          else if (secondes < 86400 * 365) txt = (secondes / 86400).toFixed(1) + " jours";
          else if (secondes < AGE_UNIVERS) txt = bigNumber(Math.round(secondes / (86400 * 365))) + " ans";
          else txt = bigNumber(Math.round(secondes / AGE_UNIVERS)) + " fois l'âge de l'univers";

          lab.textContent = "n = " + n;
          api.readout([
            { t: "coupes possibles", v: bigNumber(coupes), small: true },
            { t: "temps de calcul", v: txt, small: true, cls: secondes >= AGE_UNIVERS ? "bad" : "" }
          ]);

          if (secondes >= AGE_UNIVERS) {
            api.fb("Soixante points suffisent à rendre l'énumération impossible. Il faut une autre " +
                   "idée — et elle va être étonnamment simple.", "ok");
            api.solve();
          } else {
            api.fb("Encore jouable. Continue de monter.");
          }
        }
        slider.addEventListener("input", function (e) { n = +e.target.value; redraw(); });
        redraw();
      }
    },

    /* 4 ------------------------------------------------------------------ */
    {
      chap: "L'algorithme",
      titre: "L'idée : coller deux points ensemble",
      say: "<p class='say'>Clique sur un <strong>lien</strong> : ses deux extrémités fusionnent en " +
           "un seul point. On appelle ça <strong>contracter</strong>.</p>" +
           "<p class='say'>Rien n'est supprimé : les liens qui sortent du groupe restent là. Seuls " +
           "ceux devenus internes au groupe s'effacent.</p>",
      goal: "Contracte jusqu'à ce qu'il ne reste que deux groupes.",
      mount: function (api) {
        var grp = freshGroups();
        api.fig.onEdgeClick = function (k) {
          if (contract(grp, k)) redraw();
        };
        var reset = CI.h("button", { text: "Recommencer" });
        reset.onclick = function () { grp = freshGroups(); redraw(); };
        api.tools([reset]);

        function redraw() {
          api.fig.draw({ groupOf: function (u) { return grp[u]; } });
          var n = nbGroups(grp);
          api.readout([
            { t: "groupes", v: n },
            { t: "liens restants", v: cutValue(grp) }
          ]);
          if (n > 2) {
            api.fb("Clique un lien plein. Les pointillés sont internes à un groupe : il n'y a plus " +
                   "rien à fusionner dessus.");
          } else {
            var v = cutValue(grp);
            api.fb("Deux groupes : c'est une coupe, de valeur <strong>" + v + "</strong>. " +
                   (v === 1 ? "Celle-ci est la meilleure possible." :
                    "La meilleure vaut 1 — là, tu as fusionné le mauvais lien.") +
                   " Recommence pour voir que le résultat change.", "ok");
            api.solve();
          }
        }
        redraw();
      }
    },

    /* 5 ------------------------------------------------------------------ */
    {
      chap: "L'algorithme",
      titre: "Les liens en double comptent",
      say: "<p class='say'>Les deux points de gauche viennent d'être collés. Regarde ce qui relie " +
           "ce groupe au point voisin.</p>",
      goal: "Combien de liens relient le groupe fusionné à <strong>c</strong> ?",
      mount: function (api) {
        var grp = freshGroups();
        contract(grp, 0); // a-b
        api.fig.draw({
          groupOf: function (u) { return grp[u]; },
          edgeLabel: function (e) {
            var x = grp[e[0]], y = grp[e[1]], ab = grp[0], c = grp[2];
            return ((x === ab && y === c) || (x === c && y === ab)) ? "compte" : null;
          }
        });
        var good = parallelCount(grp, grp[0], grp[2]);
        api.readout([{ t: "groupe fusionné", v: "{a, b}", small: true }]);

        var btns = [1, 2, 3].map(function (v) {
          var b = CI.h("button", { text: String(v) });
          b.onclick = function () {
            if (v === good) {
              b.className = "right";
              api.fb("Oui : <strong>a—c</strong> et <strong>b—c</strong> existent toutes les deux, " +
                     "et elles restent toutes les deux. Un graphe qui autorise ces liens en double " +
                     "s'appelle un <strong>multigraphe</strong> — c'est pour ça que l'algorithme en " +
                     "a besoin : chaque doublon compte dans la valeur de la coupe.", "ok");
              api.solve();
            } else {
              b.className = "wrong";
              api.fb("Non. Regarde les deux liens qui partaient vers c avant la fusion : aucun n'a " +
                     "disparu.", "ko");
            }
          };
          return b;
        });
        api.tools(btns);
      }
    },

    /* 6 ------------------------------------------------------------------ */
    {
      chap: "L'algorithme",
      titre: "L'algorithme tient en une phrase",
      say: "<p class='say'><strong>Tire un lien au hasard, contracte-le, recommence jusqu'à ce qu'il " +
           "ne reste que deux groupes.</strong></p>" +
           "<p class='say'>C'est tout. Rien ne garantit le bon résultat — alors lance-le plusieurs " +
           "fois et regarde ce qui sort.</p>",
      goal: "Lance l'algorithme au moins 20 fois.",
      mount: function (api) {
        var tally = { 1: 0, 2: 0 }, total = 0;
        api.figHidden(true);

        var bar = CI.h("div", { "class": "tally" });
        var one = CI.h("button", { text: "Lancer une fois" });
        var ten = CI.h("button", { "class": "primary", text: "Lancer 10 fois" });
        api.tools([one, ten]);
        api.readoutNode(bar);

        function draw() {
          CI.clear(bar);
          [1, 2].forEach(function (v) {
            var pc = total ? tally[v] / total : 0;
            bar.appendChild(CI.h("div", { "class": "line" }, [
              CI.h("span", { "class": "lab", text: "coupe " + v }),
              CI.h("span", { "class": "track" }, [
                CI.h("span", { "class": "fill" + (v === 1 ? " good" : ""),
                               style: { width: (pc * 100).toFixed(0) + "%" } })
              ]),
              CI.h("span", { "class": "cnt", text: String(tally[v]) })
            ]));
          });
          bar.appendChild(CI.h("div", { "class": "line" }, [
            CI.h("span", { "class": "lab", text: "essais" }),
            CI.h("span", { "class": "cnt", text: String(total) })
          ]));

          if (total >= 20) {
            var pc1 = Math.round(100 * tally[1] / total);
            api.fb("Sur " + total + " essais, la coupe minimum est sortie <strong>" + pc1 +
                   " %</strong> du temps. L'algorithme se trompe souvent — et pourtant il est " +
                   "utile. La suite explique pourquoi.", "ok");
            api.solve();
          } else {
            api.fb("Relance encore : une seule exécution ne dit rien.");
          }
        }
        function go(n) {
          for (var i = 0; i < n; i++) { tally[runOnce()]++; total++; }
          draw();
        }
        one.onclick = function () { go(1); };
        ten.onclick = function () { go(10); };
        draw();
      }
    },

    /* 7 ------------------------------------------------------------------ */
    {
      chap: "La preuve",
      titre: "Un point tout seul, c'est déjà une coupe",
      say: "<p class='say'>Clique sur un point pour l'isoler du reste.</p>" +
           "<p class='say'>La valeur que tu lis est son nombre de liens — son <strong>degré</strong>. " +
           "Et comme c'est une coupe valide, elle ne peut pas être plus petite que la coupe minimum.</p>",
      goal: "Isole le point qui a le moins de liens.",
      mount: function (api) {
        var lone = -1;
        var deg = api.fig.degrees();
        var minDeg = Math.min.apply(null, deg);
        api.fig.onVertexClick = function (u) { lone = (lone === u ? -1 : u); redraw(); };

        function redraw() {
          var side = NAME.map(function (_, u) { return u === lone ? 0 : 1; });
          var cross = api.fig.crossing(function (u) { return side[u]; });
          api.fig.draw({
            groupOf: function (u) { return side[u]; }, blobs: false,
            edgeClass: function (e, k) { return "edge" + (cross.indexOf(k) >= 0 ? " cross" : ""); },
            vertexClass: function (u) { return side[u] === 0 ? "sideA" : "sideB"; },
            vertexNote: function (u) { return "degré " + deg[u]; }
          });
          if (lone < 0) {
            api.readout([{ t: "valeur de la coupe", v: "—" }]);
            api.fb("Choisis un point.");
            return;
          }
          api.readout([
            { t: "valeur de la coupe", v: cross.length },
            { t: "degré de " + NAME[lone], v: deg[lone] }
          ]);
          if (deg[lone] === minDeg) {
            api.fb("Les deux nombres sont égaux, et ce n'est pas un hasard. Avec le plus petit degré " +
                   "du graphe, tu obtiens la meilleure borne de cette forme : la coupe minimum " +
                   "<strong>k ne dépasse jamais " + minDeg + "</strong>. Retourne la phrase, et tu " +
                   "tiens le point d'appui de toute la preuve : <strong>tout point a un degré ≥ k</strong>.", "ok");
            api.solve();
          } else {
            api.fb("Valeur = degré, toujours. Mais il existe un point moins relié : trouve-le.");
          }
        }
        redraw();
      }
    },

    /* 8 ------------------------------------------------------------------ */
    {
      chap: "La preuve",
      titre: "La chance de ne pas se tromper",
      say: "<p class='say'>L'algorithme réussit s'il ne contracte <em>jamais</em> un lien de la coupe " +
           "minimum. À chaque étape, la probabilité d'en toucher un est au plus " +
           "<strong>2/(nombre de groupes restants)</strong>.</p>" +
           "<p class='say'>Ça vient de l'étape précédente : si chaque point a au moins k liens, c'est " +
           "qu'il y a beaucoup de liens au total, donc peu de chances de tomber sur les k mauvais.</p>" +
           "<p class='say'>En multipliant les étapes, on obtient une chaîne de fractions. Annule-les.</p>",
      goal: "Annule tous les termes et lis ce qui reste.",
      mount: function (api) {
        var n = 6, cut = 0;
        api.figHidden(true);

        var slider = CI.h("input", { type: "range", min: "4", max: "14", value: "6", id: "n-borne" });
        var lab = CI.h("span", { "class": "mono", text: "n = 6" });
        var step = CI.h("button", { "class": "primary", text: "Annuler un terme" });
        var all = CI.h("button", { text: "Tout annuler" });
        api.tools([lab, slider, step, all]);

        var prod = CI.h("div", { "class": "prod" });
        var box = CI.h("div", { "class": "tw" }, [prod]);
        api.readoutNode(box);

        function pairs(m) { return Math.max(0, (m - 2) - 3 + 1); }

        function draw() {
          CI.clear(prod);
          var maxC = pairs(n), gone = [], i;
          for (i = 0; i < Math.min(cut, maxC); i++) gone.push(n - 2 - i);

          for (i = 1; i <= n - 2; i++) {
            var num = n - i - 1, den = n - i + 1;
            if (i > 1) prod.appendChild(CI.h("span", { "class": "x", text: "×" }));
            prod.appendChild(CI.h("span", { "class": "frac" }, [
              CI.h("span", { "class": "n" + (gone.indexOf(num) >= 0 ? " gone" : (cut >= maxC ? " keep" : "")), text: String(num) }),
              CI.h("span", { "class": "d" + (gone.indexOf(den) >= 0 ? " gone" : (cut >= maxC ? " keep" : "")), text: String(den) })
            ]));
          }
          lab.textContent = "n = " + n;
          step.disabled = (cut >= maxC);

          if (cut >= maxC) {
            api.readout([
              { t: "il reste", v: "2 / " + n + "·" + (n - 1), cls: "good" },
              { t: "soit", v: CI.pct(2 / (n * (n - 1))), small: true }
            ], box);
            api.fb("Tout s'efface sauf deux numérateurs et deux dénominateurs : la probabilité de " +
                   "réussir vaut <strong>2/n(n−1)</strong>. Change n et recommence — la forme ne " +
                   "bouge jamais.", "ok");
            api.solve();
          } else {
            api.readout([{ t: "il reste", v: "…" }], box);
            api.fb("Chaque terme vaut (n−i−1)/(n−i+1) : le numérateur d'un terme est le dénominateur " +
                   "d'un autre, deux crans plus loin.");
          }
        }
        slider.addEventListener("input", function (e) { n = +e.target.value; cut = 0; draw(); });
        step.onclick = function () { cut++; draw(); };
        all.onclick = function () { cut = pairs(n); draw(); };
        draw();
      }
    },

    /* 9 ------------------------------------------------------------------ */
    {
      chap: "La preuve",
      titre: "Une chance faible reste une chance",
      say: "<p class='say'>Sur six points, l'algorithme réussit une fois sur quinze. C'est peu — " +
           "mais c'est une probabilité qui ne dépend que de n, jamais de la forme du graphe.</p>" +
           "<p class='say'>Compare avec les essais que tu as lancés : la proportion observée colle à " +
           "la borne.</p>",
      goal: null,
      mount: function (api) {
        var n = 6;
        api.figHidden(true);
        var slider = CI.h("input", { type: "range", min: "4", max: "60", value: "6", id: "n-final" });
        var lab = CI.h("span", { "class": "mono", text: "n = 6" });
        api.tools([lab, slider]);

        function draw() {
          var p = 2 / (n * (n - 1));
          lab.textContent = "n = " + n;
          api.readout([
            { t: "chance par essai", v: CI.pct(p, p < 0.001 ? 4 : 1), small: true },
            { t: "soit environ", v: "1 sur " + Math.round(1 / p), small: true }
          ]);
          api.fb("Garde ce nombre en tête : il est faible, mais il ne s'effondre pas — il décroît " +
                 "comme n², pas comme 2ⁿ. C'est toute la différence avec l'énumération du début.");
        }
        slider.addEventListener("input", function (e) { n = +e.target.value; draw(); });
        draw();
        api.solve();
      }
    },

    /* 10 ----------------------------------------------------------------- */
    {
      chap: "Bilan",
      titre: "Ce que tu sais maintenant",
      say: "<p class='say'>Une <strong>coupe</strong> sépare les points en deux groupes ; sa valeur " +
           "compte les liens qui traversent.</p>" +
           "<p class='say'>Les énumérer toutes est impossible dès quelques dizaines de points.</p>" +
           "<p class='say'><strong>Contracter un lien au hasard</strong>, encore et encore, donne la " +
           "coupe minimum avec une probabilité d'au moins <strong>2/n(n−1)</strong>.</p>" +
           "<p class='say'>La preuve tient à une observation : un point isolé forme une coupe, donc " +
           "tout point a un degré au moins égal à la coupe minimum.</p>",
      goal: null,
      mount: function (api) {
        api.figHidden(true);
        api.readoutNode(CI.h("div", { "class": "done-screen" }, [
          CI.h("div", { "class": "big", text: "✓" }),
          CI.h("p", { "class": "say", text: "Leçon terminée." })
        ]));
        var atelier = CI.h("a", { "class": "linkcard", href: "karger.html" }, [
          CI.h("div", { "class": "k", text: "pour aller plus loin" }),
          CI.h("div", { "class": "t", text: "Dérouler l'algorithme, instruction par instruction" }),
          CI.h("div", { "class": "d", text: "L'atelier montre l'implémentation en C et l'état de ses tableaux à chaque tour de boucle." })
        ]);
        api.tools([atelier]);
        api.solve();
      }
    }
  ];

  /* ------------------------------------------------ demarrage */

  CI.Lesson({
    steps: STEPS,
    key: "lecon-mincut-progres",
    titre: "Coupe minimum",
    sousTitre: "Séparer un graphe en deux au moindre coût — et pourquoi un algorithme qui tire au " +
               "hasard y arrive mieux que l'énumération.",
    graph: { names: NAME, pos: G.pos, edges: EDGES }
  });
})(window.CI);
