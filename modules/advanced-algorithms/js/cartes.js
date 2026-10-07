/* =========================================================================
   cartes.js — le paquet de revision du sujet « graphes et aleatoire ».

   Les definitions se recitent, mais l'essentiel du sujet est un
   raisonnement : on y verifie surtout qu'on sait reconstruire les etapes
   de la borne et reconnaitre le bon code.
   ========================================================================= */
window.CI_CARTES = [

  /* ---------------------------------------------------------- definitions */
  {
    type: "recto", tag: "définition",
    q: "Une coupe d'un graphe",
    a: "Une répartition des sommets en <strong>deux groupes non vides</strong>. Sa " +
       "<strong>valeur</strong> est le nombre d'arêtes dont les deux extrémités tombent de part " +
       "et d'autre."
  },
  {
    type: "recto", tag: "définition",
    q: "Pourquoi l'entrée du problème est-elle un multigraphe ?",
    a: "Parce que l'algorithme <strong>fusionne</strong> des sommets, et qu'une fusion crée " +
       "naturellement des arêtes parallèles. Il faut les garder : leur nombre <em>est</em> le poids " +
       "de la coupe."
  },
  {
    type: "recto", tag: "définition",
    q: "Algorithme probabiliste",
    a: "Un algorithme qui fait des choix <strong>au hasard</strong> pendant son exécution : deux " +
       "exécutions sur la même entrée peuvent se dérouler différemment et rendre des résultats " +
       "différents."
  },
  {
    type: "recto", tag: "l'algorithme",
    q: "L'algorithme de Karger, en une phrase",
    a: "Tirer une arête <strong>uniformément au hasard</strong>, contracter ses deux extrémités, " +
       "recommencer jusqu'à ce qu'il ne reste que deux groupes. La coupe rendue est celle qui " +
       "subsiste."
  },
  {
    type: "recto", tag: "la preuve",
    q: "Pourquoi tout sommet a-t-il un degré ≥ k, si k est la valeur de la coupe minimum ?",
    a: "Parce qu'<strong>isoler un sommet est déjà une coupe valide</strong>, de valeur exactement " +
       "son degré. Une coupe ne peut pas valoir moins que le minimum, donc degré ≥ k."
  },

  /* ---------------------------------------------------------- QCM */
  {
    type: "qcm", tag: "l'algorithme",
    q: "Dans l'algorithme de Karger, qu'est-ce qui est tiré au hasard ?",
    opts: [
      { t: "L'arête qu'on contracte", ok: true, why: "Oui. La bipartition finale n'est jamais " +
        "choisie : elle est ce qui subsiste quand il ne reste que deux groupes." },
      { t: "La bipartition (U, U')", ok: false, why: "Non — on ne choisit jamais U et U'. C'est " +
        "l'erreur de lecture la plus fréquente sur cet algorithme." },
      { t: "Le sommet de départ", ok: false, why: "Non : l'algorithme n'a pas de sommet de départ." }
    ]
  },
  {
    type: "qcm", tag: "l'algorithme",
    q: "Sur un graphe à n sommets, combien l'algorithme fait-il de contractions ?",
    opts: [
      { t: "Exactement n − 2", ok: true, why: "Oui : on part de n groupes, chaque contraction en " +
        "supprime un, on s'arrête à 2. Le nombre de <em>tours de boucle</em>, lui, est variable — " +
        "entre n − 2 et m, selon les arêtes rejetées." },
      { t: "Exactement m − 2", ok: false, why: "Non, m est le nombre d'arêtes : il borne les tours de boucle, pas les contractions." },
      { t: "Cela dépend du tirage", ok: false, why: "Non. Ce qui dépend du tirage, c'est le nombre " +
        "de tours de boucle, pas le nombre de contractions." }
    ]
  },
  {
    type: "qcm", tag: "la preuve",
    q: "Quelle est la probabilité qu'une exécution rende une coupe minimum donnée ?",
    opts: [
      { t: "Au moins 2 / n(n−1)", ok: true, why: "Oui. Et c'est une borne inférieure qui ne dépend " +
        "que de n — ni de k, ni de la forme du graphe." },
      { t: "Au moins 1 / 2ⁿ", ok: false, why: "Non. Tout l'intérêt est justement que la borne " +
        "décroît comme n², pas de façon exponentielle." },
      { t: "Exactement 2 / n(n−1)", ok: false, why: "Attention : c'est une minoration, pas une égalité." },
      { t: "Au moins k / m", ok: false, why: "Non, k/m majore la probabilité de <em>casser</em> la coupe à une étape." }
    ]
  },
  {
    type: "qcm", tag: "la preuve",
    q: "Dans la démonstration, pourquoi la probabilité de toucher la coupe à l'étape i est-elle " +
       "majorée par 2/(n−i+1) ?",
    opts: [
      { t: "Parce que m ≥ k(n−i+1)/2, donc k/m ≤ 2/(n−i+1)", ok: true, why: "Oui. La somme des " +
        "degrés vaut 2m, et chaque groupe restant a un degré ≥ k : c'est là que k s'élimine." },
      { t: "Parce qu'il reste au plus 2 arêtes dans la coupe", ok: false, why: "Non : la coupe garde ses k arêtes tant qu'on n'y touche pas." },
      { t: "Parce qu'on tire deux sommets à chaque étape", ok: false, why: "Non, le 2 vient de la somme des degrés." }
    ]
  },
  {
    type: "qcm", tag: "complexité",
    q: "Dans la contraction, pourquoi renomme-t-on toujours les sommets du <strong>plus petit</strong> groupe ?",
    opts: [
      { t: "Parce qu'un sommet n'est alors renommé que si son groupe double", ok: true, why: "Oui : " +
        "d'où au plus log₂(n) renommages par sommet, et le O(n log n). Sans cette règle, le pire " +
        "cas est en O(n²)." },
      { t: "Pour garder les identifiants dans l'ordre croissant", ok: false, why: "Non, l'ordre des identifiants n'a aucune importance." },
      { t: "Pour éviter les arêtes parallèles", ok: false, why: "Non : les arêtes parallèles sont conservées volontairement." }
    ]
  },

  /* ---------------------------------------------------------- code a trous */
  {
    type: "trous", tag: "la boucle",
    q: "Complète la boucle de contraction.",
    code: [
      "int nb_groupes = g->n;",
      "",
      "for (i = 0; i < g->m && nb_groupes {0} 2; i++) {",
      "    a = ordre[i].u;",
      "    b = ordre[i].v;",
      "",
      "    if (groupe[a] {1} groupe[b]) {",
      "        contraction(a, b, groupe, membres, taille);",
      "        nb_groupes{2};",
      "    }",
      "}"
    ],
    trous: [
      { sol: ">", opts: [">", ">=", "<"] },
      { sol: "!=", opts: ["!=", "==", "<"] },
      { sol: "--", opts: ["--", "++"] }
    ],
    why: "On s'arrête à deux groupes, et on ne contracte que si les extrémités sont encore dans " +
         "des groupes <strong>différents</strong> — sinon l'arête est devenue une boucle."
  },
  {
    type: "trous", tag: "exponentiation rapide",
    q: "Complète la version itérative binaire de aⁿ.",
    code: [
      "result = 1;",
      "while (n > 0) {",
      "    if (n % 2 == 1) result = result {0} a;",
      "    a = a {1} a;",
      "    n = n {2} 2;",
      "}"
    ],
    trous: [
      { sol: "*", opts: ["*", "+"] },
      { sol: "*", opts: ["*", "+"] },
      { sol: "/", opts: ["/", "*", "-"] }
    ],
    why: "Un bit à 1 fait accumuler ; à chaque tour <code>a</code> passe au carré suivant et " +
         "l'exposant est divisé par deux. D'où O(log n) multiplications."
  },

  /* ---------------------------------------------------------- choix de code */
  {
    type: "code", tag: "tirage aléatoire",
    q: "Quel mélange produit une permutation uniforme des m arêtes ?",
    opts: [
      { ok: true,
        code: "for (i = 0; i < m - 1; i++) {\n    j = i + rand() % (m - i);\n    echanger(ordre[i], ordre[j]);\n}",
        why: "Correct : Fisher-Yates. On tire j dans <code>[i, m-1]</code>, donc parmi les positions " +
             "pas encore fixées." },
      { ok: false,
        code: "for (i = 0; i < m - 1; i++) {\n    j = rand() % m;\n    echanger(ordre[i], ordre[j]);\n}",
        why: "Faux, et c'est subtil : tirer j dans <code>[0, m-1]</code> donne mᵐ chemins d'exécution " +
             "pour m! permutations. Comme m! ne divise pas mᵐ, la distribution est forcément biaisée." }
    ]
  },
  {
    type: "code", tag: "valeur d'une coupe",
    q: "Laquelle compte correctement les arêtes qui traversent la coupe ?",
    opts: [
      { ok: true,
        code: "for (u = 0; u < g->n; u++)\n  for (p = g->links[u]; p; p = p->suiv)\n    if (p->node < u\n        && groupe[u] != groupe[p->node])\n      nb++;",
        why: "Correct. Le test <code>p-&gt;node &lt; u</code> ne retient qu'une des deux occurrences " +
             "de chaque arête dans les listes d'adjacence." },
      { ok: false,
        code: "for (u = 0; u < g->n; u++)\n  for (p = g->links[u]; p; p = p->suiv)\n    if (groupe[u] != groupe[p->node])\n      nb++;",
        why: "Faux : chaque arête figure dans les <strong>deux</strong> listes d'adjacence, donc " +
             "elle est comptée deux fois. Le résultat vaut le double." }
    ]
  },

  /* ---------------------------------------------------------- rappels CM */
  {
    type: "qcm", tag: "rappels",
    q: "Fibonacci : quelles complexités pour les deux méthodes vues en cours ?",
    opts: [
      { t: "O(n) par programmation dynamique, O(log n) par puissance de matrice", ok: true,
        why: "Oui. La programmation dynamique stocke les résultats intermédiaires ; la puissance de " +
             "la matrice [[1,1],[1,0]] applique l'exponentiation rapide." },
      { t: "O(log n) par programmation dynamique, O(n) par matrice", ok: false, why: "C'est l'inverse." },
      { t: "O(n) pour les deux", ok: false, why: "Non : la puissance de matrice descend à O(log n)." }
    ]
  },
  {
    type: "recto", tag: "rappels",
    q: "Sur quoi repose l'exponentiation rapide, et à quoi s'applique-t-elle ?",
    a: "Sur la <strong>mise au carré</strong> — pas sur les matrices. Elle marche pour toute " +
       "opération <strong>associative</strong> : entiers, matrices, polynômes, exponentiation modulaire."
  },

  /* ---------------------------------------------------------- a completer : C */
  {
    type: "trous", tag: "union par taille",
    q: "Complète la contraction. Une seule de ces comparaisons donne le O(n log n).",
    code: [
      "grand = groupe[u];",
      "petit = groupe[v];",
      "if (grand == petit) return;",
      "",
      "if (taille[petit] {0} taille[grand]) {",
      "    tmp = grand; grand = petit; petit = tmp;",
      "}",
      "",
      "p = membres[{1}]->prem;",
      "while (p != NULL) {",
      "    groupe[p->node] = {2};",
      "    p = p->suiv;",
      "}"
    ],
    trous: [
      { sol: ">", opts: [">", "<", "=="] },
      { sol: "petit", opts: ["petit", "grand"] },
      { sol: "grand", opts: ["grand", "petit"] }
    ],
    why: "On parcourt toujours les membres du <strong>petit</strong> groupe pour les renommer vers " +
         "le grand. Inverser rendrait le pire cas quadratique."
  },
  {
    type: "trous", tag: "mélange",
    q: "Complète Fisher-Yates. La borne du tirage est tout l'enjeu.",
    code: [
      "for (i = 0; i < m - 1; i++) {",
      "    j = {0} + rand() % (m {1} i);",
      "",
      "    tmp      = ordre[i];",
      "    ordre[i] = ordre[j];",
      "    ordre[j] = tmp;",
      "}"
    ],
    trous: [
      { sol: "i", opts: ["i", "0", "1"] },
      { sol: "-", opts: ["-", "+"] }
    ],
    why: "Tirer j dans <code>[i, m-1]</code>, donc parmi les positions pas encore fixées. Avec " +
         "<code>rand() % m</code>, la distribution est biaisée : mᵐ chemins d'exécution pour m! " +
         "permutations, et m! ne divise pas mᵐ."
  },
  {
    type: "trous", tag: "exponentiation rapide",
    q: "Complète la récurrence de l'exponentiation rapide.",
    code: [
      "a^n = 1                       si n = 0",
      "a^n = (a^(n{0}2))^2            si n est pair",
      "a^n = a {1} (a^((n-1)/2))^2    si n est impair"
    ],
    trous: [
      { sol: "/", opts: ["/", "-", "*"] },
      { sol: "*", opts: ["*", "+", "/"] }
    ],
    why: "Le cas impair « consomme » un facteur <code>a</code> pour retomber sur un exposant pair. " +
         "Chaque étape divise l'exposant par deux, d'où le log."
  },
  {
    type: "trous", tag: "valeur d'une coupe",
    q: "Complète le comptage des arêtes traversantes. Un test manquant double le résultat.",
    code: [
      "for (u = 0; u < g->n; u++) {",
      "    p = g->links[u]->prem;",
      "    while (p != NULL) {",
      "        if (p->node {0} u",
      "            && groupe[u] {1} groupe[p->node])",
      "            nb++;",
      "        p = p->suiv;",
      "    }",
      "}"
    ],
    trous: [
      { sol: "<", opts: ["<", ">", "=="] },
      { sol: "!=", opts: ["!=", "==", "<"] }
    ],
    why: "Chaque arête figure dans les <strong>deux</strong> listes d'adjacence. Le test " +
         "<code>p-&gt;node &lt; u</code> n'en retient qu'une occurrence."
  }

];
