/* =========================================================================
   modules.js — LE SEUL FICHIER A EDITER POUR AJOUTER UN SUJET.

   La page d'accueil se construit a partir de cette liste. Pour un nouveau
   sujet : creer modules/<slug>/index.html, puis ajouter une entree ici.

   statut : "vivant"   -> au moins une lecon utilisable
            "chantier" -> squelette en place, contenu a venir

   Script classique (et non JSON charge par fetch) pour que l'ouverture
   directe des fichiers, sans serveur local, fonctionne quand meme.
   ========================================================================= */
window.CI_MODULES = [
  {
    slug: "advanced-algorithms",
    titre: "Graphes et aléatoire",
    cadre: "algorithmique",
    statut: "vivant",
    resume: "Comment un algorithme qui tire au hasard, et qui se trompe la plupart du temps, " +
            "résout quand même un problème que l'énumération ne peut pas atteindre.",
    href: "modules/advanced-algorithms/index.html",
    tags: ["1 leçon", "1 atelier", "15 min"],
    pages: [
      {
        titre: "Coupe minimum",
        href: "modules/advanced-algorithms/lecon-mincut.html",
        resume: "Dix étapes, de la définition à la démonstration de la borne.",
        statut: "vivant"
      },
      {
        titre: "L'algorithme instruction par instruction",
        href: "modules/advanced-algorithms/karger.html",
        resume: "L'implémentation en C et l'état de ses tableaux, tour par tour.",
        statut: "vivant"
      }
    ]
  },
  {
    slug: "architectures-processeurs",
    titre: "Hiérarchie mémoire",
    cadre: "architecture des machines",
    statut: "chantier",
    resume: "Pourquoi le même programme va dix fois plus vite sur un petit tableau que sur un grand, " +
            "et ce que les paliers d'une courbe de temps d'accès révèlent des caches.",
    href: "modules/architectures-processeurs/index.html",
    tags: ["leçon à venir"],
    pages: []
  }
];
