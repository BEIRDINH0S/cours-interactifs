/* =========================================================================
   lecon-data-race.js — « Data race et exclusion mutuelle ».

   Un seul exemple du debut a la fin : deux fils qui incrementent le meme
   compteur. Tout se joue sur l'ordre dans lequel on les fait avancer, et
   c'est le lecteur qui decide de cet ordre.

   Les etapes sont des donnees ; le lecteur vit dans assets/js/lib/lesson.js.
   ========================================================================= */
(function (CI) {
  "use strict";


  /* ------------------------------------------------ helpers de la lecon */

  /** Installe un simulateur dans le conteneur libre de l'etape. */
  function sim(api, cfg) {
    var box = CI.h("div");
    api.host.appendChild(box);
    api.figHidden(true);
    var s = new CI.ThreadSim(box, cfg);
    CI.__lastSim = s;   // point d'accroche pour les tests automatises
    return s;
  }

  function boutonsRejouer(s, extra) {
    var r = CI.h("button", { text: "Recommencer" });
    r.onclick = function () { s.reset(); s.onChange(s); };
    var h = CI.h("button", { text: "Ordre au hasard" });
    h.onclick = function () { s.reset(); s.runRandom(); s.onChange(s); };
    return extra ? [r, h].concat(extra) : [r, h];
  }

  /**
   * Deux fils, N increments chacun, entrelacement aleatoire.
   * Rend la valeur finale du compteur. Simulation purement numerique :
   * chaque increment est LOAD / ADD / STORE.
   */
  function course(n) {
    var c = 0;
    var t = [{ pc: 0, reg: 0 }, { pc: 0, reg: 0 }];
    var reste = 6 * n;            // 3 instructions x n increments x 2 fils
    while (reste > 0) {
      var libres = [];
      if (t[0].pc < 3 * n) libres.push(0);
      if (t[1].pc < 3 * n) libres.push(1);
      var i = libres[Math.floor(Math.random() * libres.length)];
      var phase = t[i].pc % 3;
      if (phase === 0) t[i].reg = c;
      else if (phase === 1) t[i].reg++;
      else c = t[i].reg;
      t[i].pc++; reste--;
    }
    return c;
  }

  /* ------------------------------------------------ les etapes */

  var STEPS = [

    /* 1 ------------------------------------------------------------------ */
    {
      chap: "La course",
      titre: "Deux fils, un compteur",
      say: "<p class='say'>Deux fils d'exécution veulent ajouter 1 au même compteur. " +
           "<strong>Toi</strong> tu décides lequel avance, un pas à la fois.</p>" +
           "<p class='say'>Pour l'instant, fais comme si <code>c++</code> était une seule " +
           "instruction, indivisible.</p>",
      goal: "Fais aller les deux fils jusqu'au bout.",
      mount: function (api) {
        var s = sim(api, {
          threads: [
            { name: "Thread 1", code: CI.incrAtomique("c", 1) },
            { name: "Thread 2", code: CI.incrAtomique("c", 1) }
          ],
          mem: { c: 0 }
        });
        s.onChange = function (st) {
          api.tools(boutonsRejouer(st));
          api.readout([{ t: "compteur c", v: st.mem.c, cls: st.mem.c === 2 ? "good" : "" }]);
          if (st.allDone()) {
            api.fb("<strong>c = 2</strong>, et tu auras beau changer l'ordre, ce sera toujours 2. " +
                   "Tout va bien — sauf que <code>c++</code> n'est pas une instruction.", "ok");
            api.solve();
          } else {
            api.fb("Avance l'un ou l'autre, dans l'ordre que tu veux.");
          }
        };
        s.onChange(s);
      }
    },

    /* 2 ------------------------------------------------------------------ */
    {
      chap: "La course",
      titre: "c++ n'existe pas",
      say: "<p class='say'>Le processeur ne sait pas incrémenter une case mémoire d'un bloc. Il " +
           "<strong>lit</strong>, il <strong>ajoute</strong> dans un registre, il " +
           "<strong>écrit</strong>. Trois instructions, et chacune peut être interrompue.</p>" +
           "<p class='say'>Chaque fil a son propre registre : <code>r</code> appartient au fil, " +
           "<code>c</code> est partagé.</p>",
      goal: "Trouve un ordre qui termine avec <strong>c = 1</strong>.",
      mount: function (api) {
        var s = sim(api, {
          threads: [
            { name: "Thread 1", code: CI.incrDetaille("c", "r", 1) },
            { name: "Thread 2", code: CI.incrDetaille("c", "r", 1) }
          ],
          mem: { c: 0 }
        });
        s.onChange = function (st) {
          api.tools(boutonsRejouer(st));
          api.readout([{ t: "compteur c", v: st.mem.c, cls: st.mem.c === 1 ? "bad" : "" }]);
          if (!st.allDone()) {
            api.fb("Indice : fais lire les deux fils <em>avant</em> que l'un des deux écrive.");
          } else if (st.mem.c === 1) {
            api.fb("Un incrément a disparu. Les deux fils ont lu <strong>0</strong>, les deux ont " +
                   "écrit <strong>1</strong> : la seconde écriture a écrasé la première. " +
                   "Le compteur ne saura jamais qu'on lui a demandé deux additions.", "ok");
            api.solve();
          } else {
            api.fb("c = 2 : cet ordre-là est correct. Recommence et entrelace davantage — " +
                   "les deux lectures d'abord.");
          }
        };
        s.onChange(s);
      }
    },

    /* 3 ------------------------------------------------------------------ */
    {
      chap: "La course",
      titre: "Ça porte un nom",
      say: "<p class='say'>Une <strong>data race</strong> : deux fils accèdent à la même case " +
           "mémoire sans synchronisation, et <strong>au moins un des deux écrit</strong>.</p>" +
           "<p class='say'>Les deux conditions comptent. Deux lectures simultanées ne posent aucun " +
           "problème — rien ne change, personne n'écrase personne.</p>",
      goal: "Parmi ces trois situations, laquelle est une data race ?",
      mount: function (api) {
        api.figHidden(true);
        var cas = [
          { txt: "Deux fils lisent c", race: false,
            why: "Non : personne n'écrit, la valeur ne bouge pas. Autant de lecteurs qu'on veut." },
          { txt: "Un fil lit c, l'autre écrit c", race: true,
            why: "Oui. Le lecteur peut attraper la valeur avant ou après l'écriture, et rien ne " +
                 "dit laquelle — c'est bien une course." },
          { txt: "Deux fils écrivent dans leur variable locale", race: false,
            why: "Non : chaque fil a sa propre pile. Pas de case partagée, pas de course." }
        ];
        var btns = cas.map(function (c) {
          var b = CI.h("button", { text: c.txt });
          b.onclick = function () {
            b.className = c.race ? "right" : "wrong";
            api.fb(c.why, c.race ? "ok" : "ko");
            if (c.race) api.solve();
          };
          return b;
        });
        api.host.appendChild(CI.h("div", { "class": "quiz" }, btns));
        api.fb("Clique sur celle qui en est une.");
      }
    },

    /* 4 ------------------------------------------------------------------ */
    {
      chap: "La course",
      titre: "Quand les incréments se multiplient",
      say: "<p class='say'>Deux fils, <strong>N incréments chacun</strong>, ordre laissé au hasard. " +
           "Le résultat devrait valoir 2N.</p>" +
           "<p class='say'>Lance quelques exécutions et regarde ce qui sort vraiment.</p>",
      goal: "Obtiens au moins une exécution où <strong>c &lt; 2N</strong>.",
      mount: function (api) {
        api.figHidden(true);
        var n = 50, runs = [];
        var slider = CI.h("input", { type: "range", min: "2", max: "400", value: "50", id: "n-incr" });
        var lab = CI.h("span", { "class": "mono", text: "N = 50" });
        var go = CI.h("button", { "class": "primary", text: "Lancer 5 fois" });
        api.tools([lab, slider, go]);

        var liste = CI.h("div", { "class": "tally" });
        api.readoutNode(liste);

        function draw() {
          CI.clear(liste);
          liste.appendChild(CI.h("div", { "class": "line" }, [
            CI.h("span", { "class": "lab", text: "attendu" }),
            CI.h("span", { "class": "cnt", text: String(2 * n) })
          ]));
          runs.slice(-6).forEach(function (v, i) {
            liste.appendChild(CI.h("div", { "class": "line" }, [
              CI.h("span", { "class": "lab", text: "essai " + (runs.length - Math.min(6, runs.length) + i + 1) }),
              CI.h("span", { "class": "track" }, [
                CI.h("span", { "class": "fill" + (v === 2 * n ? " good" : ""),
                               style: { width: (100 * v / (2 * n)).toFixed(0) + "%" } })
              ]),
              CI.h("span", { "class": "cnt", text: String(v) })
            ]));
          });
        }
        slider.addEventListener("input", function (e) { n = +e.target.value; lab.textContent = "N = " + n; runs = []; draw(); });
        go.onclick = function () {
          for (var i = 0; i < 5; i++) runs.push(course(n));
          draw();
          var perdus = runs.filter(function (v) { return v < 2 * n; }).length;
          if (perdus) {
            var pire = Math.min.apply(null, runs);
            api.fb("Des incréments se perdent : la pire exécution a rendu <strong>" + pire +
                   "</strong> au lieu de " + (2 * n) + ". Et ce n'est pas un bug du programme — " +
                   "le programme est exactement celui que tu as écrit.", "ok");
            api.solve();
          } else {
            api.fb("Aucune perte sur ces essais. Monte N : plus il y a d'instructions, plus les " +
                   "occasions de s'entrelacer sont nombreuses.");
          }
        };
        draw();
      }
    },

    /* 5 ------------------------------------------------------------------ */
    {
      chap: "La course",
      titre: "Jusqu'où ça peut tomber",
      say: "<p class='say'>Deux fils, N incréments chacun, N au moins égal à 2. Sans " +
           "synchronisation, quelle est la <strong>plus petite valeur</strong> que c puisse " +
           "atteindre ?</p>",
      goal: "Choisis la bonne réponse.",
      mount: function (api) {
        api.figHidden(true);
        var bon = 2;
        var choix = [
          { v: 0, why: "Non. Une écriture écrit toujours « ce que j'ai lu, plus un » : jamais 0." },
          { v: 1, why: "Presque — mais impossible. Pour finir à 1, la dernière écriture devrait " +
                       "avoir lu 0, donc avoir lu avant toute écriture. Or c'est la dernière " +
                       "instruction de son fil, et ce fil a déjà écrit au moins une fois avant " +
                       "(N ≥ 2). Elle a donc lu au moins 1." },
          { v: 2, why: "Oui. On peut descendre jusqu'à 2, et pas plus bas : la dernière écriture de " +
                       "chaque fil ne peut pas avoir lu 0, puisque ce fil avait déjà écrit avant. " +
                       "C'est la question piège classique." },
          { v: "N", why: "Non, on peut faire bien pire : des incréments d'un fil entier peuvent " +
                         "être écrasés." }
        ];
        var btns = choix.map(function (c) {
          var b = CI.h("button", { text: String(c.v) });
          b.onclick = function () {
            var ok = (c.v === bon);
            b.className = ok ? "right" : "wrong";
            api.fb(c.why, ok ? "ok" : "ko");
            if (ok) api.solve();
          };
          return b;
        });
        api.host.appendChild(CI.h("div", { "class": "quiz" }, btns));
        api.readout([{ t: "le programme", v: "2 fils × N incréments", small: true }]);
      }
    },

    /* 6 ------------------------------------------------------------------ */
    {
      chap: "Le verrou",
      titre: "Le verrou",
      say: "<p class='say'>Un <strong>mutex</strong> : un seul fil peut le détenir. Celui qui " +
           "appelle <code>lock</code> alors qu'il est pris <strong>attend</strong>.</p>" +
           "<p class='say'>Le code entre <code>lock</code> et <code>unlock</code> s'appelle la " +
           "<strong>section critique</strong>. Essaie maintenant de refaire perdre un incrément.</p>",
      goal: "Termine les deux fils, et constate la valeur finale.",
      mount: function (api) {
        var crit = function () {
          return [{ k: "lock", l: "A" }]
            .concat(CI.incrDetaille("c", "r", 1))
            .concat([{ k: "unlock", l: "A" }]);
        };
        var s = sim(api, {
          threads: [
            { name: "Thread 1", code: crit() },
            { name: "Thread 2", code: crit() }
          ],
          mem: { c: 0 },
          locks: ["A"]
        });
        s.onChange = function (st) {
          api.tools(boutonsRejouer(st));
          api.readout([{ t: "compteur c", v: st.mem.c, cls: st.allDone() && st.mem.c === 2 ? "good" : "" }]);
          if (st.allDone()) {
            api.fb("<strong>c = 2</strong>, quoi que tu fasses. Le second fil n'a jamais pu entrer " +
                   "entre la lecture et l'écriture du premier : c'est ça, l'exclusion mutuelle.", "ok");
            api.solve();
          } else if (st.threads.some(function (_, i) { return st.isBlocked(i); })) {
            api.fb("Un fil est bloqué sur <code>lock</code> : il attend que l'autre relâche. " +
                   "Tu ne peux plus l'entrelacer, même en le voulant.");
          } else {
            api.fb("Avance comme tu veux. Essaie de glisser l'autre fil au milieu.");
          }
        };
        s.onChange(s);
      }
    },

    /* 7 ------------------------------------------------------------------ */
    {
      chap: "Le verrou",
      titre: "Le verrou ne protège rien tout seul",
      say: "<p class='say'>Rien, dans la machine, ne relie un verrou à une donnée. " +
           "« <code>A</code> protège <code>c</code> » n'existe que dans la tête de celui qui " +
           "écrit le code.</p>" +
           "<p class='say'>Ici, un seul des deux fils prend le verrou.</p>",
      goal: "Termine l'exécution et trouve une valeur fausse.",
      mount: function (api) {
        var s = sim(api, {
          threads: [
            { name: "Thread 1", code: [{ k: "lock", l: "A" }]
                .concat(CI.incrDetaille("c", "r", 1))
                .concat([{ k: "unlock", l: "A" }]) },
            { name: "Thread 2", code: CI.incrDetaille("c", "r", 1) }
          ],
          mem: { c: 0 },
          locks: ["A"]
        });
        s.onChange = function (st) {
          api.tools(boutonsRejouer(st));
          api.readout([{ t: "compteur c", v: st.mem.c, cls: st.allDone() && st.mem.c === 1 ? "bad" : "" }]);
          if (!st.allDone()) {
            api.fb("Le Thread 2 n'appelle jamais <code>lock</code> : rien ne l'arrête.");
          } else if (st.mem.c === 1) {
            api.fb("La course est toujours là. Un verrou ne protège une donnée que si " +
                   "<strong>tous</strong> ceux qui y touchent le prennent. Un seul resquilleur " +
                   "suffit à tout casser.", "ok");
            api.solve();
          } else {
            api.fb("c = 2 cette fois. Recommence : fais lire le Thread 2 pendant que le Thread 1 " +
                   "est dans sa section critique.");
          }
        };
        s.onChange(s);
      }
    },

    /* 8 ------------------------------------------------------------------ */
    {
      chap: "L'interblocage",
      titre: "Deux verrous, et plus personne n'avance",
      say: "<p class='say'>Deux comptes à virer l'un vers l'autre, un verrou par compte. Chaque fil " +
           "prend d'abord le sien, puis celui de l'autre.</p>" +
           "<p class='say'>Fais avancer les deux fils d'un pas chacun, puis essaie de continuer.</p>",
      goal: "Provoque l'interblocage : plus aucun fil ne peut avancer.",
      mount: function (api) {
        var s = sim(api, {
          threads: [
            { name: "Thread 1", code: [
              { k: "lock", l: "A" }, { k: "lock", l: "B" },
              { k: "note", txt: "virement" },
              { k: "unlock", l: "B" }, { k: "unlock", l: "A" }
            ] },
            { name: "Thread 2", code: [
              { k: "lock", l: "B" }, { k: "lock", l: "A" },
              { k: "note", txt: "virement" },
              { k: "unlock", l: "A" }, { k: "unlock", l: "B" }
            ] }
          ],
          mem: {},
          locks: ["A", "B"]
        });
        s.onChange = function (st) {
          api.tools(boutonsRejouer(st));
          var bloques = st.threads.filter(function (_, i) { return st.isBlocked(i); }).length;
          api.readout([{ t: "fils bloqués", v: bloques + " / 2", cls: bloques === 2 ? "bad" : "" }]);
          if (st.deadlocked()) {
            api.fb("<strong>Interblocage.</strong> Thread 1 tient A et attend B ; Thread 2 tient B " +
                   "et attend A. Chacun attend que l'autre lâche en premier, et aucun ne le fera " +
                   "jamais. Le programme ne plante pas : il reste là, pour toujours.", "ok");
            api.solve();
          } else if (st.allDone()) {
            api.fb("Cet ordre-là passe. Recommence, et cette fois avance <strong>un pas de chaque " +
                   "fil</strong> avant de continuer.");
          } else {
            api.fb("Avance Thread 1 d'un pas, puis Thread 2 d'un pas.");
          }
        };
        s.onChange(s);
      }
    },

    /* 9 ------------------------------------------------------------------ */
    {
      chap: "L'interblocage",
      titre: "Le rang des verrous",
      say: "<p class='say'>La parade tient en une règle : donner un <strong>rang</strong> à chaque " +
           "verrou, et toujours les acquérir dans l'ordre croissant. Ici A avant B, pour tout le " +
           "monde.</p>" +
           "<p class='say'>Le code change à peine : on trie les deux verrous avant de les prendre.</p>",
      goal: "Essaie de refaire un interblocage. Puis termine l'exécution.",
      mount: function (api) {
        var ordre = function () {
          return [
            { k: "lock", l: "A" }, { k: "lock", l: "B" },
            { k: "note", txt: "virement" },
            { k: "unlock", l: "B" }, { k: "unlock", l: "A" }
          ];
        };
        var s = sim(api, {
          threads: [
            { name: "Thread 1", code: ordre() },
            { name: "Thread 2", code: ordre() }
          ],
          mem: {},
          locks: ["A", "B"]
        });
        var code = CI.h("pre", { "class": "codeblock" });
        code.innerHTML = "int premier = <span class='cold'>min</span>(i, j);\n" +
                         "int second  = <span class='cold'>max</span>(i, j);\n" +
                         "lock(verrou[premier]);\n" +
                         "lock(verrou[second]);";
        api.host.appendChild(code);

        s.onChange = function (st) {
          api.tools(boutonsRejouer(st));
          var bloques = st.threads.filter(function (_, i) { return st.isBlocked(i); }).length;
          api.readout([{ t: "fils bloqués", v: bloques + " / 2" }]);
          if (st.allDone()) {
            api.fb("Terminé, et tu n'as pas pu bloquer. Le cycle d'attente est impossible : pour " +
                   "qu'il existe, il faudrait qu'un fil tienne B et attende A — or personne ne " +
                   "demande A après B.", "ok");
            api.solve();
          } else if (bloques) {
            api.fb("Un fil attend, mais l'autre peut toujours avancer : ce n'est pas un " +
                   "interblocage, juste de l'attente. Continue.");
          } else {
            api.fb("Essaie l'ordre qui marchait à l'étape précédente.");
          }
        };
        s.onChange(s);
      }
    },

    /* 10 ----------------------------------------------------------------- */
    {
      chap: "Bilan",
      titre: "Ce que tu sais maintenant",
      say: "<p class='say'>Une <strong>data race</strong> : deux accès concurrents à la même case, " +
           "dont au moins une écriture. <code>c++</code> en contient une, parce que ce sont trois " +
           "instructions séparables.</p>" +
           "<p class='say'>Un <strong>mutex</strong> rend une section de code indivisible — mais " +
           "seulement vis-à-vis de ceux qui le prennent aussi.</p>" +
           "<p class='say'>Un <strong>interblocage</strong> est un cycle d'attente. Acquérir les " +
           "verrous dans un ordre total fixé rend ce cycle impossible.</p>",
      goal: null,
      mount: function (api) {
        api.figHidden(true);
        api.readoutNode(CI.h("div", { "class": "done-screen" }, [
          CI.h("div", { "class": "big", text: "✓" }),
          CI.h("p", { "class": "say", text: "Leçon terminée." })
        ]));
        var suite = CI.h("a", { "class": "linkcard", href: "index.html" }, [
          CI.h("div", { "class": "k", text: "même sujet" }),
          CI.h("div", { "class": "t", text: "Retour au sujet" }),
          CI.h("div", { "class": "d", text: "Les leçons suivantes : sémaphores, moniteurs, et la parallélisation d'une boucle." })
        ]);
        api.tools([suite]);
      }
    }
  ];

  /* ------------------------------------------------ demarrage */

  CI.Lesson({
    steps: STEPS,
    key: "lecon-data-race-progres",
    titre: "Data race et exclusion mutuelle",
    sousTitre: "Deux fils, une seule mémoire, et toi à la place de l'ordonnanceur : ce qui casse " +
               "quand personne ne décide de l'ordre, et comment reprendre la main."
  });
})(window.CI);
