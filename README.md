# Cours interactifs

Les mecanismes de mes cours de M1, rendus manipulables : une boucle qu'on deroule,
une demonstration qui se telescope, un comportement materiel qu'on fait varier.
Un module par matiere.

Le site est en ligne via GitHub Pages. Les fiches de revision et les notes de seance
restent dans le vault Obsidian : ce depot sert a comprendre, pas a memoriser.

## Lancer en local

Aucune dependance, aucune compilation. Deux facons :

```sh
# 1. ouvrir directement le fichier
open index.html

# 2. ou servir le dossier, si on prefere une vraie URL
python3 -m http.server 8000   # puis http://localhost:8000
```

Le code est ecrit en scripts classiques plutot qu'en modules ES, precisement pour que
l'ouverture directe d'un fichier (`file://`) fonctionne sans serveur.

## Structure

```
index.html                 page d'accueil, construite depuis modules.js
modules.js                 LA liste des modules — le seul fichier a editer pour en ajouter un
assets/
  css/system.css           jetons de couleur, typographie, composants partages
  js/hub.js                rendu de la page d'accueil
  js/lib/
    core.js                helpers DOM et SVG, enveloppe convexe, Fisher-Yates
    graph.js               figure de graphe reutilisable (+ le graphe fil rouge du cours)
    stepper.js             controleur pas a pas (boutons, curseur, clavier, deroule auto)
    codepanel.js           panneau de code a onglets avec surlignage de ligne
modules/
  advanced-algorithms/
    index.html             le cours a manipuler : coupe, contraction, la borne, exponentiation
    karger.html            la boucle de contraction du TP1, etape par etape
    js/                    le code propre a ces deux pages
    data/tp1-code.js       le code C affiche dans le panneau
  architectures-processeurs/
    index.html             squelette, sert de patron
```

## Ajouter un module

1. `mkdir modules/<slug>` et y mettre un `index.html` (copier celui de
   `architectures-processeurs`, c'est le patron).
2. Lier `../../assets/css/system.css` et les briques utiles de `assets/js/lib/`.
3. Ajouter une entree dans `modules.js`.

Rien d'autre : pas de manifeste a regenerer, pas de build a relancer.

## Conventions

- Les deux themes, clair et sombre, suivent celui du systeme. Toute couleur passe par un
  jeton defini dans `system.css` — jamais de valeur en dur dans une page.
- Chaque page tient a 400 px de large.
- Le code C affiche est celui reellement ecrit pour les TP. Quand un extrait est
  raccourci, l'ecart est signale dans le champ `note` de l'onglet concerne.
