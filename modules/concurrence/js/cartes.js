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
  },

  /* ---------------------------------------------------------- Java : les pieges du TP */
  {
    type: "code", tag: "lambdas",
    q: "Dans une boucle qui lance N tâches, laquelle compile et donne le bon découpage ?",
    opts: [
      { ok: true,
        code: "for (int i = 0; i < N; i++) {\n    final int k = i;\n    pool.submit(() ->\n        compter(tab, k*pas, (k+1)*pas));\n}",
        why: "Correct. Une lambda ne capture qu'une variable <strong>effectivement finale</strong> : " +
             "on recopie l'indice dans une variable locale au tour de boucle." },
      { ok: false,
        code: "for (int i = 0; i < N; i++) {\n    pool.submit(() ->\n        compter(tab, i*pas, (i+1)*pas));\n}",
        why: "Refusé à la compilation : <code>i</code> change à chaque tour, donc n'est pas " +
             "effectivement finale. C'est le même piège qu'en C, où passer <code>&amp;i</code> à " +
             "pthread_create fait lire aux threads un indice déjà incrémenté — sauf qu'ici le " +
             "compilateur t'arrête." }
    ]
  },
  {
    type: "qcm", tag: "atomiques",
    q: "Pourquoi un <code>AtomicReference&lt;Integer&gt;</code> est-il nettement plus lent qu'un " +
       "<code>AtomicInteger</code> pour compter ?",
    opts: [
      { t: "Parce que chaque nouvelle valeur alloue un objet Integer", ok: true,
        why: "Oui. La référence pointe vers un objet : à chaque incrément réussi il faut en créer " +
             "un nouveau, que le ramasse-miettes devra ensuite collecter. L'AtomicInteger, lui, " +
             "manipule un entier en place." },
      { t: "Parce qu'il pose un verrou interne", ok: false,
        why: "Non : les deux reposent sur la même instruction matérielle de compare-and-set, sans verrou." },
      { t: "Parce que compareAndSet y échoue plus souvent", ok: false,
        why: "Non, le taux d'échec dépend de la contention, pas du type." }
    ]
  },
  {
    type: "code", tag: "sémaphore",
    q: "Laquelle de ces deux écritures d'<code>acquire</code> ne laisse jamais le compteur passer " +
       "sous zéro, même un instant ?",
    opts: [
      { ok: true,
        code: "int v = val.get();\nwhile (v < 1 ||\n       !val.compareAndSet(v, v - 1)) {\n    v = val.get();\n}",
        why: "Correct. Le test <code>v &lt; 1</code> garde le CAS : on ne décrémente que si on en a " +
             "le droit. La valeur publiée reste toujours positive ou nulle." },
      { ok: false,
        code: "while (true) {\n    if (val.decrementAndGet() >= 0) break;\n    val.incrementAndGet();\n}",
        why: "Elle finit juste, mais elle décrémente d'abord et répare ensuite : entre les deux, " +
             "<code>val</code> vaut −1 et un autre fil peut l'observer ainsi. Correcte au final, " +
             "fausse en chemin." }
    ]
  },
  {
    type: "qcm", tag: "parallélisation",
    q: "Pourquoi un <code>ExecutorService</code> donne-t-il une meilleure accélération que de créer " +
       "N threads à chaque appel ?",
    opts: [
      { t: "Parce que le pool réutilise ses threads au lieu d'en créer de nouveaux", ok: true,
        why: "Oui. Le coût de création est payé une fois, à la construction du pool, et non à " +
             "chaque découpage. C'est ce qui fait reculer le plafond d'accélération." },
      { t: "Parce qu'il répartit mieux le travail entre les cœurs", ok: false,
        why: "Non : avec des tranches de taille égale, la répartition est la même." },
      { t: "Parce que les Future évitent les joins", ok: false,
        why: "Non : <code>Future.get()</code> bloque exactement comme un join. Ce qu'il apporte, " +
             "c'est de rendre une valeur plutôt que d'écrire dans un tableau partagé." }
    ]
  },
  {
    type: "trous", tag: "parallélisation",
    q: "Complète le découpage en N tranches, en veillant à ne pas déborder du tableau.",
    code: [
      "int pas = (int) Math.ceil((double) n / N);",
      "",
      "for (int i = 0; i < N; i++) {",
      "    final int k = {0};",
      "    futures.add(pool.submit(() ->",
      "        compter(tab, k * pas,",
      "                Math.{1}(n, (k + 1) * pas))));",
      "}"
    ],
    trous: [
      { sol: "i", opts: ["i", "N", "pas"] },
      { sol: "min", opts: ["min", "max"] }
    ],
    why: "La dernière tranche déborderait sans le <code>min</code> : avec un arrondi au-dessus, " +
         "<code>N * pas</code> dépasse <code>n</code>."
  },

  /* ---------------------------------------------------------- a completer : Java */
  {
    type: "trous", tag: "verrou explicite",
    q: "Complète le compteur à verrou explicite. Un oubli ici bloque tout le programme.",
    code: [
      "private final Lock verrou = new ReentrantLock();",
      "private int val = 0;",
      "",
      "void incr(int n) {",
      "    verrou.{0}();",
      "    {1} { val = val + n; }",
      "    {2} { verrou.{3}(); }",
      "}"
    ],
    trous: [
      { sol: "lock", opts: ["lock", "unlock", "wait"] },
      { sol: "try", opts: ["try", "finally", "catch"] },
      { sol: "finally", opts: ["finally", "catch", "else"] },
      { sol: "unlock", opts: ["unlock", "lock", "release"] }
    ],
    why: "Le <code>finally</code> n'est pas facultatif : sans lui, une exception dans la section " +
         "critique laisse le verrou pris pour toujours. C'est ce que <code>synchronized</code> " +
         "fait gratuitement."
  },
  {
    type: "trous", tag: "non bloquant",
    q: "Complète la boucle de reprise. Attention à l'endroit où la valeur est relue.",
    code: [
      "int v;",
      "{0} {",
      "    v = c.get();",
      "} {1} (!c.compareAndSet(v, v {2} n));"
    ],
    trous: [
      { sol: "do", opts: ["do", "while", "for"] },
      { sol: "while", opts: ["while", "until", "if"] },
      { sol: "+", opts: ["+", "-", "*"] }
    ],
    why: "La relecture doit être <strong>dans</strong> la boucle. Si tu lis une seule fois avant " +
         "d'entrer, un échec te condamne à échouer indéfiniment : la case ne reviendra jamais à " +
         "la valeur que tu avais lue."
  },
  {
    type: "trous", tag: "sémaphore",
    q: "Complète l'acquire qui ne laisse jamais le compteur passer sous zéro.",
    code: [
      "public void acquire() {",
      "    int v = val.get();",
      "    while (v {0} 1 || !val.compareAndSet(v, v {1} 1)) {",
      "        v = val.{2}();",
      "    }",
      "}"
    ],
    trous: [
      { sol: "<", opts: ["<", ">", ">="] },
      { sol: "-", opts: ["-", "+"] },
      { sol: "get", opts: ["get", "set", "decrementAndGet"] }
    ],
    why: "La garde <code>v &lt; 1</code> précède le CAS : on ne décrémente que si on en a le droit. " +
         "C'est ce qui distingue cette version de celle qui décrémente puis répare."
  },
  {
    type: "trous", tag: "exclusion k-mutuelle",
    q: "Complète le moniteur d'un parking à k places — la forme même de ton épreuve.",
    code: [
      "private int libres;",
      "",
      "public synchronized void entrer() throws InterruptedException {",
      "    {0} (libres {1} 0) {",
      "        {2}();",
      "    }",
      "    libres--;",
      "}",
      "",
      "public synchronized void sortir() {",
      "    libres++;",
      "    {3}();",
      "}"
    ],
    trous: [
      { sol: "while", opts: ["while", "if"] },
      { sol: "==", opts: ["==", "!=", ">"] },
      { sol: "wait", opts: ["wait", "sleep", "notify"] },
      { sol: "notifyAll", opts: ["notifyAll", "notify", "wait"] }
    ],
    why: "Exactement le patron du moniteur, avec k places au lieu d'une. <code>while</code> parce " +
         "qu'un réveillé doit revérifier, <code>notifyAll</code> parce qu'un signal unique peut se perdre."
  },
  {
    type: "trous", tag: "parallélisation",
    q: "Complète le découpage en deux moitiés. L'ordre des quatre dernières lignes compte.",
    code: [
      "int[] res = new int[2];",
      "int n = tab.length;",
      "",
      "Thread t0 = new Thread(() -> res[0] = compter(tab, 0, n{0}2, c));",
      "Thread t1 = new Thread(() -> res[1] = compter(tab, n{0}2, n, c));",
      "",
      "t0.{1}(); t1.{1}();",
      "t0.{2}(); t1.{2}();",
      "return res[0] + res[1];"
    ],
    trous: [
      { sol: "/", opts: ["/", "*", "%"] },
      { sol: "start", opts: ["start", "run", "join"] },
      { sol: "join", opts: ["join", "start", "wait"] }
    ],
    why: "<code>start()</code> lance un vrai fil ; <code>run()</code> exécuterait simplement la " +
         "méthode dans le fil courant, sans aucun parallélisme. Et les deux <code>join()</code> " +
         "doivent précéder la lecture de <code>res</code>, sinon on additionne des cases pas encore écrites."
  },
  {
    type: "trous", tag: "parallélisation",
    q: "Complète la version à tâches et futurs.",
    code: [
      "List<Future<Integer>> futurs = new ArrayList<>();",
      "",
      "for (int i = 0; i < N; i++) {",
      "    final int k = i;",
      "    futurs.add(pool.{0}(() -> compter(tab, k*pas, (k+1)*pas, c)));",
      "}",
      "",
      "int total = 0;",
      "for (Future<Integer> f : futurs) total += f.{1}();"
    ],
    trous: [
      { sol: "submit", opts: ["submit", "execute", "start"] },
      { sol: "get", opts: ["get", "join", "run"] }
    ],
    why: "<code>submit</code> rend un <code>Future</code> ; <code>execute</code> ne rend rien et ne " +
         "permettrait pas de récupérer les totaux partiels. <code>f.get()</code> bloque jusqu'au " +
         "résultat, exactement comme un join — mais il rend une valeur."
  }

];
