/* =========================================================================
   tp1-code.js — le code du TP1 tel qu'il est affiche dans le panneau.

   Copie du code reellement ecrit dans ~/Documents/AdvancedAlgorithms/TP1-mincut,
   commentaires raccourcis pour tenir a l'ecran. Les ecarts avec le fichier
   source sont signales dans le champ "note" de chaque onglet.
   ========================================================================= */
window.CI_TP1_CODE = {
  main: {
    label: "main.c — boucle q13",
    note: "Extrait de main.c, lignes 202-245. Fidèle au fichier source.",
    lines: [
      "/* 1) Un ordre aleatoire sur les m aretes (question 12) */",
      "arete *ordre = ordre_aleatoire_aretes(g);",
      "",
      "int nb_groupes = g->n;",
      "int a, b;",
      "",
      "for (i = 0; i < g->m && nb_groupes > 2; i++) {",
      "",
      "    a = ordre[i].u;",
      "    b = ordre[i].v;",
      "",
      "    /* q11 : l'arete existe encore dans le multigraphe contracte",
      "       ssi ses extremites sont dans des groupes differents */",
      "    if (groupe[a] != groupe[b]) {",
      "        contraction_simulee(a, b, groupe, membres, taille);",
      "        nb_groupes--;",
      "    }",
      "}",
      "",
      "/* 4) Valeur de la coupe obtenue (question 14) */",
      "int coupe = valeur_coupe(g, groupe);"
    ]
  },

  cs: {
    label: "contraction_simulee",
    note: "Ligne 23 : la concaténation est raccourcie. Le fichier source teste d'abord " +
          "membres[grand]->dern == NULL, le cas où la liste du grand groupe est vide.",
    lines: [
      "void contraction_simulee(int u, int v, int *groupe,",
      "                        nodl **membres, int *taille){",
      "    int grand, petit, tmp;",
      "    cell *p;",
      "",
      "    grand = groupe[u];",
      "    petit = groupe[v];",
      "    if (grand == petit) return;",
      "",
      "    /* union par taille : on renomme TOUJOURS le plus petit */",
      "    if (taille[petit] > taille[grand]) {",
      "        tmp = grand; grand = petit; petit = tmp;",
      "    }",
      "",
      "    /* renommage : le cout, c'est la taille du petit groupe */",
      "    p = membres[petit]->prem;",
      "    while (p != NULL) {",
      "        groupe[p->node] = grand;",
      "        p = p->suiv;",
      "    }",
      "",
      "    /* concatenation des deux listes en O(1) */",
      "    membres[grand]->dern->suiv = membres[petit]->prem;",
      "    membres[grand]->dern = membres[petit]->dern;",
      "    membres[petit]->prem = NULL;",
      "    membres[petit]->dern = NULL;",
      "",
      "    taille[grand] += taille[petit];",
      "    taille[petit] = 0;",
      "}"
    ]
  },

  vc: {
    label: "valeur_coupe — q14",
    note: "Fidèle à fonctions-algo.c. Elle relit le graphe de DEPART, celui qui n'a jamais été modifié.",
    lines: [
      "int valeur_coupe(graph *g, int *groupe){",
      "    int u, nb = 0;",
      "    cell *p;",
      "",
      "    for (u=0; u<g->n; u++) {",
      "        p = g->links[u]->prem;",
      "        while (p != NULL) {",
      "            /* p->node < u : chaque arete comptee une seule fois",
      "               groupe != groupe : elle traverse la coupe */",
      "            if (p->node < u && groupe[u] != groupe[p->node])",
      "                nb++;",
      "            p = p->suiv;",
      "        }",
      "    }",
      "    return nb;",
      "}"
    ]
  },

  oa: {
    label: "ordre_aleatoire_aretes — q12",
    note: "Le mélange de Fisher-Yates de la question 12. Tirer j dans [0, m-1] au lieu de [i, m-1] " +
          "donnerait une distribution biaisée : m^m chemins d'exécution pour m! permutations.",
    lines: [
      "/* 1) COLLECTE : p->node < u ne retient qu'une des deux",
      "   occurrences de chaque arete */",
      "nb = 0;",
      "for (u=0; u<g->n; u++) {",
      "    p = g->links[u]->prem;",
      "    while (p != NULL) {",
      "        if (p->node < u) {",
      "            ordre[nb].u = u;",
      "            ordre[nb].v = p->node;",
      "            nb++;",
      "        }",
      "        p = p->suiv;",
      "    }",
      "}",
      "",
      "/* 2) MELANGE DE FISHER-YATES, en O(m) */",
      "for (i=0; i < g->m - 1; i++) {",
      "    j = i + rand() % (g->m - i);",
      "",
      "    tmp      = ordre[i];",
      "    ordre[i] = ordre[j];",
      "    ordre[j] = tmp;",
      "}"
    ]
  }
};
