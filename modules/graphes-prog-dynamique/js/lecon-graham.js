/* =========================================================================
   lecon-graham.js — la preuve du ratio 2 − 1/m du list scheduling,
   deroulee pas a pas.

   Fil rouge : m = 3, six taches de duree 1 puis une de duree 3. Cette
   instance n'est pas prise au hasard -- c'est exactement la famille qui
   ATTEINT la borne (ALG = 5, OPT = 3, rapport 5/3 = 2 − 1/3). On voit donc
   dans le meme dessin la preuve et sa saturation.

   Les etapes sont des donnees ; le lecteur vit dans assets/js/lib/lesson.js.
   ========================================================================= */
(function (CI, O) {
  "use strict";

  var M = 3;
  var DUREES = O.pireGlouton(M);          /* [1,1,1,1,1,1,3] */
  var LS = O.deroule(DUREES, M, false);
  var OPT = O.optimum(DUREES, M);         /* 3 */
  var B = O.bornes(DUREES, M);            /* moyenne 3, maxTache 3 */
  var N = DUREES.length;

  /* La machine critique et la derniere tache posee dessus, calculees une
     fois : c'est le couple (i*, j*) de la preuve. */
  var CRIT = (function () {
    var k = 0, i;
    for (i = 1; i < M; i++) if (LS.charges[i] > LS.charges[k]) k = i;
    return k;
  })();

  var RANG_JSTAR = (function () {
    var r = -1;
    LS.trace.forEach(function (p, k) { if (p.machine === CRIT) r = k; });
    return r;                              /* dernier rang pose sur i* */
  })();

  var JSTAR = LS.trace[RANG_JSTAR];

  /* ------------------------------------------------ helpers de dessin */

  function neuf(hote) {
    var svg = CI.svg("svg", { "class": "ordo", role: "img",
                              "aria-label": "Charges des machines" });
    hote.appendChild(svg);
    return svg;
  }

  function hmaxCommun() {
    return Math.max(LS.makespan, OPT, B.borne) * 1.1;
  }

  function reperesBase(quoi) {
    var r = [];
    if (quoi.opt) r.push({ v: OPT, cls: "opt", label: "OPT = " + OPT });
    if (quoi.moy) r.push({ v: B.moyenne, cls: "moy", label: "Σpⱼ/m = " + B.moyenne });
    if (quoi.maxt) r.push({ v: B.maxTache, cls: "maxt", label: "max pⱼ = " + B.maxTache });
    return r;
  }

  /** Etat libre : des piles que l'utilisateur manipule (etapes de minorants). */
  function etatLibre(aff) {
    var piles = [], charges = [], i;
    for (i = 0; i < M; i++) { piles.push([]); charges.push(0); }
    aff.forEach(function (mi, j) {
      piles[mi].push({ duree: DUREES[j], cls: "", tache: j });
      charges[mi] += DUREES[j];
    });
    return { m: M, piles: piles, charges: charges };
  }

  function maxDe(charges) { return Math.max.apply(null, charges); }

  function bouton(txt, fn, cls) {
    var b = CI.h("button", cls ? { "class": cls } : {}, txt);
    b.onclick = fn;
    return b;
  }

  /** Une chaine d'inegalites revelee ligne a ligne. */
  function chaine(lignes, hote) {
    var vues = 0;
    var box = CI.h("div", { "class": "chaine" });
    hote.appendChild(box);

    function dessine() {
      CI.clear(box);
      lignes.forEach(function (l, k) {
        box.appendChild(CI.h("div", {
          "class": "ligne" + (k < vues ? " vue" : "") + (l.cle ? " cle" : ""),
          html: l.t + (l.j ? " <span class='just'>" + l.j + "</span>" : "")
        }));
      });
    }
    dessine();
    return {
      suivante: function () { if (vues < lignes.length) vues++; dessine(); return vues; },
      tout: function () { vues = lignes.length; dessine(); },
      fini: function () { return vues >= lignes.length; },
      total: lignes.length
    };
  }

  /* ------------------------------------------------ les etapes */

  var STEPS = [

    /* 1 ------------------------------------------------------------------ */
    {
      chap: "L'énoncé",
      titre: "Ce qu'on veut démontrer",
      say: "<p class='say'>Le list scheduling pose chaque tâche sur la machine la moins chargée. " +
           "On veut prouver que son makespan n'excède jamais " +
           "<strong>(2 − 1/m) · OPT</strong>, sur <em>toute</em> instance.</p>" +
           "<p class='say'>L'instance de cette leçon : <strong>3 machines</strong>, six tâches " +
           "de durée 1, puis une de durée 3. Déroule-la.</p>",
      goal: "Place les " + N + " tâches et lis le makespan obtenu.",
      mount: function (api) {
        api.figHidden(true);
        var k = 0;
        var svg = neuf(api.host);

        function dessine() {
          var e = O.etatApres(LS, M, k, { cur: k - 1 });
          O.dessiner(svg, e, {
            hmax: hmaxCommun(),
            reperes: k === N ? reperesBase({ opt: true }) : [],
            moins: k > 0 ? LS.trace[k - 1].machine : undefined
          });

          api.readout([
            { t: "tâches posées", v: k + " / " + N },
            { t: "makespan", v: maxDe(e.charges), cls: k === N ? "good" : "" },
            { t: "OPT", v: k === N ? OPT : "—" }
          ]);

          if (k < N) {
            api.fb("Chaque tâche va sur la colonne la plus basse. Les six tâches de durée 1 " +
                   "s'étalent, et la grosse arrive en dernier.");
          } else {
            api.fb("Makespan <strong>" + LS.makespan + "</strong>, alors que l'optimum vaut " +
                   "<strong>" + OPT + "</strong> : il suffisait de réserver une machine pour la " +
                   "tâche de durée 3. Rapport <strong>" + LS.makespan + "/" + OPT + "</strong>, " +
                   "soit exactement 2 − 1/3. Cette instance <em>sature</em> la borne qu'on va " +
                   "démontrer.", "ok");
            api.solve();
          }
        }

        api.tools([
          bouton("Poser une tâche", function () { if (k < N) { k++; dessine(); } }, "primary"),
          bouton("Tout poser", function () { k = N; dessine(); }),
          bouton("Recommencer", function () { k = 0; dessine(); })
        ]);
        dessine();
      }
    },

    /* 2 ------------------------------------------------------------------ */
    {
      chap: "Les deux minorants",
      titre: "OPT ≥ la plus grande tâche",
      say: "<p class='say'>On ne peut pas calculer OPT — le problème est NP-difficile. On va " +
           "donc le <strong>minorer</strong>, et c'est tout ce dont la preuve aura besoin.</p>" +
           "<p class='say'>Premier minorant, presque une évidence : la plus grande tâche " +
           "s'exécute quelque part, <strong>en entier</strong>, sans être coupée. La machine qui " +
           "l'accueille porte donc au moins sa durée.</p>" +
           "<p class='say'>Clique la tâche de durée 3 pour la déplacer de machine en machine.</p>",
      goal: "Promène la grosse tâche et constate que le makespan ne descend jamais sous 3.",
      mount: function (api) {
        api.figHidden(true);
        /* la grosse tache seule, l'utilisateur la deplace */
        var ou = 0, essais = 0;
        var svg = neuf(api.host);

        function dessine() {
          var piles = [], charges = [], i;
          for (i = 0; i < M; i++) { piles.push([]); charges.push(0); }
          piles[ou].push({ duree: 3, cls: "jstar", tache: 6 });
          charges[ou] = 3;
          var e = { m: M, piles: piles, charges: charges };

          O.dessiner(svg, e, {
            hmax: hmaxCommun(),
            reperes: reperesBase({ maxt: true }),
            crit: ou,
            onTache: function () { ou = (ou + 1) % M; essais++; dessine(); }
          });

          api.readout([
            { t: "makespan", v: 3 },
            { t: "déplacements", v: essais },
            { t: "max pⱼ", v: B.maxTache }
          ]);

          if (essais < 2) {
            api.fb("Clique le bloc pour l'envoyer sur la machine suivante.");
          } else {
            api.fb("Où qu'elle aille, la machine qui la porte est à 3. Donc " +
                   "<strong>OPT ≥ max pⱼ</strong>. C'est vrai pour <em>n'importe quel</em> " +
                   "ordonnancement, donc pour l'optimal — et c'est pour ça que ça minore OPT.", "ok");
            api.solve();
          }
        }
        dessine();
      }
    },

    /* 3 ------------------------------------------------------------------ */
    {
      chap: "Les deux minorants",
      titre: "OPT ≥ la moyenne des charges",
      say: "<p class='say'>Le travail total vaut <strong>Σpⱼ = " + B.total + "</strong>, à " +
           "répartir sur <strong>" + M + "</strong> machines. Un maximum est toujours supérieur " +
           "ou égal à une moyenne, donc le makespan est ≥ <strong>" + B.total + "/" + M +
           " = " + B.moyenne + "</strong>.</p>" +
           "<p class='say'>Essaie de descendre en dessous : clique une tâche pour l'envoyer sur " +
           "la machine suivante. La ligne verte est la moyenne — elle est infranchissable.</p>",
      goal: "Atteins un makespan de <strong>" + B.moyenne + "</strong>, c'est-à-dire la moyenne " +
            "exactement. C'est possible, et ça prouve du même coup que OPT = " + OPT + ".",
      mount: function (api) {
        api.figHidden(true);
        /* affectation initiale : celle du glouton, a l'utilisateur de l'ameliorer */
        var aff = [];
        LS.trace.forEach(function (p) { aff[p.tache] = p.machine; });
        var svg = neuf(api.host);
        var gagne = false;

        function dessine() {
          var e = etatLibre(aff);
          var ms = maxDe(e.charges);
          if (ms === B.moyenne) gagne = true;

          O.dessiner(svg, e, {
            hmax: hmaxCommun(),
            reperes: reperesBase({ moy: true }),
            crit: (function () {
              var k = 0, i;
              for (i = 1; i < M; i++) if (e.charges[i] > e.charges[k]) k = i;
              return k;
            })(),
            onTache: function (mi, mk, t) {
              aff[t.tache] = (aff[t.tache] + 1) % M;
              dessine();
            }
          });

          api.readout([
            { t: "makespan", v: ms, cls: ms === B.moyenne ? "good" : "" },
            { t: "moyenne", v: B.moyenne },
            { t: "écart", v: ms - B.moyenne }
          ]);

          if (gagne) {
            api.fb("Tu viens de construire un ordonnancement de makespan " + B.moyenne + " : " +
                   "la tâche de 3 seule, et trois tâches de 1 sur chacune des deux autres. " +
                   "Donc <strong>OPT ≤ 3</strong>. Et la moyenne donne <strong>OPT ≥ 3</strong>. " +
                   "Les deux ensemble : <strong>OPT = 3</strong>, démontré, sans énumération.", "ok");
            api.solve();
          } else {
            api.fb("Makespan " + ms + ", la moyenne est à " + B.moyenne + ". Déplace les tâches " +
                   "— et remarque qu'aucun arrangement ne passe sous la ligne verte : le travail " +
                   "doit bien aller quelque part.");
          }
        }
        dessine();
      }
    },

    /* 4 ------------------------------------------------------------------ */
    {
      chap: "La preuve",
      titre: "Choisir les deux bons témoins",
      say: "<p class='say'>Retour à l'ordonnancement du glouton. La preuve ne parle que de deux " +
           "objets, et il faut les choisir précisément.</p>" +
           "<p class='say'><strong>i*</strong> : une machine qui <em>réalise</em> le makespan. " +
           "<strong>j*</strong> : la <strong>dernière</strong> tâche posée sur i*.</p>" +
           "<p class='say'>« Dernière » n'est pas cosmétique : c'est ce qui permettra d'écrire " +
           "L(i*) = L′(i*) + p(j*) à l'étape suivante.</p>",
      goal: "Clique la machine critique i*, puis la tâche j* sur cette machine.",
      mount: function (api) {
        api.figHidden(true);
        var svg = neuf(api.host);
        var mOK = false, jOK = false;

        function dessine() {
          var e = O.etatApres(LS, M, N, jOK ? { jstar: RANG_JSTAR } : null);
          O.dessiner(svg, e, {
            hmax: hmaxCommun(),
            reperes: reperesBase({ opt: true }),
            crit: mOK ? CRIT : undefined,
            onTache: function (mi, mk, t) {
              if (!mOK) {
                if (mi === CRIT) { mOK = true; api.fb("Oui : M" + (CRIT + 1) + " porte " +
                    LS.charges[CRIT] + ", c'est elle qui fait le makespan. Maintenant j*.", "ok"); }
                else { api.fb("M" + (mi + 1) + " est à " + LS.charges[mi] + ", ce n'est pas " +
                    "le maximum. Cherche la colonne la plus haute.", "ko"); }
              } else if (mi === CRIT) {
                if (t.rang === RANG_JSTAR) { jOK = true; }
                else { api.fb("Cette tâche est bien sur i*, mais ce n'est pas la " +
                    "<strong>dernière</strong> posée. La dernière est celle du haut de la pile.", "ko"); }
              } else {
                api.fb("j* doit être sur i*, pas sur une autre machine.", "ko");
              }
              dessine();
            }
          });

          api.readout([
            { t: "i*", v: mOK ? "M" + (CRIT + 1) : "?" , cls: mOK ? "good" : "" },
            { t: "L(i*)", v: mOK ? LS.charges[CRIT] : "—" },
            { t: "j*", v: jOK ? "durée " + JSTAR.duree : "?", cls: jOK ? "good" : "" }
          ]);

          if (mOK && jOK) {
            api.fb("i* = M" + (CRIT + 1) + ", et j* est la tâche de durée <strong>" +
                   JSTAR.duree + "</strong>, posée en dernier dessus. " +
                   "Sur cette instance j* est la grosse tâche — ce n'est pas toujours le cas, " +
                   "mais c'est pour ça que l'instance est extrémale.", "ok");
            api.solve();
          }
        }
        dessine();
      }
    },

    /* 5 ------------------------------------------------------------------ */
    {
      chap: "La preuve",
      titre: "La machine la plus chargée était la moins chargée",
      say: "<p class='say'>Voilà le pas où tout le monde décroche, et il se voit mieux qu'il " +
           "s'explique. Bascule entre les deux instants.</p>" +
           "<p class='say'>Comme j* est la <strong>dernière</strong> tâche posée sur i*, rien " +
           "n'y est ajouté après : <strong>L(i*) = L′(i*) + p(j*)</strong>, où L′ désigne les " +
           "charges juste avant la pose.</p>" +
           "<p class='say'>Et au moment de cette pose, la règle de l'algorithme dit que i* était " +
           "<strong>la moins chargée de toutes</strong>.</p>",
      goal: "Regarde les deux instants, puis reviens sur « juste avant ».",
      mount: function (api) {
        api.figHidden(true);
        var svg = neuf(api.host);
        var avant = true, vuA = false, vuF = false;

        function dessine() {
          if (avant) vuA = true; else vuF = true;
          var k = avant ? RANG_JSTAR : N;
          var e = O.etatApres(LS, M, k, avant ? null : { jstar: RANG_JSTAR });
          var ms = maxDe(e.charges);

          O.dessiner(svg, e, {
            hmax: hmaxCommun(),
            reperes: [],
            crit: avant ? undefined : CRIT,
            moins: avant ? CRIT : undefined
          });

          api.readout([
            { t: "instant", v: avant ? "juste avant j*" : "à la fin", small: true },
            { t: avant ? "L′(i*)" : "L(i*)", v: e.charges[CRIT],
              cls: avant ? "good" : "" },
            { t: avant ? "la plus basse ?" : "la plus haute ?",
              v: avant ? (e.charges[CRIT] === Math.min.apply(null, e.charges) ? "oui" : "non")
                       : (e.charges[CRIT] === ms ? "oui" : "non"), cls: "good" }
          ]);

          if (avant) {
            api.fb("Juste avant la pose, i* = M" + (CRIT + 1) + " est à <strong>" +
                   e.charges[CRIT] + "</strong> — <strong>la plus basse</strong>, cerclée en vert. " +
                   "C'est exactement pourquoi l'algorithme choisit cette machine.");
          } else {
            api.fb("À la fin, la même machine est à <strong>" + LS.charges[CRIT] +
                   "</strong> — <strong>la plus haute</strong>, cerclée en rouge. " +
                   "Les deux affirmations ne se contredisent pas : entre les deux, j* est tombée " +
                   "dessus et tout le reste est allé ailleurs.");
          }

          if (vuA && vuF && avant) {
            api.fb("Tu as vu les deux. <strong>L(i*) = L′(i*) + p(j*)</strong> = " +
                   e.charges[CRIT] + " + " + JSTAR.duree + " = " + LS.charges[CRIT] +
                   ", et L′(i*) était le minimum. Ces deux faits sont toute la preuve.", "ok");
            api.solve();
          }
        }

        api.tools([
          bouton("Juste avant j*", function () { avant = true; dessine(); }, "primary"),
          bouton("À la fin", function () { avant = false; dessine(); })
        ]);
        dessine();
      }
    },

    /* 6 ------------------------------------------------------------------ */
    {
      chap: "La preuve",
      titre: "Du minimum à la moyenne",
      say: "<p class='say'>On sait que L′(i*) ≤ L′(i) pour <em>toute</em> machine i. Somme ces " +
           "m inégalités : le membre de gauche ne dépend pas de i, donc " +
           "<strong>m · L′(i*) ≤ Σᵢ L′(i)</strong>.</p>" +
           "<p class='say'>Or Σᵢ L′(i) est le travail <strong>déjà posé</strong>, qui ne contient " +
           "pas j*. Donc Σᵢ L′(i) ≤ Σⱼ pⱼ − p(j*).</p>",
      goal: null,
      mount: function (api) {
        api.figHidden(true);
        var svg = neuf(api.host);
        var e = O.etatApres(LS, M, RANG_JSTAR, null);
        var somme = e.charges.reduce(function (s, x) { return s + x; }, 0);

        O.dessiner(svg, e, {
          hmax: hmaxCommun(),
          reperes: [{ v: e.charges[CRIT], cls: "moy", label: "L′(i*) = " + e.charges[CRIT] }],
          moins: CRIT
        });

        api.readout([
          { t: "L′(i*)", v: e.charges[CRIT] },
          { t: "Σᵢ L′(i)", v: somme },
          { t: "m · L′(i*)", v: M * e.charges[CRIT] },
          { t: "Σⱼpⱼ − p(j*)", v: B.total - JSTAR.duree }
        ]);

        api.fb("Ici : <strong>m·L′(i*) = " + M * e.charges[CRIT] + " ≤ " + somme +
               " = Σᵢ L′(i)</strong>, et " + somme + " ≤ " + (B.total - JSTAR.duree) +
               " = Σⱼpⱼ − p(j*). En divisant par m : <strong>L′(i*) ≤ (Σⱼpⱼ − p(j*))/m</strong>." +
               "<br>C'est ce <em>− p(j*)</em> qui produira le − 1/m final. L'oublier donne la " +
               "version arrondie, « ratio 2 ».");
      }
    },

    /* 7 ------------------------------------------------------------------ */
    {
      chap: "La preuve",
      titre: "Assembler la chaîne",
      say: "<p class='say'>Tout est en place. Révèle les lignes une par une et regarde où " +
           "chacun des deux minorants entre en jeu — chacun servira <strong>exactement une " +
           "fois</strong>.</p>",
      goal: "Révèle la chaîne jusqu'à la conclusion.",
      mount: function (api) {
        api.figHidden(true);

        var ch = chaine([
          { t: "ALG = L(i*) = L′(i*) + p(j*)", j: "pas 2 : j* est la dernière posée sur i*" },
          { t: "&nbsp;&nbsp;&nbsp;&nbsp;≤ (1/m)·(Σⱼpⱼ − p(j*)) + p(j*)", j: "pas 3 et 4 : i* était la moins chargée" },
          { t: "&nbsp;&nbsp;&nbsp;&nbsp;= (1/m)·Σⱼpⱼ + p(j*)·(1 − 1/m)", j: "pur calcul, on factorise p(j*)" },
          { t: "&nbsp;&nbsp;&nbsp;&nbsp;≤ OPT + p(j*)·(1 − 1/m)", j: "minorant 2 : OPT ≥ Σⱼpⱼ/m" },
          { t: "&nbsp;&nbsp;&nbsp;&nbsp;≤ OPT + OPT·(1 − 1/m)", j: "minorant 1 : OPT ≥ max pⱼ ≥ p(j*), et 1 − 1/m ≥ 0" },
          { t: "ALG ≤ (2 − 1/m) · OPT", cle: true, j: "∎" }
        ], api.host);

        function maj() {
          var v = ch.suivante();
          api.readout([
            { t: "lignes révélées", v: v + " / " + ch.total },
            { t: "sur cette instance", v: LS.makespan + " ≤ " +
              (Math.round((2 - 1 / M) * OPT * 100) / 100) }
          ]);
          if (ch.fini()) {
            api.fb("Et sur notre instance : ALG = " + LS.makespan + ", (2 − 1/3)·OPT = " +
                   "(5/3)·3 = 5. L'inégalité est une <strong>égalité</strong> — la preuve ne " +
                   "laisse rien sur la table, le ratio 2 − 1/m est serré.", "ok");
            api.solve();
          } else {
            api.fb("");
          }
        }

        api.tools([
          bouton("Ligne suivante", maj, "primary"),
          bouton("Tout révéler", function () { ch.tout(); maj(); })
        ]);
        api.readout([{ t: "lignes révélées", v: "0 / " + ch.total }]);
      }
    },

    /* 8 ------------------------------------------------------------------ */
    {
      chap: "Bilan",
      titre: "Ce que tu sais maintenant",
      say: "<p class='say'>Le list scheduling est une <strong>(2 − 1/m)-approximation</strong>, " +
           "et cette borne est <strong>atteinte</strong> — l'instance de cette leçon la sature.</p>" +
           "<p class='say'>La preuve repose sur un seul retournement : la machine la plus " +
           "chargée à la fin était <strong>la moins chargée</strong> quand sa dernière tâche y " +
           "a été posée.</p>" +
           "<p class='say'>Et sur deux minorants de OPT, utilisés une fois chacun : la " +
           "<strong>moyenne</strong> et la <strong>plus grande tâche</strong>. Retire l'un des " +
           "deux, la preuve ne se termine pas.</p>" +
           "<p class='say'>Aucun pas n'a utilisé l'ordre d'arrivée des tâches. C'est pourquoi la " +
           "garantie vaut aussi <strong>en ligne</strong>, quand les tâches arrivent une à une " +
           "sans qu'on connaisse la suite.</p>",
      goal: null,
      mount: function (api) {
        api.figHidden(true);
        api.readoutNode(CI.h("div", { "class": "done-screen" }, [
          CI.h("div", { "class": "big", text: "✓" }),
          CI.h("p", { "class": "say", text: "Leçon terminée." })
        ]));
        api.tools([
          CI.h("a", { "class": "linkcard", href: "lecon-preuve-lpt.html" }, [
            CI.h("div", { "class": "k", text: "la suite" }),
            CI.h("div", { "class": "t", text: "Trier d'abord : la preuve de LPT" }),
            CI.h("div", { "class": "d", text: "Le même squelette, un seul ingrédient en plus, et le ratio tombe de 5/3 à 4/3." })
          ]),
          CI.h("a", { "class": "linkcard", href: "atelier-ordonnancement.html" }, [
            CI.h("div", { "class": "k", text: "manipuler" }),
            CI.h("div", { "class": "t", text: "Les deux gloutons, côte à côte" }),
            CI.h("div", { "class": "d", text: "Choisis l'instance et le nombre de machines, et compare les deux déroulés." })
          ])
        ]);
        api.solve();
      }
    }
  ];

  CI.Lesson({
    steps: STEPS,
    key: "lecon-preuve-graham-progres",
    titre: "La preuve du list scheduling",
    sousTitre: "Pourquoi un glouton myope ne dépasse jamais (2 − 1/m) fois l'optimum — " +
               "la démonstration de Graham, pas par pas."
  });
})(window.CI, window.CI_ORDO);
