/* =========================================================================
   lecon-repetition.js — la lecon « repeter pour fiabiliser ».

   Elle prend la suite de lecon-mincut.js, qui s'arrete sur la borne
   2/n(n-1) : une execution de l'algorithme de Karger echoue presque
   toujours. Cette lecon montre comment N executions independantes
   transforment cette quasi-certitude d'echec en quasi-certitude de succes,
   ce que ca coute, et ce que les mesures du TP en disent vraiment.

   Les etapes sont des donnees ; le lecteur qui les enchaine vit dans
   assets/js/lib/lesson.js et sert a toutes les lecons du site.
   ========================================================================= */
(function (CI) {
  "use strict";

  var G = CI.FIL_ROUGE;
  var NAME = G.names, EDGES = G.edges, N = NAME.length;

  /* Les relevés du TP, s'ils sont charges (data/mesures-tp.js). */
  var MES = window.CI_MESURES_TP || [];

  var COUPE_MIN = 1;                  // le pont c-d du graphe fil rouge
  var BORNE   = 2 / (N * (N - 1));    // 1/15 : la borne du cours pour n = 6
  var EPS     = 0.001;                // l'exigence du TP : succes avec p >= 0,999
  var LN_EPS  = Math.log(1 / EPS);    // ln(1000) = 6,908...


  /* ------------------------------------------------ l'algorithme, en petit */

  function freshGroups() {
    var g = [], i;
    for (i = 0; i < N; i++) g.push(i);
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

  function cutValue(grp) {
    var v = 0;
    EDGES.forEach(function (e) { if (grp[e[0]] !== grp[e[1]]) v++; });
    return v;
  }

  /** Une execution complete sur un ordre d'aretes donne. */
  function runOrder(order) {
    var grp = freshGroups(), reste = N, i;
    for (i = 0; i < order.length && reste > 2; i++) {
      if (contract(grp, order[i])) reste--;
    }
    return { cut: cutValue(grp), grp: grp };
  }

  function runOnce() {
    return runOrder(CI.fisherYates(EDGES.map(function (e, k) { return k; })));
  }


  /* ------------------------------------------------ la probabilite exacte

     Le resultat d'une execution ne depend que de l'ordre tire sur les
     7 aretes. Il n'y a que 7! = 5040 ordres : on peut donc tous les
     parcourir et obtenir la probabilite de succes EXACTE, sans estimation.
     C'est elle qu'on comparera a la borne du cours.                        */

  /** Parcourt toutes les permutations de arr (algorithme de Heap, iteratif). */
  function permuter(arr, visiter) {
    var n = arr.length, a = arr.slice(), c = [], i, j, t;
    for (i = 0; i < n; i++) c.push(0);
    visiter(a);
    i = 0;
    while (i < n) {
      if (c[i] < i) {
        j = (i % 2 === 0) ? 0 : c[i];
        t = a[j]; a[j] = a[i]; a[i] = t;
        visiter(a);
        c[i]++;
        i = 0;
      } else {
        c[i] = 0;
        i++;
      }
    }
  }

  var _exact = null;
  function probaExacte() {
    if (_exact !== null) return _exact;
    var ok = 0, tot = 0;
    permuter(EDGES.map(function (e, k) { return k; }), function (ordre) {
      tot++;
      if (runOrder(ordre).cut === COUPE_MIN) ok++;
    });
    _exact = { p: ok / tot, ok: ok, tot: tot };
    return _exact;
  }


  /* ------------------------------------------------ mises en forme */

  function nombre(x) {
    if (x < 1e6) return Math.round(x).toLocaleString("fr-FR");
    var exp = Math.floor(Math.log10(x));
    var mant = x / Math.pow(10, exp);
    return mant.toFixed(1).replace(".", ",") + "·10^" + exp;
  }

  function duree(s) {
    if (s < 1e-3) return "instantané";
    if (s < 1) return (s * 1000).toFixed(0) + " ms";
    if (s < 60) return s.toFixed(1).replace(".", ",") + " s";
    if (s < 3600) return (s / 60).toFixed(1).replace(".", ",") + " min";
    if (s < 86400) return (s / 3600).toFixed(1).replace(".", ",") + " h";
    if (s < 86400 * 365) return Math.round(s / 86400) + " jours";
    var ans = s / 86400 / 365;
    return (ans < 1e4 ? Math.round(ans).toLocaleString("fr-FR") : nombre(ans)) + " ans";
  }

  /* Un resultat de Karger n'est jamais certifie par lui-meme : il majore la
     coupe minimum. Il faut un minorant qui vienne d'ailleurs, et qu'il le
     rejoigne. Deux bornes suffisent :
         isoler un sommet est une coupe  ->  coupe minimum <= degre minimum
         graphe connexe                  ->  coupe minimum >= 1
     La preuve ne tombe donc QUE si les deux bornes se rejoignent sur la
     valeur trouvee. Egaler le degre minimum ne prouve rien : c'est un
     majorant, la vraie coupe minimum peut etre plus basse (ce graphe fil
     rouge en est l'exemple : degre minimum 2, coupe minimum 1). */
  function bornes(d) {
    var connexe = (d.composantes === 1);
    return {
      inf: connexe ? 1 : 0,
      sup: connexe ? d.degre_min : 0,
      sure: connexe ? (d.degre_min === 1 && d.coupe === 1) : (d.coupe === 0)
    };
  }

  /** Une proportion, en barre. */
  function barre(frac, bon) {
    return CI.h("div", { "class": "prop" + (bon ? " ok" : "") }, [
      CI.h("i", { style: { width: Math.max(0, Math.min(1, frac)) * 100 + "%" } })
    ]);
  }

  /** Un curseur etiquete, rendu dans une ligne de commandes. */
  function curseur(opts) {
    var inp = CI.h("input", {
      type: "range", min: opts.min, max: opts.max, value: opts.value,
      step: opts.step || 1, style: { width: opts.largeur || "230px" }
    });
    inp.addEventListener("input", function () { opts.onChange(parseFloat(inp.value)); });
    return CI.h("div", { "class": "seg" }, [
      CI.h("span", { "class": "seg-label", text: opts.label }), inp
    ]);
  }

  function bouton(txt, fn, cls) {
    var b = CI.h("button", cls ? { "class": cls } : {}, txt);
    b.onclick = fn;
    return b;
  }


  /* ------------------------------------------------ les etapes */

  var STEPS = [

    /* 1 ------------------------------------------------------------------ */
    {
      chap: "Une fois ne suffit pas",
      titre: "Relance, et la réponse change",
      say: "<p class='say'>Le même graphe, le même algorithme. Seul l'ordre tiré sur les arêtes " +
           "change d'une exécution à l'autre.</p>" +
           "<p class='say'>La coupe minimum vaut <strong>1</strong> ici : c'est le pont " +
           "<code>c—d</code>. Lance quelques exécutions et regarde ce que l'algorithme rend.</p>",
      goal: "Obtiens une exécution qui <strong>rate</strong> la coupe minimum, c'est-à-dire qui " +
            "rend une valeur strictement supérieure à 1.",
      mount: function (api) {
        var tours = 0, reussites = 0, rate = false, dernier = null;

        function lancer() {
          dernier = runOnce();
          tours++;
          if (dernier.cut === COUPE_MIN) reussites++;
          else rate = true;
          redraw();
        }

        function redraw() {
          if (dernier) {
            var cross = api.fig.crossing(function (u) { return dernier.grp[u]; });
            api.fig.draw({
              groupOf: function (u) { return dernier.grp[u]; },
              edgeClass: function (e, k) {
                if (cross.indexOf(k) >= 0) return "edge cross";
                return "edge dead";
              }
            });
          } else {
            api.fig.draw({ groupOf: function (u) { return u; }, blobs: false });
          }

          api.readout([
            { t: "coupe rendue", v: dernier ? dernier.cut : "—",
              cls: dernier && dernier.cut === COUPE_MIN ? "good" : "" },
            { t: "exécutions", v: tours },
            { t: "dont réussies", v: reussites }
          ]);

          if (!dernier) {
            api.fb("Les six sommets sont encore séparés : rien n'a été contracté.");
          } else if (dernier.cut === COUPE_MIN) {
            api.fb("Cette exécution a trouvé le pont. Relance : elle n'y arrive pas toujours.", "ok");
          } else {
            api.fb("Raté : l'algorithme a contracté le pont <code>c—d</code> en cours de route, " +
                   "et il ne peut plus le rendre. Une exécution seule n'est <strong>pas " +
                   "fiable</strong> — c'est tout le problème de cette leçon.", "ko");
          }
          if (rate) api.solve();
        }

        api.tools([
          bouton("Lancer une exécution", lancer, "primary"),
          bouton("×10", function () { var i; for (i = 0; i < 10; i++) lancer(); })
        ]);
        redraw();
      }
    },

    /* 2 ------------------------------------------------------------------ */
    {
      chap: "Une fois ne suffit pas",
      titre: "Trois nombres pour une même chose",
      say: "<p class='say'>Accumule les exécutions : la <strong>fréquence</strong> observée se " +
           "stabilise.</p>" +
           "<p class='say'>Sur ce graphe, le résultat ne dépend que de l'ordre tiré sur les 7 arêtes. " +
           "Il n'y a que 7! = 5040 ordres possibles : on peut donc les parcourir tous et connaître " +
           "la probabilité <strong>exacte</strong>, sans l'estimer.</p>" +
           "<p class='say'>La borne du cours, elle, vaut 2/n(n−1) = 1/15.</p>",
      goal: "Atteins <strong>300 exécutions</strong> et compare les trois nombres.",
      mount: function (api) {
        var tours = 0, reussites = 0;
        var ex = probaExacte();

        function lancer(fois) {
          var i;
          for (i = 0; i < fois; i++) {
            if (runOnce().cut === COUPE_MIN) reussites++;
            tours++;
          }
          redraw();
        }

        function redraw() {
          api.figHidden(true);
          var freq = tours ? reussites / tours : 0;

          var tbl = CI.h("div", {}, [
            CI.h("div", { "class": "counters" }, [
              CI.h("div", {}, [
                CI.h("span", { "class": "t", text: "fréquence mesurée" }),
                CI.h("span", { "class": "v", text: tours ? CI.pct(freq) : "—" })
              ]),
              CI.h("div", {}, [
                CI.h("span", { "class": "t", text: "probabilité exacte" }),
                CI.h("span", { "class": "v ok", text: CI.pct(ex.p) })
              ]),
              CI.h("div", {}, [
                CI.h("span", { "class": "t", text: "borne du cours" }),
                CI.h("span", { "class": "v", text: CI.pct(BORNE) })
              ])
            ]),
            CI.h("p", { "class": "read", style: { marginTop: "12px" },
                        text: tours + " exécutions · " + reussites + " réussies · " +
                              ex.ok + " des " + ex.tot + " ordres possibles mènent au pont" })
          ]);
          api.readoutNode(tbl);

          if (tours < 300) {
            api.fb("Continue : en dessous de quelques centaines d'exécutions, la fréquence bouge " +
                   "encore beaucoup.");
          } else {
            api.fb("La fréquence colle à la probabilité exacte (" + CI.pct(ex.p) + "), qui est " +
                   "<strong>" + (ex.p / BORNE).toFixed(1).replace(".", ",") + " fois</strong> " +
                   "plus grande que la borne du cours. La borne est un <strong>pire cas</strong> : " +
                   "elle est atteinte par le cycle, pas par un graphe quelconque.", "ok");
            api.solve();
          }
        }

        api.tools([
          bouton("×1", function () { lancer(1); }),
          bouton("×50", function () { lancer(50); }),
          bouton("×500", function () { lancer(500); }, "primary"),
          bouton("remise à zéro", function () { tours = 0; reussites = 0; redraw(); })
        ]);
        redraw();
      }
    },

    /* 3 ------------------------------------------------------------------ */
    {
      chap: "Répéter",
      titre: "Échouer N fois de suite",
      say: "<p class='say'>Voilà le mécanisme, en une ligne. Les exécutions sont " +
           "<strong>indépendantes</strong> : chacune repart des n groupes d'un sommet et d'un " +
           "nouveau tirage.</p>" +
           "<p class='say'>Si une exécution réussit avec probabilité p, les N échouent toutes " +
           "avec probabilité <strong>(1−p)^N</strong>. Un nombre inférieur à 1, élevé à la " +
           "puissance N, s'effondre.</p>" +
           "<p class='say'>Fais glisser N en gardant la borne pessimiste p = 1/15.</p>",
      goal: "Trouve un N qui fait tomber la probabilité d'échec sous <strong>1 ‰</strong>.",
      mount: function (api) {
        var Nit = 1;
        api.figHidden(true);

        var host = api.host;

        function redraw() {
          var echec = Math.pow(1 - BORNE, Nit);
          var seuil = Math.ceil(LN_EPS / -Math.log(1 - BORNE));

          CI.clear(host);
          host.appendChild(CI.h("div", { "class": "prod" }, [
            CI.h("span", { "class": "read", text: "(1 − 1/15)" }),
            CI.h("span", { "class": "read", style: { verticalAlign: "super", fontSize: "11px" },
                           text: " " + Nit }),
            CI.h("span", { "class": "x", text: " = " }),
            CI.h("span", { "class": "big" + (echec < EPS ? " good" : ""),
                           text: echec < 1e-4 ? echec.toExponential(2).replace(".", ",")
                                              : CI.pct(echec, 2) })
          ]));
          host.appendChild(barre(1 - echec, echec < EPS));
          host.appendChild(CI.h("p", { "class": "read", style: { marginTop: "8px" },
                                       text: "la barre mesure la probabilité de RÉUSSIR " +
                                             "au moins une fois" }));

          api.readout([
            { t: "N", v: Nit },
            { t: "échec des N", v: echec < 1e-4 ? echec.toExponential(1) : CI.pct(echec, 2) },
            { t: "succès", v: CI.pct(1 - echec, 2), cls: echec < EPS ? "good" : "" }
          ]);

          if (echec < EPS) {
            api.fb("Sous le mille. Il a suffi de <strong>" + seuil + " exécutions</strong> pour " +
                   "passer d'une chance sur quinze à une quasi-certitude, alors qu'<em>aucune</em> " +
                   "exécution n'est devenue meilleure.", "ok");
            api.solve();
          } else {
            api.fb("Encore " + CI.pct(echec, 2) + " de risque de tout rater. Continue : le seuil " +
                   "est à N = " + seuil + ".");
          }
        }

        api.tools([curseur({
          label: "N", min: 1, max: 200, value: 1, largeur: "280px",
          onChange: function (v) { Nit = v; redraw(); }
        })]);
        redraw();
      }
    },

    /* 4 ------------------------------------------------------------------ */
    {
      chap: "Répéter",
      titre: "D'où sort le ln(1000)",
      say: "<p class='say'>On veut choisir N sans tâtonner. L'inégalité " +
           "<strong>1 − p ≤ e<sup>−p</sup></strong> donne directement " +
           "(1−p)<sup>N</sup> ≤ e<sup>−Np</sup>.</p>" +
           "<p class='say'>Pour que l'échec reste sous ε, il suffit donc de " +
           "<strong>N = ln(1/ε) / p</strong>. Avec ε = 0,001 : ln(1000) ≈ 6,91, " +
           "et <strong>N = 6,91 / p</strong>.</p>" +
           "<p class='say'>Avec la borne p ≥ 2/n(n−1), cela donne le N du TP : " +
           "<strong>N = C(n,2) · ln(1000)</strong>.</p>",
      goal: null,
      mount: function (api) {
        var p = BORNE, Nit = 101;
        api.figHidden(true);

        function redraw() {
          var vrai = Math.pow(1 - p, Nit);
          var maj  = Math.exp(-Nit * p);
          var need = Math.ceil(LN_EPS / p);

          api.readout([
            { t: "p", v: CI.pct(p, 2) },
            { t: "N", v: Nit },
            { t: "(1−p)^N", v: vrai < 1e-4 ? vrai.toExponential(1) : CI.pct(vrai, 2), small: true },
            { t: "majorant e^(−Np)", v: maj < 1e-4 ? maj.toExponential(1) : CI.pct(maj, 2), small: true },
            { t: "N = ln(1000)/p", v: nombre(need), cls: Nit >= need ? "good" : "" }
          ]);

          if (Nit >= need) {
            api.fb("Le majorant <code>e^(−Np)</code> est bien au-dessus de la vraie valeur, et " +
                   "déjà sous le mille : la formule est <strong>prudente</strong>, jamais " +
                   "optimiste. C'est ce qui permet de s'en servir comme garantie.", "ok");
          } else {
            api.fb("Il manque des itérations : la formule en demande " + nombre(need) + ".");
          }
        }

        api.tools([
          curseur({
            label: "p", min: 1, max: 500, value: Math.round(BORNE * 1000), largeur: "180px",
            onChange: function (v) { p = v / 1000; redraw(); }
          }),
          curseur({
            label: "N", min: 1, max: 500, value: 101, largeur: "180px",
            onChange: function (v) { Nit = v; redraw(); }
          })
        ]);
        redraw();
      }
    },

    /* 5 ------------------------------------------------------------------ */
    {
      chap: "Répéter",
      titre: "Ce que la garantie coûte",
      say: "<p class='say'>N = C(n,2)·ln(1000) croît comme <strong>n²</strong>. Et chaque " +
           "exécution coûte elle-même O(m + n log n).</p>" +
           "<p class='say'>Le curseur donne n. Le temps affiché suppose une machine " +
           "<em>très</em> optimiste : <strong>1 µs par exécution</strong>, soit mille fois plus " +
           "rapide que la réalité mesurée sur les petits graphes du TP.</p>",
      goal: "Trouve le n à partir duquel la garantie demande <strong>plus d'une journée</strong>, " +
            "même à cette vitesse.",
      mount: function (api) {
        var pas = 0;
        api.figHidden(true);

        function nDe(v) {   // curseur logarithmique de 6 a 2 000 000
          return Math.round(6 * Math.pow(2e6 / 6, v / 1000));
        }

        function redraw() {
          var n = nDe(pas);
          var Nc = Math.ceil(n * (n - 1) / 2 * LN_EPS);
          var t = Nc * 1e-6;

          api.readout([
            { t: "n", v: n.toLocaleString("fr-FR") },
            { t: "N = C(n,2)·ln(1000)", v: nombre(Nc), small: true },
            { t: "à 1 µs l'exécution", v: duree(t), cls: t < 86400 ? "good" : "" }
          ]);

          CI.clear(api.host);
          api.host.appendChild(CI.h("div", { "class": "big sm", text: duree(t) }));
          api.host.appendChild(CI.h("p", { "class": "read", style: { marginTop: "6px" },
            text: "pour n = " + n.toLocaleString("fr-FR") + ", soit " + nombre(Nc) + " exécutions" }));

          if (t > 86400) {
            api.fb("Passé n ≈ <strong>158 000</strong>, la garantie demande plus d'une journée " +
                   "sur une machine imaginaire — donc des années sur la vraie. Les deux plus gros " +
                   "graphes du TP ont <em>un million</em> de sommets : la garantie du cours y est " +
                   "définitivement hors de portée.", "ok");
            api.solve();
          } else {
            api.fb("Encore tenable. Pousse le curseur.");
          }
        }

        api.tools([curseur({
          label: "n", min: 0, max: 1000, value: 0, largeur: "300px",
          onChange: function (v) { pas = v; redraw(); }
        })]);
        redraw();
      }
    },

    /* 6 ------------------------------------------------------------------ */
    {
      chap: "Sur de vrais graphes",
      titre: "Les douze graphes du TP",
      say: "<p class='say'>Les relevés du TP1, sur la machine où il a tourné. Clique une ligne.</p>" +
           "<p class='say'>Compare les deux colonnes de probabilité : la <strong>fréquence " +
           "mesurée</strong> et la <strong>borne du cours</strong>. L'écart n'est pas de quelques " +
           "pour cent.</p>",
      goal: null,
      mount: function (api) {
        api.figHidden(true);

        if (!MES.length) {
          api.readoutNode(CI.h("p", { "class": "say",
            text: "Les mesures ne sont pas chargées (data/mesures-tp.js)." }));
          return;
        }

        var sel = 0;

        function detail(d) {
          var b = bornes(d), sur = b.sure;
          return CI.h("div", {}, [
            CI.h("div", { "class": "counters" }, [
              CI.h("div", {}, [CI.h("span", { "class": "t", text: "graphe" }),
                               CI.h("span", { "class": "v", text: d.graphe })]),
              CI.h("div", {}, [CI.h("span", { "class": "t", text: "n / m" }),
                               CI.h("span", { "class": "v", text: nombre(d.n) + " / " + nombre(d.m) })]),
              CI.h("div", {}, [CI.h("span", { "class": "t", text: "coupe trouvée" }),
                               CI.h("span", { "class": "v" + (sur ? " ok" : ""), text: String(d.coupe) })])
            ]),
            CI.h("p", { "class": "read", style: { marginTop: "12px" }, html:
              "fréquence mesurée <b>" + CI.pct(d.freq, 2) + "</b> sur " + nombre(d.N) +
              " exécutions<br>borne du cours <b>" + d.borne.toExponential(1).replace(".", ",") +
              "</b> — soit " + nombre(d.freq / d.borne) + " fois moins<br>" +
              "N garanti <b>" + nombre(d.N_conseille) + "</b> · " +
              duree(d.N_conseille * d.t_iter) + " à " +
              (d.t_iter * 1e6).toFixed(1).replace(".", ",") + " µs l'exécution" }),
            CI.h("div", { "class": "callout" + (sur ? " ok" : " warn"), html: sur
              ? "Réponse <b>certifiée</b>, sans aucune probabilité : le graphe est connexe, donc sa " +
                "coupe minimum vaut au moins 1 ; il a un sommet de degré 1, donc elle vaut au plus 1. " +
                "Les deux bornes se rejoignent sur <b>1</b>, et l'algorithme a trouvé 1."
              : "Réponse <b>non certifiée</b> : les deux bornes laissent l'intervalle [" + b.inf +
                " ; " + b.sup + "], et la valeur trouvée est " + d.coupe + ". Égaler le degré " +
                "minimum ne prouve rien — c'est un majorant." +
                (d.exacte != null
                  ? " Vérification indépendante par <b>flot maximum</b> : la coupe minimum vaut " +
                    d.exacte + ", donc l'algorithme " +
                    (d.exacte === d.coupe ? "avait bien raison." : "s'est trompé.")
                  : "") })
          ]);
        }

        function redraw() {
          CI.clear(api.host);
          var corps = CI.h("tbody");
          MES.forEach(function (d, i) {
            var sur = bornes(d).sure;
            var tr = CI.h("tr", i === sel ? { "class": "cur" } : {}, [
              CI.h("td", { text: d.graphe }),
              CI.h("td", { text: nombre(d.n) }),
              CI.h("td", { text: String(d.coupe) }),
              CI.h("td", { "class": sur ? "sur" : "pasur", text: sur ? "certifiée" : "—" }),
              CI.h("td", { text: CI.pct(d.freq, 1) }),
              CI.h("td", { text: d.borne.toExponential(0) }),
              CI.h("td", { text: nombre(d.N_conseille) }),
              CI.h("td", { text: duree(d.N_conseille * d.t_iter) })
            ]);
            tr.onclick = function () { sel = i; redraw(); };
            corps.appendChild(tr);
          });

          var tete = CI.h("thead", {}, [CI.h("tr", {}, ["graphe", "n", "coupe", "preuve",
                                                        "fréq. mesurée", "borne", "N garanti",
                                                        "durée"].map(function (t) {
            return CI.h("th", { text: t });
          }))]);

          api.host.appendChild(CI.h("div", { "class": "tpt-wrap" }, [
            CI.h("table", { "class": "tpt" }, [tete, corps])
          ]));
          api.readoutNode(detail(MES[sel]));
        }

        redraw();
        api.fb("Sur les graphes réels, la coupe minimum vaut 1 et l'algorithme la trouve presque " +
               "à chaque fois. Sur les graphes <em>aléatoires</em>, qui n'ont pas de sommet " +
               "pendant, l'écart se resserre — ce sont eux qui font vraiment travailler " +
               "la répétition.");
      }
    },

    /* 7 ------------------------------------------------------------------ */
    {
      chap: "Sur de vrais graphes",
      titre: "Savoir qu'on a la bonne réponse",
      say: "<p class='say'>L'algorithme ne dit jamais « c'est la minimum ». Il rend une coupe, et " +
           "c'est tout. Comment en être sûr sans tout énumérer ?</p>" +
           "<p class='say'>Deux bornes suffisent souvent. <strong>Isoler un seul sommet est une " +
           "coupe</strong> : la coupe minimum est donc ≤ au plus petit degré. Et si le graphe est " +
           "connexe, elle est ≥ 1.</p>" +
           "<p class='say'>Clique les sommets pour relever leurs degrés.</p>",
      goal: "Relève le degré de tous les sommets pour obtenir la borne supérieure.",
      mount: function (api) {
        var vus = {}, deg = api.fig.degrees();

        api.fig.onVertexClick = function (u) { vus[u] = true; redraw(); };

        function redraw() {
          var nb = Object.keys(vus).length;
          var mini = null;
          Object.keys(vus).forEach(function (u) {
            if (mini === null || deg[u] < mini) mini = deg[u];
          });

          api.fig.draw({
            groupOf: function (u) { return u; }, blobs: false,
            vertexClass: function (u) { return vus[u] ? "g3" : "g0"; },
            vertexNote: function (u) { return vus[u] ? "deg " + deg[u] : "?"; }
          });

          api.readout([
            { t: "sommets relevés", v: nb + " / " + N },
            { t: "degré minimum", v: mini === null ? "—" : mini },
            { t: "coupe min ≤", v: mini === null ? "—" : mini },
            { t: "coupe min ≥", v: 1 }
          ]);

          if (nb < N) {
            api.fb("Continue : la borne ne vaut que si tu as vu tous les sommets.");
          } else {
            api.fb("Degré minimum 2, donc coupe minimum ≤ 2. Mais elle vaut 1 : la borne " +
                   "<strong>ne conclut pas</strong> sur ce graphe. Sur huit des douze graphes du " +
                   "TP, au contraire, un sommet de degré 1 la rend exacte — la coupe de valeur 1 " +
                   "trouvée en une seule exécution y est <strong>démontrée</strong> minimum, sans " +
                   "aucune répétition.", "ok");
            api.solve();
          }
        }
        redraw();
      }
    },

    /* 8 ------------------------------------------------------------------ */
    {
      chap: "Bilan",
      titre: "Ce que tu sais maintenant",
      say: "<p class='say'>Une exécution de Karger réussit avec une probabilité " +
           "<strong>≥ 2/n(n−1)</strong>. N exécutions indépendantes échouent toutes avec " +
           "probabilité <strong>≤ e<sup>−Np</sup></strong>.</p>" +
           "<p class='say'>D'où le N du TP : <strong>C(n,2)·ln(1000)</strong> pour une réussite " +
           "à 99,9 %. Il croît en n², donc il devient inatteignable bien avant le million de " +
           "sommets.</p>" +
           "<p class='say'>Cette borne est un <strong>pire cas</strong>, atteint par le cycle. " +
           "Sur les graphes réels du TP, la fréquence mesurée la dépasse de plusieurs ordres de " +
           "grandeur.</p>" +
           "<p class='say'>Et quand la coupe trouvée égale le plus petit degré, elle est " +
           "<strong>démontrée</strong> minimum : plus besoin de probabilité du tout.</p>",
      goal: null,
      mount: function (api) {
        api.figHidden(true);
        api.readoutNode(CI.h("div", { "class": "done-screen" }, [
          CI.h("div", { "class": "big", text: "✓" }),
          CI.h("p", { "class": "say", text: "Leçon terminée." })
        ]));
        api.tools([
          CI.h("a", { "class": "linkcard", href: "karger.html" }, [
            CI.h("div", { "class": "k", text: "revoir le mécanisme" }),
            CI.h("div", { "class": "t", text: "Dérouler une exécution, instruction par instruction" }),
            CI.h("div", { "class": "d", text: "L'atelier montre l'implémentation en C et l'état de ses tableaux à chaque tour de boucle." })
          ]),
          CI.h("a", { "class": "linkcard", href: "revision.html" }, [
            CI.h("div", { "class": "k", text: "mémoriser" }),
            CI.h("div", { "class": "t", text: "Réviser par cartes" }),
            CI.h("div", { "class": "d", text: "Les définitions, la borne et sa démonstration, en répétition espacée." })
          ])
        ]);
        api.solve();
      }
    }
  ];

  /* ------------------------------------------------ demarrage */

  CI.Lesson({
    steps: STEPS,
    key: "lecon-repetition-progres",
    titre: "Répéter pour fiabiliser",
    sousTitre: "Comment N exécutions qui échouent presque toujours donnent une quasi-certitude — " +
               "ce que la garantie coûte, et ce qu'elle vaut sur de vrais graphes.",
    graph: { names: NAME, pos: G.pos, edges: EDGES }
  });
})(window.CI);
