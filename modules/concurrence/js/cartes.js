/* =========================================================================
   cartes.js — le paquet de revision du sujet « memoire partagee ».

   L'epreuve de ce sujet est un TP note en Java : on complete des squelettes
   fournis. D'ou le poids donne aux cartes « code a completer » et « quelle
   version est correcte » plutot qu'aux seules definitions.
   ========================================================================= */
window.CI_CARTES = [

  /* ---------------------------------------------------------- definitions */
  {
    type: "recto", tag: "définition",
    q: "Data race",
    a: "Deux fils accèdent à la même case mémoire en concurrence, et <strong>au moins un des deux " +
       "écrit</strong>. Deux lectures simultanées n'en sont pas une."
  },
  {
    type: "recto", tag: "définition",
    q: "Section critique",
    a: "Portion de code entre <code>lock</code> et <code>unlock</code>, exécutée par un seul fil à la fois."
  },
  {
    type: "recto", tag: "définition",
    q: "Interblocage (deadlock)",
    a: "Attente circulaire : chaque fil attend un verrou détenu par un autre. Se détecte comme un " +
       "<strong>cycle</strong> dans le graphe fil → verrou attendu."
  },
  {
    type: "recto", tag: "définition",
    q: "Exclusion k-mutuelle",
    a: "Au plus <strong>k</strong> fils simultanément dans la section critique. L'exclusion mutuelle " +
       "ordinaire en est le cas k = 1."
  },
  {
    type: "recto", tag: "définition",
    q: "CAS — compare-and-set",
    a: "Instruction atomique qui écrit une nouvelle valeur <strong>seulement si</strong> la case " +
       "contient encore la valeur attendue. C'est la base des algorithmes non bloquants."
  },
  {
    type: "recto", tag: "définition",
    q: "Verrouillage fin (fine-grained locking)",
    a: "Un verrou par élément plutôt qu'un verrou global : deux fils qui touchent des cases " +
       "différentes ne s'attendent plus."
  },
  {
    type: "recto", tag: "mémoire",
    q: "Qu'est-ce qui est partagé entre fils, qu'est-ce qui ne l'est pas ?",
    a: "Le <strong>tas</strong> est partagé. La <strong>pile</strong> de chaque fil, donc ses " +
       "variables locales, lui est privée. D'où le piège : rendre un pointeur vers une variable " +
       "locale au fil est invalide après le <code>join</code>."
  },

  /* ---------------------------------------------------------- QCM */
  {
    type: "qcm", tag: "le piège classique",
    q: "Deux fils incrémentent <code>c</code> N fois chacun, sans aucune synchronisation, avec N ≥ 2. " +
       "Quelle est la plus petite valeur que <code>c</code> puisse atteindre à la fin ?",
    opts: [
      { t: "0", ok: false, why: "Non : une écriture écrit toujours « la valeur lue, plus un ». Jamais 0." },
      { t: "1", ok: false, why: "Non. Pour finir à 1, la dernière écriture devrait avoir lu 0, donc " +
        "avoir lu avant toute écriture. Or c'est la dernière instruction de son fil, et ce fil avait " +
        "déjà écrit auparavant puisque N ≥ 2." },
      { t: "2", ok: true, why: "Oui. On descend jusqu'à 2 et pas plus bas : la dernière écriture de " +
        "chaque fil ne peut pas avoir lu 0, ce fil ayant déjà écrit avant." },
      { t: "N", ok: false, why: "Non, on fait bien pire : les incréments d'un fil entier peuvent être écrasés." }
    ]
  },
  {
    type: "qcm", tag: "propriétés d'un verrou",
    q: "Un verrou garantit l'exclusion mutuelle et l'absence d'interblocage, mais un fil peut se " +
       "faire doubler indéfiniment par les autres. Quelle propriété manque ?",
    opts: [
      { t: "L'absence de famine (starvation)", ok: true, why: "Oui. Les trois propriétés attendues : " +
        "exclusion mutuelle, absence d'interblocage, absence de famine — chaque fil finit par entrer." },
      { t: "L'atomicité", ok: false, why: "Non : l'atomicité est ce que l'exclusion mutuelle procure déjà." },
      { t: "L'exclusion k-mutuelle", ok: false, why: "Non, c'est une généralisation du problème, pas une propriété manquante." },
      { t: "La cohérence séquentielle", ok: false, why: "Non : c'est un modèle mémoire, pas une propriété du verrou." }
    ]
  },
  {
    type: "qcm", tag: "verrous",
    q: "Un seul des deux fils qui touchent <code>c</code> prend le verrou avant d'y accéder. " +
       "Que se passe-t-il ?",
    opts: [
      { t: "La course est toujours là", ok: true, why: "Oui. Rien ne relie mécaniquement un verrou à " +
        "une donnée : « A protège c » n'existe que dans la tête du programmeur. Un seul resquilleur suffit." },
      { t: "Le second fil est bloqué quand même", ok: false, why: "Non : un fil qui n'appelle jamais " +
        "<code>lock</code> n'est jamais arrêté par ce verrou." },
      { t: "Le programme refuse de compiler", ok: false, why: "Non, rien dans le langage ne lie un verrou à une variable." }
    ]
  },
  {
    type: "qcm", tag: "parallélisme",
    q: "Pourquoi l'accélération d'un programme parallèle est-elle rarement proportionnelle au " +
       "nombre de cœurs ?",
    opts: [
      { t: "La création et la synchronisation des fils ont un coût", ok: true, why: "Oui. Au-delà " +
        "d'un certain découpage, ce surcoût dépasse le gain, et la partie non parallélisable borne " +
        "le reste." },
      { t: "Les processeurs ralentissent quand plusieurs cœurs travaillent", ok: false, why: "Non, ce n'est pas la raison principale." },
      { t: "Parce que les fils s'exécutent en réalité l'un après l'autre", ok: false, why: "Non : sur une machine multicœur ils s'exécutent bien en parallèle." }
    ]
  },

  /* ---------------------------------------------------------- code a trous */
  {
    type: "trous", tag: "décomposition",
    q: "Complète la décomposition de <code>c++</code> en instructions machine.",
    code: [
      "{0}   r ← c        // lire la case partagée",
      "{1}   r ← r + 1",
      "{2}   c ← r        // écrire le résultat"
    ],
    trous: [
      { sol: "LOAD", opts: ["LOAD", "STORE", "ADD"] },
      { sol: "ADD", opts: ["LOAD", "STORE", "ADD"] },
      { sol: "STORE", opts: ["LOAD", "STORE", "ADD"] }
    ],
    why: "Trois instructions séparables : c'est entre la lecture et l'écriture que l'autre fil se glisse."
  },
  {
    type: "trous", tag: "prévention des interblocages",
    q: "Complète la stratégie de rang, qui rend tout cycle d'attente impossible.",
    code: [
      "int premier = {0}(i, j);",
      "int second  = {1}(i, j);",
      "",
      "lock(verrou[premier]);",
      "lock(verrou[second]);",
      "// ... section critique ...",
      "unlock(verrou[second]);",
      "unlock(verrou[premier]);"
    ],
    trous: [
      { sol: "min", opts: ["min", "max"] },
      { sol: "max", opts: ["min", "max"] }
    ],
    why: "On acquiert toujours dans l'ordre <strong>croissant</strong> de rang. Pour qu'un cycle " +
         "existe, il faudrait qu'un fil tienne le grand et attende le petit : personne ne le fait."
  },
  {
    type: "trous", tag: "moniteur Java",
    q: "Complète le patron d'attente d'un moniteur Java.",
    code: [
      "public synchronized void entrer() throws InterruptedException {",
      "    {0} (occupe) {",
      "        {1}();",
      "    }",
      "    occupe = true;",
      "}",
      "",
      "public synchronized void sortir() {",
      "    occupe = false;",
      "    {2}();",
      "}"
    ],
    trous: [
      { sol: "while", opts: ["while", "if"] },
      { sol: "wait", opts: ["wait", "sleep", "notify"] },
      { sol: "notifyAll", opts: ["notifyAll", "wait", "join"] }
    ],
    why: "<code>while</code> et non <code>if</code> : un fil réveillé doit <strong>re-vérifier</strong> " +
         "la condition, qui peut être redevenue fausse entre le réveil et la reprise."
  },

  /* ---------------------------------------------------------- choix de code */
  {
    type: "code", tag: "moniteur Java",
    q: "Laquelle de ces deux attentes est correcte dans un moniteur ?",
    opts: [
      { ok: true,
        code: "synchronized void prendre() {\n    while (libre == 0)\n        wait();\n    libre--;\n}",
        why: "Correct. Après un <code>notify</code>, la condition peut être redevenue fausse — un " +
             "autre fil a pu passer avant. Il faut la tester à nouveau, donc une boucle." },
      { ok: false,
        code: "synchronized void prendre() {\n    if (libre == 0)\n        wait();\n    libre--;\n}",
        why: "Faux. <code>if</code> ne teste qu'une fois : le fil réveillé reprend sur un état " +
             "peut-être périmé et décrémente un compteur déjà nul. C'est l'erreur classique." }
    ]
  },
  {
    type: "code", tag: "sans verrou",
    q: "Quelle version incrémente correctement un compteur partagé <strong>sans</strong> verrou ?",
    opts: [
      { ok: true,
        code: "AtomicInteger c = new AtomicInteger();\n\nint v;\ndo {\n    v = c.get();\n} while (!c.compareAndSet(v, v + 1));",
        why: "Correct. On relit, on tente, et on recommence si quelqu'un est passé entre-temps : " +
             "c'est la boucle de retry autour du CAS." },
      { ok: false,
        code: "AtomicInteger c = new AtomicInteger();\n\nint v = c.get();\nc.set(v + 1);",
        why: "Faux. <code>get</code> puis <code>set</code>, ce sont deux opérations : exactement la " +
             "même course qu'avec <code>c++</code>. Le type atomique ne sauve rien ici." }
    ]
  },
  {
    type: "code", tag: "interblocage",
    q: "Deux fils exécutent ces virements en parallèle, avec i ≠ j. Lequel peut s'interbloquer ?",
    opts: [
      { ok: true,
        code: "// Fil A : virer(1, 2)\nlock(v[1]);\nlock(v[2]);\n\n// Fil B : virer(2, 1)\nlock(v[2]);\nlock(v[1]);",
        why: "Oui. A tient v[1] et attend v[2] ; B tient v[2] et attend v[1]. Le cycle est là, et " +
             "personne ne lâchera jamais." },
      { ok: false,
        code: "// les deux fils\nint p = min(i, j);\nint s = max(i, j);\nlock(v[p]);\nlock(v[s]);",
        why: "Non : avec un ordre total sur les verrous, aucun cycle ne peut se former." }
    ]
  },

  /* ---------------------------------------------------------- pthreads */
  {
    type: "qcm", tag: "pthreads",
    q: "Un fil alloue son résultat sur sa pile et en rend l'adresse. Le fil principal la lit après " +
       "<code>pthread_join</code>. Que vaut cette lecture ?",
    opts: [
      { t: "Elle n'est pas valide : la pile du fil a disparu", ok: true, why: "Oui. Pour rendre un " +
        "résultat, il faut l'allouer sur le tas, partagé, et le libérer après usage." },
      { t: "Elle est valide, le join recopie le résultat", ok: false, why: "Non : le join ne transmet " +
        "qu'un pointeur, pas ce qu'il désigne." },
      { t: "Elle est valide tant qu'on lit tout de suite", ok: false, why: "Non — c'est précisément " +
        "le genre de bug qui marche en test et casse en production." }
    ]
  }
];
