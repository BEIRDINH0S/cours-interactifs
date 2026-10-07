/* =========================================================================
   lecon-moniteurs.js — « Attendre son tour ».

   Comment un fil attend qu'une condition devienne vraie sans empecher les
   autres de la rendre vraie. Trois chapitres : proteger un compteur sans
   verrou explicite, attendre correctement, puis decouper une boucle.

   Les etapes sont des donnees ; le lecteur vit dans assets/js/lib/lesson.js.
   ========================================================================= */
(function (CI) {
  "use strict";

  function sim(api, cfg) {
    var box = CI.h("div");
    api.host.appendChild(box);
    var s = new CI.ThreadSim(box, cfg);
    CI.__lastSim = s;   // point d'accroche pour les tests automatises
    return s;
  }

  function rejouer(s, extra) {
    var r = CI.h("button", { text: "Recommencer" });
    r.onclick = function () { s.reset(); s.onChange(s); };
    return extra ? [r].concat(extra) : [r];
  }

  /* Le patron du moniteur, ecrit une fois et reutilise par plusieurs etapes. */
  function acquerir(avecWhile) {
    return [
      { k: "lock", l: "m" },
      avecWhile ? { k: "note", txt: "while (val < 1)" } : { k: "note", txt: "if (val < 1)" },
      { k: "wait", l: "m" },
      { k: "load", r: "v", v: "val" },
      { k: "add", r: "v" },
      { k: "note", txt: "val--" },
      { k: "unlock", l: "m" }
    ];
  }

  var STEPS = [

    /* ========================================== chapitre 1 : le compteur */

    {
      chap: "Le compteur",
      titre: "synchronized, c'est un verrou invisible",
      say: "<p class='say'>En Java, <code>synchronized</code> devant une méthode ne crée pas un " +
           "verrou nouveau : il prend celui que <strong>tout objet porte déjà</strong>. Deux fils " +
           "qui appellent la même méthode sur le même objet se retrouvent en file.</p>" +
           "<p class='say'>C'est exactement le verrou de la leçon précédente, sauf qu'on ne le voit " +
           "pas dans le code.</p>",
      goal: "Termine les deux fils.",
      mount: function (api) {
        var corps = function () {
          return [{ k: "lock", l: "objet" }]
            .concat(CI.incrDetaille("c", "r", 1))
            .concat([{ k: "unlock", l: "objet" }]);
        };
        var s = sim(api, {
          threads: [{ name: "Thread 1", code: corps() }, { name: "Thread 2", code: corps() }],
          mem: { c: 0 }, locks: ["objet"]
        });
        s.onChange = function (st) {
          api.tools(rejouer(st));
          api.readout([{ t: "compteur c", v: st.mem.c, cls: st.allDone() && st.mem.c === 2 ? "good" : "" }]);
          if (st.allDone()) {
            api.fb("<strong>c = 2</strong>. Le verrou <code>objet</code> n'apparaît nulle part dans " +
                   "le code Java : <code>synchronized</code> l'a pris pour toi, et l'a rendu à la " +
                   "sortie de la méthode — même si elle lève une exception.", "ok");
            api.solve();
          } else {
            api.fb("Essaie de glisser un fil au milieu de l'autre.");
          }
        };
        s.onChange(s);
      }
    },

    {
      chap: "Le compteur",
      titre: "L'incrément atomique",
      say: "<p class='say'>Un <code>AtomicInteger</code> ne protège pas un bloc de code : il rend " +
           "<strong>une seule opération</strong> indivisible. <code>incrementAndGet()</code> lit, " +
           "ajoute et écrit sans que rien puisse s'intercaler.</p>" +
           "<p class='say'>Pas de verrou, donc pas de file d'attente — et pas d'interblocage " +
           "possible non plus.</p>",
      goal: "Essaie de perdre un incrément.",
      mount: function (api) {
        var s = sim(api, {
          threads: [
            { name: "Thread 1", code: CI.incrAtomique("c", 2) },
            { name: "Thread 2", code: CI.incrAtomique("c", 2) }
          ],
          mem: { c: 0 }
        });
        s.onChange = function (st) {
          api.tools(rejouer(st));
          api.readout([{ t: "compteur c", v: st.mem.c, cls: st.allDone() && st.mem.c === 4 ? "good" : "" }]);
          if (st.allDone()) {
            api.fb("<strong>c = 4</strong>, quel que soit l'ordre. Il n'y a plus d'instant où " +
                   "l'incrément est à moitié fait : il n'y a plus d'intervalle à exploiter.", "ok");
            api.solve();
          } else {
            api.fb("Alterne autant que tu veux : chaque pas est entier.");
          }
        };
        s.onChange(s);
      }
    },

    {
      chap: "Le compteur",
      titre: "Le compare-and-set, et sa boucle",
      say: "<p class='say'><code>compareAndSet(attendu, nouveau)</code> n'écrit que si la case " +
           "contient <strong>encore</strong> la valeur attendue. Sinon il échoue, et c'est à toi " +
           "de recommencer.</p>" +
           "<p class='say'>D'où la forme systématique : lire, tenter, relire si ça a raté. Fais " +
           "lire les deux fils avant qu'aucun n'écrive, et regarde le second repartir.</p>",
      goal: "Provoque un échec de CAS, puis mène les deux fils au bout.",
      mount: function (api) {
        var corps = function () {
          return [
            { k: "load", r: "v", v: "c" },
            { k: "cas", v: "c", r: "v", echec: 0 }
          ];
        };
        var s = sim(api, {
          threads: [{ name: "Thread 1", code: corps() }, { name: "Thread 2", code: corps() }],
          mem: { c: 0 }
        });
        var echecs = 0, avant = 0;
        s.onChange = function (st) {
          var retours = st.history.length;
          if (retours > avant) avant = retours;
          api.tools(rejouer(st, []));
          api.readout([{ t: "compteur c", v: st.mem.c, cls: st.allDone() && st.mem.c === 2 ? "good" : "" }]);
          // un fil revenu sur l'instruction 0 apres un CAS a rate son coup
          echecs = st.threads.filter(function (t) { return t.pc === 0 && st.history.length > 1; }).length;
          if (st.allDone()) {
            api.fb("<strong>c = 2</strong>. Aucun incrément perdu, et pourtant aucun verrou : le " +
                   "fil qui échoue ne bloque personne, il refait simplement un tour. C'est tout le " +
                   "principe des algorithmes <strong>non bloquants</strong>.", "ok");
            api.solve();
          } else if (echecs) {
            api.fb("Un fil est reparti sur <code>v ← c</code> : son CAS a échoué parce que la case " +
                   "ne valait plus ce qu'il avait lu. Il relit et retente.");
          } else {
            api.fb("Fais lire les deux fils avant qu'aucun n'écrive.");
          }
        };
        s.onChange(s);
      }
    },

    /* ========================================== chapitre 2 : attendre */

    {
      chap: "Attendre",
      titre: "Le sémaphore naïf",
      say: "<p class='say'>Un sémaphore refuse de descendre sous zéro : <code>acquire</code> doit " +
           "<strong>attendre</strong> que la valeur remonte. Écrivons-le naïvement, avec une " +
           "boucle d'attente à l'intérieur d'une méthode <code>synchronized</code>.</p>" +
           "<p class='say'>Thread 1 a déjà pris le jeton (<code>val = 0</code>) et s'apprête à le " +
           "rendre. Thread 2 veut l'acquérir.</p>",
      goal: "Fais entrer Thread 2 dans la boucle, puis essaie de faire avancer Thread 1.",
      mount: function (api) {
        var s = sim(api, {
          threads: [
            { name: "Thread 1", code: [
              { k: "note", txt: "release()" },
              { k: "lock", l: "m" },
              { k: "incr", v: "val" },
              { k: "unlock", l: "m" }
            ] },
            { name: "Thread 2", code: [
              { k: "note", txt: "acquire()" },
              { k: "lock", l: "m" },
              { k: "spin", v: "val", seuil: 1 },
              { k: "note", txt: "val--" },
              { k: "unlock", l: "m" }
            ] }
          ],
          mem: { val: 0 }, locks: ["m"]
        });
        s.onChange = function (st) {
          api.tools(rejouer(st));
          api.readout([
            { t: "val", v: st.mem.val },
            { t: "tours à vide", v: st.threads[1].tours, cls: st.threads[1].tours ? "bad" : "" }
          ]);
          if (st.bloqueDeFait()) {
            api.fb("<strong>Plus rien ne bouge.</strong> Thread 2 tourne dans sa boucle en attendant " +
                   "que <code>val</code> remonte — mais il <strong>garde le verrou de l'objet</strong>, " +
                   "et c'est précisément ce verrou qu'il faut à Thread 1 pour faire remonter " +
                   "<code>val</code>. Il attend une chose qu'il empêche lui-même d'arriver.", "ok");
            api.solve();
          } else if (st.threads[1].tours) {
            api.fb("Thread 2 brûle du processeur sans avancer. Essaie maintenant de faire avancer " +
                   "Thread 1.");
          } else {
            api.fb("Fais avancer Thread 2 jusqu'à sa boucle d'attente.");
          }
        };
        s.onChange(s);
      }
    },

    {
      chap: "Attendre",
      titre: "wait() lâche le verrou",
      say: "<p class='say'>C'est tout ce qui change, et ça change tout : <code>wait()</code> " +
           "<strong>rend le verrou</strong> et endort le fil. Un autre peut alors entrer, modifier " +
           "la condition, et le réveiller avec <code>notifyAll()</code>.</p>" +
           "<p class='say'>Le dormeur ne repart pas immédiatement : il doit d'abord " +
           "<strong>reprendre le verrou</strong>, et il reprend là où il s'était endormi.</p>",
      goal: "Mène les deux fils au bout.",
      mount: function (api) {
        var s = sim(api, {
          threads: [
            { name: "Thread 1", code: [
              { k: "note", txt: "release()" },
              { k: "lock", l: "m" },
              { k: "incr", v: "val" },
              { k: "notify", l: "m", tous: true },
              { k: "unlock", l: "m" }
            ] },
            { name: "Thread 2", code: [
              { k: "note", txt: "acquire()" },
              { k: "lock", l: "m" },
              { k: "wait", l: "m" },
              { k: "note", txt: "val--" },
              { k: "unlock", l: "m" }
            ] }
          ],
          mem: { val: 0 }, locks: ["m"]
        });
        s.onChange = function (st) {
          api.tools(rejouer(st));
          api.readout([{ t: "val", v: st.mem.val }]);
          if (st.allDone()) {
            api.fb("Les deux fils sont passés. Thread 2 s'est endormi <strong>en rendant le " +
                   "verrou</strong>, ce qui a laissé Thread 1 entrer et rendre le jeton. " +
                   "Remarque le pas supplémentaire du réveil : reprendre le verrou est une étape " +
                   "à part entière, pendant laquelle un autre fil peut encore passer devant.", "ok");
            api.solve();
          } else if (st.threads[1].dort) {
            api.fb("Thread 2 dort et ne détient plus le verrou. Thread 1 peut entrer.");
          } else {
            api.fb("Endors Thread 2, puis fais avancer Thread 1.");
          }
        };
        s.onChange(s);
      }
    },

    {
      chap: "Attendre",
      titre: "Pourquoi while, et jamais if",
      say: "<p class='say'>Deux fils attendent le même jeton. Un seul le rendra. Avec " +
           "<code>notifyAll()</code>, les <strong>deux</strong> se réveillent.</p>" +
           "<p class='say'>Celui qui reprend le verrou en second trouvera la condition redevenue " +
           "fausse — le premier a déjà consommé le jeton. S'il avait écrit <code>if</code>, il ne " +
           "la retesterait pas.</p>",
      goal: "Réveille les deux dormeurs et fais passer les deux, l'un après l'autre.",
      mount: function (api) {
        var dormeur = function (n) {
          return { name: "Attente " + n, code: [
            { k: "lock", l: "m" },
            { k: "note", txt: "while (val < 1)" },
            { k: "wait", l: "m" },
            { k: "note", txt: "val--" },
            { k: "unlock", l: "m" }
          ] };
        };
        var s = sim(api, {
          threads: [
            dormeur(1), dormeur(2),
            { name: "Donneur", code: [
              { k: "lock", l: "m" },
              { k: "incr", v: "val" },
              { k: "notify", l: "m", tous: true },
              { k: "unlock", l: "m" }
            ] }
          ],
          mem: { val: 0 }, locks: ["m"]
        });
        s.onChange = function (st) {
          api.tools(rejouer(st));
          var reveilles = st.threads.filter(function (t) { return t.reprend; }).length;
          api.readout([
            { t: "val", v: st.mem.val },
            { t: "réveillés", v: reveilles }
          ]);
          if (st.allDone()) {
            api.fb("Les deux dormeurs ont été réveillés par un seul <code>notifyAll()</code>, mais " +
                   "il n'y avait qu'un jeton. Le second a repris le verrou pour trouver " +
                   "<code>val</code> déjà redescendu : <strong>c'est le <code>while</code> qui le " +
                   "renvoie dormir</strong>. Avec <code>if</code>, il aurait décrémenté quand même " +
                   "et fait passer le sémaphore à −1.", "ok");
            api.solve();
          } else if (reveilles) {
            api.fb(reveilles + " fil(s) réveillé(s), un seul jeton disponible. Fais-les reprendre " +
                   "le verrou l'un après l'autre.");
          } else {
            api.fb("Endors les deux attentes, puis fais passer le donneur.");
          }
        };
        s.onChange(s);
      }
    },

    {
      chap: "Attendre",
      titre: "Pourquoi notifyAll, et pas notify",
      say: "<p class='say'>Même scène, mais le donneur n'appelle que <code>notify()</code> : un " +
           "seul dormeur est réveillé, choisi arbitrairement.</p>" +
           "<p class='say'>Si ce dormeur-là ne peut finalement pas avancer, le signal est " +
           "<strong>consommé pour rien</strong> — et les autres ne sauront jamais que le jeton " +
           "était passé.</p>",
      goal: "Fais tourner jusqu'au bout et observe qui reste endormi.",
      mount: function (api) {
        var dormeur = function (n) {
          return { name: "Attente " + n, code: [
            { k: "lock", l: "m" },
            { k: "wait", l: "m" },
            { k: "note", txt: "val--" },
            { k: "unlock", l: "m" }
          ] };
        };
        var s = sim(api, {
          threads: [
            dormeur(1), dormeur(2),
            { name: "Donneur", code: [
              { k: "lock", l: "m" },
              { k: "incr", v: "val" },
              { k: "notify", l: "m", tous: false },
              { k: "unlock", l: "m" }
            ] }
          ],
          mem: { val: 0 }, locks: ["m"]
        });
        s.onChange = function (st) {
          api.tools(rejouer(st));
          var dorment = st.threads.filter(function (t) { return t.dort; }).length;
          api.readout([
            { t: "val", v: st.mem.val },
            { t: "encore endormis", v: dorment, cls: dorment ? "bad" : "" }
          ]);
          if (st.deadlocked() || (st.threads[2].pc >= 4 && dorment)) {
            api.fb("<strong>Un fil dort encore, et plus personne ne le réveillera.</strong> " +
                   "Le donneur a fini : son unique signal est parti vers un seul dormeur. " +
                   "<code>notifyAll()</code> ne coûte qu'un réveil inutile ; <code>notify()</code> " +
                   "peut coûter un fil qui ne se réveille jamais.", "ok");
            api.solve();
          } else {
            api.fb("Endors les deux attentes, puis fais passer le donneur jusqu'au bout.");
          }
        };
        s.onChange(s);
      }
    },

    {
      chap: "Attendre",
      titre: "Ce qui n'a pas besoin d'être synchronized",
      say: "<p class='say'>Dans le sémaphore, <code>getInit()</code> rend une valeur fixée une " +
           "fois pour toutes dans le constructeur.</p>",
      goal: "Pourquoi cette méthode n'a-t-elle pas besoin d'être synchronized ?",
      mount: function (api) {
        var code = CI.h("pre", { "class": "codeblock" });
        code.textContent = "private final int init;\n\n" +
                           "SemaphoreMonitor(int initValue) {\n" +
                           "    init = val = initValue;\n" +
                           "}\n\n" +
                           "int getInit() { return init; }";
        api.host.appendChild(code);

        var choix = [
          { t: "Parce que le champ est final : écrit une fois, jamais modifié ensuite",
            ok: true,
            why: "Oui. Une data race demande au moins une écriture concurrente. Ici l'unique " +
                 "écriture a lieu dans le constructeur, avant que l'objet soit visible des autres " +
                 "fils ; ensuite, il n'y a plus que des lectures." },
          { t: "Parce qu'une lecture est toujours atomique en Java", ok: false,
            why: "Non. C'est vrai pour un int, mais ça ne suffirait pas : lire une valeur que " +
                 "quelqu'un modifie reste une course. C'est l'absence d'écriture qui sauve, pas " +
                 "l'atomicité." },
          { t: "Parce que la méthode ne touche pas à val", ok: false,
            why: "Pas suffisant. Une méthode qui ne lirait qu'un champ modifiable serait quand " +
                 "même en course avec ceux qui l'écrivent." }
        ];
        var btns = choix.map(function (c) {
          var b = CI.h("button", { "class": "card-opt", text: c.t });
          b.onclick = function () {
            b.className = "card-opt " + (c.ok ? "right" : "wrong");
            api.fb(c.why, c.ok ? "ok" : "ko");
            if (c.ok) api.solve();
          };
          return b;
        });
        api.host.appendChild(CI.h("div", { "class": "card-opts", style: { marginTop: "14px" } }, btns));
      }
    },

    /* ========================================== chapitre 3 : decouper */

    {
      chap: "Découper",
      titre: "Deux fils, deux moitiés",
      say: "<p class='say'>Compter les occurrences d'une valeur dans un tableau se découpe sans " +
           "effort : chaque fil prend une moitié, compte de son côté, et on additionne à la fin.</p>" +
           "<p class='say'>Aucun verrou n'est nécessaire — les deux moitiés sont disjointes, et " +
           "chaque fil écrit dans <strong>sa</strong> case de résultat.</p>",
      goal: "Fais compter les deux fils, puis additionne.",
      mount: function (api) {
        var moitie = function (n, occurrences) {
          var code = [{ k: "note", txt: "parcourt sa moitié" }];
          for (var i = 0; i < occurrences; i++) code.push({ k: "incr", v: "partiel" + n });
          code.push({ k: "note", txt: "rend son total" });
          return { name: "Thread " + n, code: code };
        };
        var s = sim(api, {
          threads: [moitie(1, 3), moitie(2, 2)],
          mem: { partiel1: 0, partiel2: 0, total: 0 }
        });
        var additionner = CI.h("button", { "class": "primary", text: "Additionner les deux moitiés" });
        s.onChange = function (st) {
          additionner.disabled = !st.allDone() || st.mem.total > 0;
          api.tools(rejouer(st, [additionner]));
          api.readout([
            { t: "moitié 1", v: st.mem.partiel1 },
            { t: "moitié 2", v: st.mem.partiel2 },
            { t: "total", v: st.mem.total, cls: st.mem.total === 5 ? "good" : "" }
          ]);
          if (st.mem.total === 5) {
            api.fb("<strong>5 occurrences.</strong> Les deux fils n'ont jamais touché la même case : " +
                   "aucune synchronisation n'était nécessaire pendant le parcours. L'addition, elle, " +
                   "a lieu <strong>après les joins</strong> — c'est le join qui garantit que les " +
                   "deux totaux sont écrits.", "ok");
            api.solve();
          } else if (st.allDone()) {
            api.fb("Les deux moitiés sont comptées. Additionne.");
          } else {
            api.fb("Fais avancer les deux fils dans l'ordre que tu veux : le résultat ne dépend pas de l'ordre.");
          }
        };
        additionner.onclick = function () {
          s.mem.total = s.mem.partiel1 + s.mem.partiel2;
          s.render();
          s.onChange(s);
        };
        s.onChange(s);
      }
    },

    {
      chap: "Découper",
      titre: "Pourquoi l'accélération plafonne",
      say: "<p class='say'>Avec N fils, chacun traite 1/N du tableau — mais créer un fil coûte, et " +
           "ce coût, lui, croît avec N.</p>" +
           "<p class='say'>Fais varier N. Le modèle ci-contre n'est pas une mesure : c'est la " +
           "<strong>forme</strong> du phénomène, celle que ton TP va te faire constater pour de vrai.</p>",
      goal: "Trouve le N qui minimise le temps, puis dépasse-le.",
      mount: function (api) {
        var n = 1, coeurs = 8, travail = 1000, creation = 12, meilleur = null;
        var slider = CI.h("input", { type: "range", min: "1", max: "64", value: "1", id: "n-fils" });
        var lab = CI.h("span", { "class": "mono", text: "N = 1" });
        api.tools([lab, slider]);

        function temps(k) {
          // le travail se divise par le nombre de fils, mais pas au-dela des coeurs
          return travail / Math.min(k, coeurs) + k * creation;
        }
        for (var k = 1; k <= 64; k++) {
          if (meilleur === null || temps(k) < temps(meilleur)) meilleur = k;
        }

        var bar = CI.h("div", { "class": "tally" });
        api.readoutNode(bar);

        function draw() {
          lab.textContent = "N = " + n;
          CI.clear(bar);
          var ref = temps(1), t = temps(n);
          [[1, ref], [n, t]].forEach(function (p, i) {
            bar.appendChild(CI.h("div", { "class": "line" }, [
              CI.h("span", { "class": "lab", text: i ? "N = " + p[0] : "un seul fil" }),
              CI.h("span", { "class": "track" }, [
                CI.h("span", { "class": "fill" + (i && p[1] < ref ? " good" : ""),
                               style: { width: Math.min(100, 100 * p[1] / ref) + "%" } })
              ]),
              CI.h("span", { "class": "cnt", text: Math.round(p[1]) })
            ]));
          });
          bar.appendChild(CI.h("div", { "class": "line" }, [
            CI.h("span", { "class": "lab", text: "accélération" }),
            CI.h("span", { "class": "cnt", text: (ref / t).toFixed(2) + "x" })
          ]));

          if (n > meilleur) {
            api.fb("Au-delà de <strong>N = " + meilleur + "</strong>, le coût de création dépasse " +
                   "ce que le découpage fait gagner, et l'accélération redescend. Deux plafonds se " +
                   "cumulent : le nombre de cœurs, et le prix des fils eux-mêmes. C'est pourquoi " +
                   "on les <strong>recycle</strong> au lieu d'en créer à chaque fois — c'est le " +
                   "rôle d'un <code>ExecutorService</code>.", "ok");
            api.solve();
          } else if (n === meilleur) {
            api.fb("C'est le meilleur compromis sur ce modèle. Continue de monter pour voir ce qui se passe.");
          } else {
            api.fb("Monte encore : chaque fil supplémentaire divise le travail.");
          }
        }
        slider.addEventListener("input", function (e) { n = +e.target.value; draw(); });
        draw();
      }
    },

    {
      chap: "Bilan",
      titre: "Ce que tu sais maintenant",
      say: "<p class='say'>Quatre façons de protéger un compteur : le verrou explicite, " +
           "<code>synchronized</code> qui prend le verrou de l'objet, l'entier atomique qui rend " +
           "une opération indivisible, et le <strong>compare-and-set</strong> avec sa boucle de " +
           "reprise — le seul qui ne bloque personne.</p>" +
           "<p class='say'>Attendre dans une boucle sans lâcher le verrou interdit à quiconque de " +
           "rendre la condition vraie. <code>wait()</code> lâche le verrou, et c'est ce qui le rend " +
           "utilisable.</p>" +
           "<p class='say'>On teste la condition dans un <code>while</code>, jamais un " +
           "<code>if</code> : un fil réveillé doit la revérifier. Et on réveille avec " +
           "<code>notifyAll()</code> : un signal donné à un seul fil peut se perdre.</p>" +
           "<p class='say'>Découper une boucle ne gagne que jusqu'à un point : au-delà, créer les " +
           "fils coûte plus que le partage ne rapporte.</p>",
      goal: null,
      mount: function (api) {
        api.readoutNode(CI.h("div", { "class": "done-screen" }, [
          CI.h("div", { "class": "big", text: "✓" }),
          CI.h("p", { "class": "say", text: "Leçon terminée." })
        ]));
        api.tools([
          CI.h("a", { "class": "linkcard", href: "revision.html" }, [
            CI.h("div", { "class": "k", text: "pour fixer" }),
            CI.h("div", { "class": "t", text: "Réviser le sujet" }),
            CI.h("div", { "class": "d", text: "Les cartes couvrent le patron du moniteur et la boucle de reprise du CAS." })
          ])
        ]);
      }
    }
  ];

  CI.Lesson({
    steps: STEPS,
    key: "lecon-moniteurs-progres",
    titre: "Attendre son tour",
    sousTitre: "Comment un fil attend qu'une condition devienne vraie sans empêcher les autres de " +
               "la rendre vraie."
  });
})(window.CI);
