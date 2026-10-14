/* =========================================================================
   ordonnancement.js — le simulateur partage par les pages du sujet.

   Un ordonnancement, ici, c'est : m machines identiques, n taches de durees
   donnees, et une affectation. La charge L(i) d'une machine est la somme des
   durees qu'elle porte ; le makespan est le max des charges.

   Ce fichier contient :
     deroule(durees, m, trier)  la trace pas a pas d'un glouton
     optimum(durees, m)         le vrai OPT, par separation et evaluation
     bornes(durees, m)          les deux minorants de OPT
     dessiner(svg, etat, opts)  le dessin SVG des colonnes de charge
     chaine(hote, lignes, opts) une chaine d'inegalites, en symboles ou en mots
     INSTANCES                  les instances remarquables du cours

   Cle de stockage posee ici (cf. les conventions de progres.js) :
     chaine-en-mots             "1" si l'utilisateur prefere lire en mots

   Script classique, pas de module ES : l'ouverture directe d'un fichier doit
   continuer de marcher sans serveur.
   ========================================================================= */
window.CI_ORDO = (function (CI) {
  "use strict";

  /* ------------------------------------------------ les deux gloutons */

  /**
   * Deroule le glouton et rend la trace complete.
   *   trier = false -> list scheduling (ordre d'arrivee)
   *   trier = true  -> LPT (duree decroissante)
   *
   * Une etape de la trace decrit l'instant AVANT la pose, puis la pose :
   *   { rang, tache, duree, machine, avant:[charges], apres:[charges], moins }
   * ou `moins` est la machine la moins chargee a cet instant (celle choisie).
   */
  function deroule(durees, m, trier) {
    var ordre = durees.map(function (d, j) { return { j: j, d: d }; });

    if (trier) {
      /* tri decroissant, stable sur l'indice pour que la trace soit reproductible */
      ordre.sort(function (a, b) { return (b.d - a.d) || (a.j - b.j); });
    }

    var charges = [], i;
    for (i = 0; i < m; i++) charges.push(0);

    var trace = [];
    ordre.forEach(function (t, rang) {
      var avant = charges.slice();

      /* la machine la moins chargee ; a egalite, la premiere -- c'est ce
         choix de bris d'egalite qui rend les pires cas du cours exacts */
      var moins = 0;
      for (i = 1; i < m; i++) if (charges[i] < charges[moins]) moins = i;

      charges[moins] += t.d;

      trace.push({
        rang: rang, tache: t.j, duree: t.d, machine: moins,
        avant: avant, apres: charges.slice(), moins: moins
      });
    });

    return {
      ordre: ordre,
      trace: trace,
      charges: charges,
      makespan: Math.max.apply(null, charges)
    };
  }

  /* ------------------------------------------------ l'optimum, exactement */

  /**
   * OPT par separation et evaluation. Deux elagages suffisent a tenir les
   * tailles d'une page de cours :
   *   - on n'essaie qu'une machine par valeur de charge (deux machines de
   *     meme charge sont interchangeables : pure symetrie) ;
   *   - on coupe des qu'une charge atteint le meilleur makespan connu.
   * Les taches sont prises par duree decroissante : les gros choix d'abord,
   * donc les coupes tot.
   */
  function optimum(durees, m) {
    if (!durees.length) return 0;

    var d = durees.slice().sort(function (a, b) { return b - a; });
    var total = d.reduce(function (s, x) { return s + x; }, 0);
    var plancher = Math.max(d[0], total / m);

    var charges = [], i;
    for (i = 0; i < m; i++) charges.push(0);

    var best = total;              /* tout sur une machine : solution valide */

    function rec(k) {
      if (k === d.length) {
        best = Math.min(best, Math.max.apply(null, charges));
        return;
      }
      var vues = {};
      for (var i = 0; i < m; i++) {
        if (vues[charges[i]]) continue;          /* symetrie */
        vues[charges[i]] = 1;
        if (charges[i] + d[k] >= best) continue; /* elagage */
        charges[i] += d[k];
        rec(k + 1);
        charges[i] -= d[k];
        if (best <= plancher) return;            /* on ne fera pas mieux */
      }
    }
    rec(0);
    return best;
  }

  /* ------------------------------------------------ les deux minorants */

  function bornes(durees, m) {
    var total = durees.reduce(function (s, x) { return s + x; }, 0);
    var maxt = durees.length ? Math.max.apply(null, durees) : 0;
    var moy = m ? total / m : 0;
    return { total: total, moyenne: moy, maxTache: maxt, borne: Math.max(moy, maxt) };
  }

  /* ------------------------------------------------ instances remarquables */

  /** Le pire cas du list scheduling : m(m-1) taches de 1, puis une de m. */
  function pireGlouton(m) {
    var d = [], k;
    for (k = 0; k < m * (m - 1); k++) d.push(1);
    d.push(m);
    return d;
  }

  var INSTANCES = [
    {
      cle: "pire-glouton",
      nom: "le pire cas du glouton",
      detail: "m(m−1) tâches de 1, puis une de m. Le glouton dépense son équilibre " +
              "sur les petites et n'a plus de machine libre pour la grosse.",
      durees: function (m) { return pireGlouton(m); },
      m: null
    },
    {
      cle: "pire-lpt",
      nom: "le pire cas de LPT",
      detail: "3, 3, 2, 2, 2 sur deux machines. LPT sépare les deux 3 alors " +
              "qu'il fallait les réunir : ratio 7/6, la borne exacte de LPT.",
      durees: function () { return [3, 3, 2, 2, 2]; },
      m: 2
    },
    {
      cle: "une-enorme",
      nom: "une tâche écrasante",
      detail: "Une tâche très longue et une poussière de petites : c'est le " +
              "minorant max pⱼ qui commande, la moyenne ne dit rien.",
      durees: function () { return [10, 1, 1, 1, 1, 1, 1]; },
      m: null
    },
    {
      cle: "toutes-egales",
      nom: "toutes égales",
      detail: "Les deux algorithmes sont identiques — le tri ne change rien — " +
              "et tombent sur l'optimum dès que n est multiple de m.",
      durees: function (m) {
        var d = [], k;
        for (k = 0; k < 3 * m; k++) d.push(2);
        return d;
      },
      m: null
    },
    {
      cle: "hasard",
      nom: "au hasard",
      detail: "Durées tirées entre 1 et 9. Relance pour en voir d'autres.",
      durees: function (m) {
        var n = 3 * m + Math.floor(Math.random() * 3), d = [], k;
        for (k = 0; k < n; k++) d.push(1 + Math.floor(Math.random() * 9));
        return d;
      },
      m: null
    }
  ];

  /* ------------------------------------------------ chaines d'inegalites

     Une meme chaine se lit de deux facons. En SYMBOLES, les formes se voient :
     on repere qu'un terme se factorise, donc on peut passer a la ligne
     suivante. En MOTS, on comprend ce qu'on affirme, mais plus aucune
     transformation n'est visible -- c'est precisement ce que le bouton fait
     sentir. Le choix est garde dans localStorage, pour suivre d'une lecon a
     l'autre.                                                               */

  var CLE_MOTS = "chaine-en-mots";

  function lirePref() {
    try { return window.localStorage.getItem(CLE_MOTS) === "1"; }
    catch (e) { return false; }      /* navigation privee : symboles par defaut */
  }

  function ecrirePref(v) {
    try { window.localStorage.setItem(CLE_MOTS, v ? "1" : "0"); }
    catch (e) { /* sans effet */ }
  }

  /**
   * hote   : le conteneur ou dessiner
   * lignes : [{ sym, mots, just, cle }]
   *            sym   la ligne en symboles
   *            mots  la meme, en mots
   *            just  la justification, affichee a droite (optionnelle)
   *            cle   true pour la ligne de conclusion, mise en avant
   * opts   : { revele } -- true pour ne devoiler qu'une ligne a la fois
   *
   * Rend { bouton, suivante, tout, fini, total }.
   */
  function chaine(hote, lignes, opts) {
    opts = opts || {};
    var mots = lirePref();
    var vues = opts.revele ? 0 : lignes.length;

    var box = CI.h("div", { "class": "chaine" });
    var note = CI.h("p", { "class": "chaine-note" });
    hote.appendChild(box);
    hote.appendChild(note);

    var btn = CI.h("button", { "class": "bascule" });

    function dessine() {
      CI.clear(box);
      lignes.forEach(function (l, k) {
        var texte = mots ? l.mots : l.sym;
        box.appendChild(CI.h("div", {
          "class": "ligne" + (k < vues ? " vue" : "") + (l.cle ? " cle" : "") +
                   (mots ? " en-mots" : ""),
          html: texte + (l.just ? " <span class='just'>" + l.just + "</span>" : "")
        }));
      });

      btn.textContent = mots ? "Afficher en symboles" : "Afficher en mots";
      btn.setAttribute("aria-pressed", String(mots));

      /* Le bouton n'est pas un gadget : il montre une vraie limite des mots. */
      note.innerHTML = mots
        ? "En mots, on comprend chaque ligne — mais on ne <strong>voit</strong> plus " +
          "comment passer de l'une à la suivante. Les regroupements de termes sont " +
          "invisibles ici."
        : "En symboles, les formes se voient : c'est ce qui permet de repérer qu'un " +
          "terme se factorise, et donc d'écrire la ligne suivante.";
    }

    btn.onclick = function () { mots = !mots; ecrirePref(mots); dessine(); };
    dessine();

    return {
      bouton: btn,
      suivante: function () { if (vues < lignes.length) vues++; dessine(); return vues; },
      tout: function () { vues = lignes.length; dessine(); },
      fini: function () { return vues >= lignes.length; },
      total: lignes.length
    };
  }

  /* ------------------------------------------------ le dessin */

  /**
   * Dessine les colonnes de charge.
   *
   * etat : { m, charges:[...], piles:[[{duree, cls}, ...], ...] }
   *   piles[i] est la liste des taches posees sur la machine i, de bas en haut.
   * opts : {
   *   hmax      hauteur de l'axe, en unites de duree (meme valeur pour deux
   *             dessins qu'on veut comparer)
   *   reperes   [{ v, cls, label }] les lignes horizontales
   *   crit      indice de la machine critique, a cercler en rouge
   *   moins     indice de la machine la moins chargee, a cercler en vert
   *   nomMachine(i) etiquette sous la colonne (defaut : M1, M2, ...)
   *   onTache(i, k, t) appele au clic sur la tache k de la machine i
   * }
   */
  function dessiner(svg, etat, opts) {
    opts = opts || {};
    var m = etat.m;
    var hmax = Math.max(1, opts.hmax || Math.max.apply(null, etat.charges) || 1);

    var COL = 46, ECART = 14, MARGE_G = 10, MARGE_D = 86;
    var HAUT = 24, BAS = 46, H_UTILE = 170;
    var W = MARGE_G + m * COL + (m - 1) * ECART + MARGE_D;
    var H = HAUT + H_UTILE + BAS;

    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("class", "ordo");
    CI.clear(svg);

    function y(v) { return HAUT + H_UTILE - (v / hmax) * H_UTILE; }
    function x(i) { return MARGE_G + i * (COL + ECART); }

    /* les reperes d'abord : ils passent derriere les colonnes */
    (opts.reperes || []).forEach(function (r) {
      if (r.v == null || r.v > hmax * 1.02) return;
      svg.appendChild(CI.svg("line", {
        x1: MARGE_G - 4, y1: y(r.v), x2: MARGE_G + m * COL + (m - 1) * ECART + 6, y2: y(r.v),
        "class": "repere " + (r.cls || "")
      }));
      svg.appendChild(CI.svgText({
        x: MARGE_G + m * COL + (m - 1) * ECART + 11, y: y(r.v),
        "class": "repere-txt " + (r.cls || "")
      }, r.label));
    });

    /* une colonne par machine */
    for (var i = 0; i < m; i++) {
      var g = CI.svg("g", {
        "class": "m-col" + (opts.crit === i ? " crit" : "") + (opts.moins === i ? " moins" : "")
      });

      /* le socle */
      g.appendChild(CI.svg("line", {
        x1: x(i) - 2, y1: y(0), x2: x(i) + COL + 2, y2: y(0), "class": "m-socle"
      }));

      /* la pile, de bas en haut */
      var cumul = 0;
      (etat.piles[i] || []).forEach(function (t, k) {
        var h = (t.duree / hmax) * H_UTILE;
        var yb = y(cumul + t.duree);
        var bloc = CI.svg("rect", {
          x: x(i), y: yb, width: COL, height: Math.max(1.5, h), rx: 3,
          "class": "t-bloc " + (t.cls || "")
        });
        if (opts.onTache) {
          bloc.setAttribute("cursor", "pointer");
          (function (mi, mk, mt) {
            bloc.addEventListener("click", function () { opts.onTache(mi, mk, mt); });
          })(i, k, t);
        }
        g.appendChild(bloc);
        if (h >= 13) {
          g.appendChild(CI.svgText({
            x: x(i) + COL / 2, y: yb + h / 2,
            "class": "t-txt" + (t.cls ? " sur" : "")
          }, String(t.duree)));
        }
        cumul += t.duree;
      });

      /* halo sur la machine remarquable */
      if (opts.crit === i || opts.moins === i) {
        var hc = Math.max(6, (etat.charges[i] / hmax) * H_UTILE);
        g.appendChild(CI.svg("rect", {
          x: x(i) - 4, y: y(etat.charges[i]) - 4, width: COL + 8, height: hc + 8, rx: 5,
          "class": "m-halo" + (opts.moins === i ? " moins" : "")
        }));
      }

      /* la charge, puis le nom */
      g.appendChild(CI.svgText({ x: x(i) + COL / 2, y: y(0) + 16, "class": "m-charge" },
                               String(etat.charges[i])));
      g.appendChild(CI.svgText({ x: x(i) + COL / 2, y: y(0) + 32, "class": "m-nom" },
                               opts.nomMachine ? opts.nomMachine(i) : "M" + (i + 1)));
      svg.appendChild(g);
    }
  }

  /** Construit l'etat a dessiner apres `k` poses de la trace. */
  function etatApres(res, m, k, marques) {
    var piles = [], i;
    for (i = 0; i < m; i++) piles.push([]);
    var charges = [];
    for (i = 0; i < m; i++) charges.push(0);

    for (i = 0; i < k && i < res.trace.length; i++) {
      var p = res.trace[i];
      var cls = "";
      if (marques && marques.cur === i) cls = "cur";
      if (marques && marques.jstar === i) cls = "jstar";
      piles[p.machine].push({ duree: p.duree, cls: cls, rang: i, tache: p.tache });
      charges[p.machine] += p.duree;
    }
    return { m: m, piles: piles, charges: charges };
  }

  return {
    deroule: deroule,
    optimum: optimum,
    bornes: bornes,
    chaine: chaine,
    dessiner: dessiner,
    etatApres: etatApres,
    pireGlouton: pireGlouton,
    INSTANCES: INSTANCES
  };
})(window.CI);
