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
    tags: ["1 leçon", "1 atelier", "16 cartes"],
    aVenir: ["Répéter pour fiabiliser", "Exponentiation rapide"],
    pages: [
      {
        titre: "Coupe minimum",
        type: "lecon",
        href: "modules/advanced-algorithms/lecon-mincut.html",
        resume: "De la définition à la démonstration de la borne.",
        statut: "vivant"
      },
      {
        titre: "L'algorithme instruction par instruction",
        type: "atelier",
        href: "modules/advanced-algorithms/karger.html",
        resume: "L'implémentation en C et l'état de ses tableaux, tour par tour.",
        statut: "vivant"
      },
      {
        titre: "Réviser",
        type: "revision",
        href: "modules/advanced-algorithms/revision.html",
        resume: "16 cartes, en répétition espacée.",
        statut: "vivant"
      }
    ]
  },
  {
    slug: "concurrence",
    titre: "Mémoire partagée",
    cadre: "programmation concurrente",
    statut: "vivant",
    resume: "Deux fils d'exécution, une seule mémoire. Ce qui se passe quand on ne décide pas de " +
            "l'ordre, et comment reprendre la main dessus.",
    href: "modules/concurrence/index.html",
    tags: ["2 leçons", "18 cartes"],
    aVenir: ["Un verrou ou mille", "Les files de tâches"],
    pages: [
      {
        titre: "Data race et exclusion mutuelle",
        type: "lecon",
        href: "modules/concurrence/lecon-data-race.html",
        resume: "Fabriquer une course à la main, puis la supprimer avec un verrou.",
        statut: "vivant"
      },
      {
        titre: "Attendre son tour",
        type: "lecon",
        href: "modules/concurrence/lecon-moniteurs.html",
        resume: "Sémaphores et moniteurs : attendre sans bloquer ceux qui doivent te débloquer.",
        statut: "vivant"
      },
      {
        titre: "Réviser",
        type: "revision",
        href: "modules/concurrence/revision.html",
        resume: "18 cartes, en répétition espacée.",
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
    aVenir: ["Les paliers d'une courbe d'accès"],
    pages: []
  }
];
