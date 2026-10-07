/* =========================================================================
   modules.js — LE SEUL FICHIER A EDITER POUR AJOUTER UN COURS.

   La page d'accueil se construit a partir de cette liste. Pour un nouveau
   module : creer modules/<slug>/index.html, puis ajouter une entree ici.

   statut : "vivant"  -> au moins une page interactive utilisable
            "chantier" -> squelette en place, contenu a venir

   Script classique (et non JSON charge par fetch) pour que l'ouverture
   directe des fichiers, sans serveur local, fonctionne quand meme.
   ========================================================================= */
window.CI_MODULES = [
  {
    slug: "advanced-algorithms",
    titre: "Advanced Algorithms",
    cadre: "M1 S1 · électif",
    statut: "vivant",
    resume: "Algorithmes probabilistes et minimum cut. L'algorithme de Karger manipulable, " +
            "la démonstration de la borne 2/n(n−1) qui se télescope à l'écran, et le TP1 déroulé sur le vrai code C.",
    href: "modules/advanced-algorithms/index.html",
    seances: ["CM1 — 16/09", "CM2 — 23/09", "TP1 — 30/09"],
    pages: [
      {
        titre: "Le cours à manipuler",
        href: "modules/advanced-algorithms/index.html",
        resume: "Coupe, contraction, la borne, exponentiation rapide.",
        statut: "vivant"
      },
      {
        titre: "Karger pas à pas",
        href: "modules/advanced-algorithms/karger.html",
        resume: "La boucle de contraction du TP1, tour par tour, code C surligné.",
        statut: "vivant"
      }
    ]
  },
  {
    slug: "architectures-processeurs",
    titre: "Architectures de processeurs HP",
    cadre: "M1 S1",
    statut: "chantier",
    resume: "Pipelines, superscalaire, hiérarchie mémoire. Le simulateur de paliers de cache " +
            "(taille du tableau contre temps d'accès, et ce que le prefetcher en fait) reste à écrire.",
    href: "modules/architectures-processeurs/index.html",
    seances: ["CM1 — séquentiels et pipelines", "CM2 — superscalaires", "TP1 — analyse matérielle", "TP2 — cache"],
    pages: []
  }
];
