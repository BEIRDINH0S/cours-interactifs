# Apprendre en manipulant

Des sujets d'informatique expliques par la manipulation plutot que par la lecture :
une idee par ecran, quelque chose a faire a chaque fois, et un objectif a valider
avant de passer a la suite.

En ligne : https://beirdinh0s.github.io/cours-interactifs/

## Le format d'une lecon

Une lecon est une suite d'etapes. Chaque etape declare un titre, deux ou trois
phrases, un objectif facultatif et une fonction `mount()` qui installe la
manipulation. Tant que l'objectif n'est pas atteint, « Continuer » reste ferme.

La regle qui tient tout : **un seul exemple par lecon**, du debut a la fin. Chaque
nouvelle idee s'ajoute sur un terrain deja familier, au lieu de repartir d'un
dessin neuf a chaque section.

## Lancer en local

Aucune dependance, aucune compilation. Deux facons :

```sh
open index.html                 # ouverture directe du fichier
python3 -m http.server 8000     # ou servir le dossier : http://localhost:8000
```

Le code est ecrit en scripts classiques plutot qu'en modules ES, precisement pour
que l'ouverture directe d'un fichier (`file://`) fonctionne sans serveur.

## Structure

```
index.html                 accueil, construite depuis modules.js
modules.js                 LA liste des sujets — le seul fichier a editer pour en ajouter un
assets/
  css/system.css           jetons de couleur, typographie, composants partages
  js/hub.js                rendu de l'accueil
  js/lib/
    core.js                helpers DOM et SVG, enveloppe convexe, Fisher-Yates
    chrome.js              la navigation : barre haute, selecteur de sujet, theme, badges
    lesson.js              le lecteur de lecon : rail, objectifs bloquants, progression
    cards.js               revision par cartes et planification par boites
    graph.js               figure de graphe reutilisable (clic sommet / clic arete)
    threads.js             simulateur d'entrelacement : fils, memoire partagee, verrous
    stepper.js             controleur pas a pas (boutons, curseur, clavier, deroule auto)
    codepanel.js           panneau de code a onglets avec surlignage de ligne
modules/
  advanced-algorithms/     « Graphes et aleatoire »
    index.html             la page du sujet : ses lecons et ses ateliers
    lecon-mincut.html      la lecon « coupe minimum », 10 etapes
    karger.html            l'atelier : l'algorithme vu depuis son implementation en C
    revision.html          16 cartes, en repetition espacee
    js/                    une lecon = un fichier ; cartes.js porte le paquet
    data/implementation-c.js   le code C affiche dans l'atelier
  concurrence/             « Memoire partagee »
    index.html             la page du sujet
    lecon-data-race.html   la lecon « data race et exclusion mutuelle », 10 etapes
    revision.html          18 cartes, en repetition espacee
    js/lecon-data-race.js, js/cartes.js
  architectures-processeurs/   « Hierarchie memoire », squelette servant de patron
```

## La navigation

`chrome.js` s'insere en tete de chaque page et ne demande aucune configuration :
le sujet et la page courante se deduisent de l'URL, les pages d'un sujet sont lues
dans `modules.js`. **Consequence : une page absente de `modules.js` n'apparait nulle
part dans la navigation**, meme si le fichier existe.

La barre du sujet affiche l'avancement : `4/10` pour une lecon entamee, le nombre de
cartes a revoir pour un paquet. Ces compteurs viennent de `localStorage`, et la cle
d'une lecon derive du nom de son fichier : une lecon `<nom>.html` doit employer la
cle `<nom>-progres`.

## Ajouter un sujet

1. `mkdir modules/<slug>` et y mettre un `index.html` (copier celui de
   `architectures-processeurs`, c'est le patron).
2. Lier `../../assets/css/system.css` et les briques utiles de `assets/js/lib/`.
3. Ajouter une entree dans `modules.js`, avec ses pages : c'est ce qui les fait
   apparaitre dans la navigation.

Rien d'autre : pas de manifeste a regenerer, pas de build a relancer.

## Conventions

- Les deux themes, clair et sombre, suivent celui du systeme. Toute couleur passe
  par un jeton defini dans `system.css` — jamais de valeur en dur dans une page.
- Chaque page tient a 400 px de large.
- Une page explique un sujet, pas un cours : pas de numeros de questions, pas de
  references a un enonce ou a un enseignant. Quelqu'un qui arrive sans contexte
  doit pouvoir suivre.
- La progression dans une lecon est gardee en `localStorage`, avec un `try/catch` :
  en navigation privee elle repart simplement de zero.
- `CI.__lastFig`, `CI.__lastSim` et `CI.__cardsInternals` sont des points d'accroche
  pour les tests automatises, pas une API.
- Chaque page charge `core.js`, puis `modules.js`, puis `chrome.js`, dans cet ordre.
- Une lecon ne contient que ses etapes : le lecteur qui les enchaine est commun
  a tout le site (`assets/js/lib/lesson.js`).
