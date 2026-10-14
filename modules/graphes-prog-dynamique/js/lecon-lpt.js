/* =========================================================================
   lecon-lpt.js — LPT : trier d'abord, et ce que ca change a la preuve.

   Trois instances servent de fil rouge, chacune pour une raison precise :
     REPARE   le pire cas du list scheduling (m=3) -- LPT y devient optimal
     REDUC    [5,4,3,1] (m=2) -- j* n'y est PAS la derniere tache, donc la
              reduction prealable de la preuve s'y voit
     SERRE    [3,3,2,2,2] (m=2) -- le pire cas de LPT, ratio 7/6 exactement
   ========================================================================= */
(function (CI, O) {
  "use strict";

  /* ------------------------------------------------ les trois instances */

  function monte(durees, m) {
    var ls = O.deroule(durees, m, false);
    var lpt = O.deroule(durees, m, true);
    var opt = O.optimum(durees, m);
    return {
      durees: durees, m: m, ls: ls, lpt: lpt, opt: opt,
      bornes: O.bornes(durees, m),
      hmax: Math.max(ls.makespan, lpt.makespan, opt) * 1.1,
      crit: critDe(lpt.charges),
      rangJstar: rangJstarDe(lpt, critDe(lpt.charges))
    };
  }

  function critDe(charges) {
    var k = 0, i;
    for (i = 1; i < charges.length; i++) if (charges[i] > charges[k]) k = i;
    return k;
  }

  function rangJstarDe(res, crit) {
    var r = -1;
    res.trace.forEach(function (p, k) { if (p.machine === crit) r = k; });
    return r;
  }

  var REPARE = monte(O.pireGlouton(3), 3);
  var REDUC  = monte([5, 4, 3, 1], 2);
  var SERRE  = monte([3, 3, 2, 2, 2], 2);

  /* ------------------------------------------------ helpers */

  function neuf(hote) {
    var svg = CI.svg("svg", { "class": "ordo", role: "img",
                              "aria-label": "Charges des machines" });
    hote.appendChild(svg);
    return svg;
  }

  function bouton(txt, fn, cls) {
    var b = CI.h("button", cls ? { "class": cls } : {}, txt);
    b.onclick = fn;
    return b;
  }

  function maxDe(c) { return Math.max.apply(null, c); }

  function frac(x) { return (Math.round(x * 1000) / 1000).toString().replace(".", ","); }

  /* ------------------------------------------------ les etapes */

  var STEPS = [

    /* 1 ------------------------------------------------------------------ */
    {
      chap: "Ce que le tri répare",
      titre: "La même instance, triée",
      say: "<p class='say'>Voici l'instance qui mettait le list scheduling à son pire cas : " +
           "3 machines, six tâches de durée 1, puis une de durée 3. Le glouton y faisait " +
           "<strong>" + REPARE.ls.makespan + "</strong> pour un optimum de <strong>" +
           REPARE.opt + "</strong>.</p>" +
           "<p class='say'>LPT fait exactement la même chose, à une différence près : il " +
           "<strong>trie d'abord par durée décroissante</strong>. Déroule.</p>",
      goal: "Place toutes les tâches et compare au " + REPARE.ls.makespan + " du glouton.",
      mount: function (api) {
        api.figHidden(true);
        var k = 0, n = REPARE.durees.length;
        var svg = neuf(api.host);

        function dessine() {
          var e = O.etatApres(REPARE.lpt, REPARE.m, k, { cur: k - 1 });
          O.dessiner(svg, e, {
            hmax: REPARE.hmax,
            reperes: [{ v: REPARE.opt, cls: "opt", label: "OPT = " + REPARE.opt },
                      { v: REPARE.ls.makespan, cls: "maxt",
                        label: "le glouton : " + REPARE.ls.makespan }],
            moins: k > 0 ? REPARE.lpt.trace[k - 1].machine : undefined
          });

          api.readout([
            { t: "tâches posées", v: k + " / " + n },
            { t: "makespan LPT", v: maxDe(e.charges), cls: k === n ? "good" : "" },
            { t: "makespan glouton", v: REPARE.ls.makespan },
            { t: "OPT", v: REPARE.opt }
          ]);

          if (k === 0) {
            api.fb("La tâche de durée 3 est passée <strong>en tête</strong> du tri. " +
                   "Elle va donc être posée la première, sur une machine vide.");
          } else if (k < n) {
            api.fb("Les tâches unitaires remplissent les deux machines restantes pendant que " +
                   "la grosse occupe la sienne.");
          } else {
            api.fb("Makespan <strong>" + REPARE.lpt.makespan + "</strong> : LPT est " +
                   "<strong>optimal</strong> sur l'instance qui mettait le glouton à " +
                   REPARE.ls.makespan + ". Le tri a supprimé le défaut exactement.", "ok");
            api.solve();
          }
        }

        api.tools([
          bouton("Poser une tâche", function () { if (k < n) { k++; dessine(); } }, "primary"),
          bouton("Tout poser", function () { k = n; dessine(); }),
          bouton("Recommencer", function () { k = 0; dessine(); })
        ]);
        dessine();
      }
    },

    /* 2 ------------------------------------------------------------------ */
    {
      chap: "Ce que le tri répare",
      titre: "Pourquoi ça marche, en une phrase",
      say: "<p class='say'>Le défaut du glouton tenait en une phrase : <em>il dépense son " +
           "équilibre sur les petites tâches, et n'a plus de machine libre quand la grosse " +
           "arrive.</em></p>" +
           "<p class='say'>Trier rend cette situation <strong>impossible</strong> : quand une " +
           "tâche arrive, <strong>tout ce qui reste à placer est plus petit qu'elle</strong>. " +
           "Plus de mauvaise surprise de fin.</p>" +
           "<p class='say'>Avance et surveille la file : le maximum de ce qui reste ne remonte " +
           "jamais.</p>",
      goal: "Déroule jusqu'au bout en regardant « le plus gros qui reste ».",
      mount: function (api) {
        api.figHidden(true);
        var k = 0, n = SERRE.durees.length;
        var svg = neuf(api.host);
        var file = CI.h("div", { "class": "file", style: { marginTop: "12px" } });
        api.host.appendChild(file);

        function dessine() {
          var e = O.etatApres(SERRE.lpt, SERRE.m, k, { cur: k - 1 });
          O.dessiner(svg, e, { hmax: SERRE.hmax, reperes: [],
                               moins: k > 0 ? SERRE.lpt.trace[k - 1].machine : undefined });

          CI.clear(file);
          SERRE.lpt.ordre.forEach(function (t, rang) {
            var cls = "file-t";
            if (rang < k - 1) cls += " posee";
            else if (rang === k - 1) cls += " cur";
            file.appendChild(CI.h("span", { "class": cls, text: String(t.d) }));
          });

          var reste = SERRE.lpt.ordre.slice(k).map(function (t) { return t.d; });
          var posee = k > 0 ? SERRE.lpt.ordre[k - 1].d : null;

          api.readout([
            { t: "tâche posée", v: posee == null ? "—" : posee },
            { t: "le plus gros qui reste", v: reste.length ? Math.max.apply(null, reste) : "—" },
            { t: "posées", v: k + " / " + n }
          ]);

          if (k === n) {
            api.fb("La colonne « le plus gros qui reste » n'a fait que " +
                   "<strong>décroître</strong>. C'est la propriété que le tri achète, et c'est " +
                   "d'elle que viendra le nouvel ingrédient de la preuve.", "ok");
            api.solve();
          } else {
            api.fb("Tout ce qui reste est ≤ à ce qu'on vient de poser.");
          }
        }

        api.tools([
          bouton("Suivante", function () { if (k < n) { k++; dessine(); } }, "primary"),
          bouton("Recommencer", function () { k = 0; dessine(); })
        ]);
        dessine();
      }
    },

    /* 3 ------------------------------------------------------------------ */
    {
      chap: "La preuve",
      titre: "Tout se réutilise, sauf une ligne",
      say: "<p class='say'>Relis la preuve du list scheduling : <strong>aucun</strong> de ses pas " +
           "ne parlait de l'ordre des tâches. Ils restent donc vrais mot pour mot pour LPT.</p>" +
           "<p class='say'>On arrive au même point. La seule ligne qui peut être améliorée est " +
           "la dernière : celle où, faute de mieux, on majorait <strong>p(j*) par OPT</strong>.</p>",
      goal: null,
      mount: function (api) {
        api.figHidden(true);

        var box = CI.h("div", { "class": "chaine" }, [
          CI.h("div", { "class": "ligne vue", html: "ALG ≤ (1/m)·Σⱼpⱼ + p(j*)·(1 − 1/m) <span class='just'>pas 1 à 5, inchangés</span>" }),
          CI.h("div", { "class": "ligne vue", html: "&nbsp;&nbsp;&nbsp;&nbsp;≤ OPT + p(j*)·(1 − 1/m) <span class='just'>minorant de la moyenne</span>" }),
          CI.h("div", { "class": "ligne vue cle", html: "&nbsp;&nbsp;&nbsp;&nbsp;≤ OPT + <b>?</b>·(1 − 1/m) <span class='just'>← tout le jeu est ici</span>" })
        ]);
        api.host.appendChild(box);

        api.readoutNode(CI.h("div", {}, [
          CI.h("div", { "class": "counters" }, [
            CI.h("div", {}, [CI.h("span", { "class": "t", text: "si p(j*) ≤ OPT" }),
                             CI.h("span", { "class": "v", text: "2 − 1/m" })]),
            CI.h("div", {}, [CI.h("span", { "class": "t", text: "si p(j*) ≤ OPT/2" }),
                             CI.h("span", { "class": "v ok", text: "3/2 − 1/(2m)" })])
          ]),
          CI.h("p", { "class": "read", style: { marginTop: "12px" },
                      text: "diviser le majorant de p(j*) par deux divise par deux ce qu'on " +
                            "ajoute à OPT" })
        ]));

        api.fb("Le glouton n'avait aucune raison de penser que j* était petite : elle pouvait " +
               "être la plus grosse tâche de l'instance. LPT, lui, <strong>sait</strong> quelque " +
               "chose sur j* — et c'est ce qu'on va exploiter.");
      }
    },

    /* 4 ------------------------------------------------------------------ */
    {
      chap: "La preuve",
      titre: "D'abord, se ramener au cas où j* est la plus petite",
      say: "<p class='say'>On veut dire « j* est petite ». Mais j* est la dernière tâche posée " +
           "<em>sur i*</em>, pas forcément la dernière de l'instance : ici deux tâches sont " +
           "placées après elle, sur l'autre machine.</p>" +
           "<p class='say'>La réduction : <strong>supprime toutes les tâches posées après " +
           "j*</strong>. La charge de i* ne change pas (rien ne lui a été ajouté après), donc " +
           "<strong>ALG est le même</strong> ; et retirer des tâches ne peut que " +
           "<strong>diminuer OPT</strong>. Le ratio de l'instance réduite est donc ≥ celui de " +
           "l'originale : il suffit de prouver la borne sur elle.</p>",
      goal: "Supprime la queue et vérifie que ALG ne bouge pas.",
      mount: function (api) {
        api.figHidden(true);
        var reduit = false;
        var svg = neuf(api.host);

        /* l'instance reduite : les taches posees jusqu'a j* inclus */
        var gardees = REDUC.lpt.trace.slice(0, REDUC.rangJstar + 1)
                                     .map(function (p) { return p.duree; });
        var REDUIT = monte(gardees, REDUC.m);

        function dessine() {
          var src = reduit ? REDUIT : REDUC;
          var k = reduit ? gardees.length : REDUC.durees.length;
          var e = O.etatApres(src.lpt, src.m, k,
                              { jstar: reduit ? REDUIT.rangJstar : REDUC.rangJstar });

          O.dessiner(svg, e, {
            hmax: REDUC.hmax,
            reperes: [{ v: src.opt, cls: "opt", label: "OPT = " + src.opt }],
            crit: critDe(e.charges)
          });

          api.readout([
            { t: "instance", v: reduit ? "réduite" : "complète", small: true },
            { t: "tâches", v: src.durees.join(" ") , small: true },
            { t: "ALG", v: src.lpt.makespan, cls: "good" },
            { t: "OPT", v: src.opt }
          ]);

          if (!reduit) {
            api.fb("j* est la tâche de durée <strong>" +
                   REDUC.lpt.trace[REDUC.rangJstar].duree + "</strong> (en bleu), et " +
                   (REDUC.durees.length - REDUC.rangJstar - 1) +
                   " tâche(s) sont posées après elle, ailleurs.");
          } else {
            api.fb("ALG vaut toujours <strong>" + REDUIT.lpt.makespan + "</strong>, identique. " +
                   "OPT est passé de " + REDUC.opt + " à " + REDUIT.opt + " — il ne peut que " +
                   "baisser. Donc le ratio de l'instance réduite est au moins celui de " +
                   "l'originale, et <strong>j* y est bien la plus petite tâche</strong>.", "ok");
            api.solve();
          }
        }

        api.tools([
          bouton("Supprimer ce qui vient après j*", function () { reduit = true; dessine(); }, "primary"),
          bouton("Revenir", function () { reduit = false; dessine(); })
        ]);
        dessine();
      }
    },

    /* 5 ------------------------------------------------------------------ */
    {
      chap: "La preuve",
      titre: "Le nouvel ingrédient : p(j*) ≤ OPT/2",
      say: "<p class='say'>On peut donc supposer <strong>p(j*) = min pⱼ</strong>. Supposons " +
           "aussi <strong>n ≥ m+1</strong> (sinon chaque tâche a sa machine et LPT est optimal).</p>" +
           "<p class='say'>Regarde les <strong>m+1 plus grandes</strong> tâches — ici 3, 3 et 2 " +
           "pour m = 2. Dans l'ordonnancement <em>optimal</em>, elles se répartissent sur m " +
           "machines : par le <strong>principe des tiroirs</strong>, deux d'entre elles " +
           "partagent forcément une machine.</p>" +
           "<p class='say'>Essaie de les séparer : clique un bloc pour le déplacer.</p>",
      goal: "Convaincs-toi qu'aucun arrangement ne met les trois blocs sur des machines distinctes.",
      mount: function (api) {
        api.figHidden(true);
        var m = 2, gros = [3, 3, 2];          /* les m+1 plus grandes de SERRE */
        var pm1 = gros[gros.length - 1];      /* p_{m+1} = 2 */
        var aff = [0, 1, 0], essais = 0;
        var svg = neuf(api.host);

        function dessine() {
          var piles = [], charges = [], i;
          for (i = 0; i < m; i++) { piles.push([]); charges.push(0); }
          aff.forEach(function (mi, k) {
            piles[mi].push({ duree: gros[k], cls: "jstar", tache: k });
            charges[mi] += gros[k];
          });
          var e = { m: m, piles: piles, charges: charges };
          var ms = maxDe(charges);

          /* combien de machines portent au moins deux de ces blocs ? */
          var doubles = 0;
          piles.forEach(function (p) { if (p.length >= 2) doubles++; });

          O.dessiner(svg, e, {
            hmax: 8,
            reperes: [{ v: 2 * pm1, cls: "moy", label: "2·p(m+1) = " + (2 * pm1) }],
            crit: critDe(charges),
            onTache: function (mi, mk, t) {
              aff[t.tache] = (aff[t.tache] + 1) % m;
              essais++;
              dessine();
            }
          });

          api.readout([
            { t: "machines à ≥ 2 blocs", v: doubles, cls: doubles >= 1 ? "good" : "" },
            { t: "charge max", v: ms },
            { t: "2·p(m+1)", v: 2 * pm1 },
            { t: "essais", v: essais }
          ]);

          if (essais < 3) {
            api.fb("Trois blocs, deux machines. Déplace-les et regarde le compteur " +
                   "« machines à ≥ 2 blocs ».");
          } else {
            api.fb("Il reste <strong>toujours</strong> au moins une machine avec deux blocs — " +
                   "trois objets, deux tiroirs. Ces deux blocs ont chacun une durée ≥ " +
                   "p(m+1) = " + pm1 + ", donc cette machine porte ≥ <strong>" + (2 * pm1) +
                   "</strong>. Et comme c'est vrai dans l'optimal aussi : " +
                   "<strong>OPT ≥ 2·p(m+1) ≥ 2·p(j*)</strong>, c'est-à-dire " +
                   "<strong>p(j*) ≤ OPT/2</strong>.", "ok");
            api.solve();
          }
        }
        dessine();
      }
    },

    /* 6 ------------------------------------------------------------------ */
    {
      chap: "La preuve",
      titre: "Le résultat, et le vrai résultat",
      say: "<p class='say'>On réinjecte <strong>p(j*) ≤ OPT/2</strong> dans la chaîne, et " +
           "c'est fini.</p>",
      goal: null,
      mount: function (api) {
        api.figHidden(true);

        api.host.appendChild(CI.h("div", { "class": "chaine" }, [
          CI.h("div", { "class": "ligne vue", html: "ALG ≤ OPT + p(j*)·(1 − 1/m)" }),
          CI.h("div", { "class": "ligne vue", html: "&nbsp;&nbsp;&nbsp;&nbsp;≤ OPT + (OPT/2)·(1 − 1/m) <span class='just'>le nouvel ingrédient</span>" }),
          CI.h("div", { "class": "ligne vue cle", html: "ALG ≤ (3/2 − 1/(2m)) · OPT <span class='just'>∎</span>" })
        ]));

        api.readoutNode(CI.h("div", {}, [
          CI.h("div", { "class": "counters" }, [
            CI.h("div", {}, [CI.h("span", { "class": "t", text: "glouton" }),
                             CI.h("span", { "class": "v", text: "2 − 1/m" })]),
            CI.h("div", {}, [CI.h("span", { "class": "t", text: "cette preuve" }),
                             CI.h("span", { "class": "v", text: "3/2 − 1/(2m)" })]),
            CI.h("div", {}, [CI.h("span", { "class": "t", text: "vrai ratio de LPT" }),
                             CI.h("span", { "class": "v ok", text: "4/3 − 1/(3m)" })])
          ]),
          CI.h("p", { "class": "read", style: { marginTop: "12px" },
                      html: "m = 2 :&nbsp; 1,5&nbsp; ·&nbsp; 1,25&nbsp; ·&nbsp; <b>1,167</b><br>" +
                            "m = 3 :&nbsp; 1,667&nbsp; ·&nbsp; 1,333&nbsp; ·&nbsp; <b>1,222</b>" })
        ]));

        api.fb("La preuve qu'on vient de faire donne <strong>3/2 − 1/(2m)</strong>. Le vrai " +
               "ratio de LPT, démontré par Graham en 1969, est <strong>4/3 − 1/(3m)</strong> : " +
               "l'obtenir demande de distinguer selon que la machine critique porte 1, 2 ou au " +
               "moins 3 tâches — c'est long, et sans idée nouvelle. Si ton cours annonce 4/3 " +
               "sans le prouver, c'est pour ça.");
      }
    },

    /* 7 ------------------------------------------------------------------ */
    {
      chap: "Le défaut qui reste",
      titre: "Ce que le tri ne répare pas",
      say: "<p class='say'>Le tri a supprimé la mauvaise surprise de fin. Il ne supprime pas les " +
           "mauvais <strong>regroupements</strong> du début.</p>" +
           "<p class='say'>Cinq tâches : <strong>3, 3, 2, 2, 2</strong> sur deux machines. LPT " +
           "commence par séparer les deux 3 — ce qui semble raisonnable — alors qu'il fallait " +
           "les <strong>réunir</strong>.</p>" +
           "<p class='say'>Déroule LPT, puis construis l'optimum à la main en cliquant les " +
           "tâches.</p>",
      goal: "Atteins un makespan de " + SERRE.opt + " en déplaçant les tâches.",
      mount: function (api) {
        api.figHidden(true);
        var svg = neuf(api.host);
        var mode = "lpt", aff = null, gagne = false;

        function initAff() {
          aff = [];
          SERRE.lpt.trace.forEach(function (p) { aff[p.tache] = p.machine; });
        }
        initAff();

        function dessine() {
          var piles = [], charges = [], i;
          for (i = 0; i < SERRE.m; i++) { piles.push([]); charges.push(0); }
          aff.forEach(function (mi, j) {
            piles[mi].push({ duree: SERRE.durees[j], cls: "", tache: j });
            charges[mi] += SERRE.durees[j];
          });
          var e = { m: SERRE.m, piles: piles, charges: charges };
          var ms = maxDe(charges);
          if (ms === SERRE.opt) gagne = true;

          O.dessiner(svg, e, {
            hmax: SERRE.hmax,
            reperes: [{ v: SERRE.opt, cls: "opt", label: "OPT = " + SERRE.opt },
                      { v: SERRE.lpt.makespan, cls: "maxt",
                        label: "LPT : " + SERRE.lpt.makespan }],
            crit: critDe(charges),
            onTache: function (mi, mk, t) {
              aff[t.tache] = (aff[t.tache] + 1) % SERRE.m;
              mode = "libre";
              dessine();
            }
          });

          api.readout([
            { t: "makespan", v: ms, cls: ms === SERRE.opt ? "good" : "" },
            { t: "LPT", v: SERRE.lpt.makespan },
            { t: "OPT", v: SERRE.opt },
            { t: "ratio LPT", v: frac(SERRE.lpt.makespan / SERRE.opt) }
          ]);

          if (gagne) {
            api.fb("Voilà l'optimum : <strong>{3, 3}</strong> d'un côté, <strong>{2, 2, 2}</strong> " +
                   "de l'autre, soit 6 et 6. LPT, lui, fait <strong>7</strong> — ratio " +
                   "<strong>7/6</strong>, et 4/3 − 1/(3·2) = 7/6 <strong>exactement</strong>. " +
                   "Cette instance sature la borne de LPT.", "ok");
            api.solve();
          } else if (mode === "lpt") {
            api.fb("LPT a mis <strong>3 et 2</strong> ensemble d'un côté et <strong>3, 2 et 2</strong> " +
                   "de l'autre : 5 et 7. Clique les tâches pour chercher mieux.");
          } else {
            api.fb("Makespan " + ms + ". L'optimum est à " + SERRE.opt +
                   " — indice : les deux tâches de durée 3 doivent finir ensemble.");
          }
        }

        api.tools([
          bouton("Remettre le déroulé LPT", function () {
            initAff(); mode = "lpt"; dessine();
          })
        ]);
        dessine();
      }
    },

    /* 8 ------------------------------------------------------------------ */
    {
      chap: "Bilan",
      titre: "Ce que tu sais maintenant",
      say: "<p class='say'>LPT = list scheduling + un <strong>tri décroissant</strong>. Son " +
           "ratio est <strong>4/3 − 1/(3m)</strong>, atteint par 3, 3, 2, 2, 2 sur deux " +
           "machines.</p>" +
           "<p class='say'>La preuve réutilise <strong>tous</strong> les pas de celle du " +
           "glouton, et n'ajoute qu'une chose : <strong>p(j*) ≤ OPT/2</strong>, obtenue en " +
           "mettant les m+1 plus grandes tâches dans m tiroirs.</p>" +
           "<p class='say'>Le prix du tri : on perd la propriété <strong>en ligne</strong>. " +
           "Trier exige de connaître toutes les tâches, donc LPT ne peut pas traiter des tâches " +
           "qui arrivent à la volée.</p>" +
           "<p class='say'>Et ce qui reste du défaut : le tri supprime les mauvaises surprises " +
           "de fin, pas les mauvais regroupements du début.</p>",
      goal: null,
      mount: function (api) {
        api.figHidden(true);
        api.readoutNode(CI.h("div", { "class": "done-screen" }, [
          CI.h("div", { "class": "big", text: "✓" }),
          CI.h("p", { "class": "say", text: "Leçon terminée." })
        ]));
        api.tools([
          CI.h("a", { "class": "linkcard", href: "atelier-ordonnancement.html" }, [
            CI.h("div", { "class": "k", text: "manipuler" }),
            CI.h("div", { "class": "t", text: "Les deux gloutons, côte à côte" }),
            CI.h("div", { "class": "d", text: "Change l'instance et le nombre de machines, et vois où les deux déroulés divergent." })
          ]),
          CI.h("a", { "class": "linkcard", href: "lecon-preuve-graham.html" }, [
            CI.h("div", { "class": "k", text: "revoir" }),
            CI.h("div", { "class": "t", text: "La preuve du list scheduling" }),
            CI.h("div", { "class": "d", text: "Les deux minorants de OPT et le retournement sur la machine critique." })
          ])
        ]);
        api.solve();
      }
    }
  ];

  CI.Lesson({
    steps: STEPS,
    key: "lecon-preuve-lpt-progres",
    titre: "Trier d'abord : LPT",
    sousTitre: "Un tri décroissant fait tomber le ratio de 2 − 1/m à 4/3 − 1/(3m) — ce que ça " +
               "coûte, et ce que ça ne répare pas."
  });
})(window.CI, window.CI_ORDO);
