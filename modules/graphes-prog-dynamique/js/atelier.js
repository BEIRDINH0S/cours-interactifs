/* =========================================================================
   atelier.js — les deux gloutons deroules cote a cote.

   Une seule instance, un seul pas a pas : a l'etape k, chaque algorithme a
   pose ses k premieres taches. Comme ils ne les prennent pas dans le meme
   ordre, c'est justement la comparaison qui est instructive.

   Les deux dessins partagent `hmax`, sinon les hauteurs ne se comparent pas.
   ========================================================================= */
(function (CI, O) {
  "use strict";

  var M_CHOIX = [2, 3, 4];

  var etat = {
    m: 3,
    instance: O.INSTANCES[0],
    durees: [],
    ls: null, lpt: null, opt: 0, bornes: null
  };

  var pas = null;   /* le Stepper, cree apres le premier calcul */

  /* ------------------------------------------------ calcul */

  function recalculer() {
    etat.durees = etat.instance.durees(etat.m);
    etat.ls = O.deroule(etat.durees, etat.m, false);
    etat.lpt = O.deroule(etat.durees, etat.m, true);
    etat.opt = O.optimum(etat.durees, etat.m);
    etat.bornes = O.bornes(etat.durees, etat.m);

    CI.el("durees").textContent =
      "n = " + etat.durees.length + "  ·  durées " + etat.durees.join(", ");

    if (!pas) {
      pas = new CI.Stepper({
        total: etat.durees.length + 1,
        render: peindre,
        els: {
          prev: CI.el("prev"), next: CI.el("next"), play: CI.el("play"),
          scrub: CI.el("scrub"), label: CI.el("stepno")
        },
        labelFmt: function (i, n) { return "tâche " + i + " / " + (n - 1); }
      });
    } else {
      pas.stop();
      pas.reset(etat.durees.length + 1, 0);
    }
  }

  /* ------------------------------------------------ dessin */

  /** Hauteur commune aux deux dessins : le plus haut de tout ce qu'on affiche. */
  function hauteurCommune() {
    return Math.max(etat.ls.makespan, etat.lpt.makespan,
                    etat.opt, etat.bornes.borne) * 1.08;
  }

  function reperes() {
    var b = etat.bornes, r = [];
    r.push({ v: etat.opt, cls: "opt", label: "OPT = " + etat.opt });
    /* on n'affiche la moyenne et la plus grande tache que si elles se
       distinguent d'OPT, sinon les etiquettes se chevauchent pour rien */
    if (Math.abs(b.moyenne - etat.opt) > 0.15) {
      r.push({ v: b.moyenne, cls: "moy", label: "Σpⱼ/m = " + arrondi(b.moyenne) });
    }
    if (Math.abs(b.maxTache - etat.opt) > 0.15 && Math.abs(b.maxTache - b.moyenne) > 0.15) {
      r.push({ v: b.maxTache, cls: "maxt", label: "max pⱼ = " + b.maxTache });
    }
    return r;
  }

  function arrondi(x) {
    return (Math.round(x * 10) / 10).toString().replace(".", ",");
  }

  /** Machine critique d'un etat partiel : celle qui porte le max. */
  function critique(charges) {
    var k = 0, i;
    for (i = 1; i < charges.length; i++) if (charges[i] > charges[k]) k = i;
    return k;
  }

  function peindreUn(res, svgId, fileId, titreId, ratioId, k, hmax) {
    var marques = { cur: k - 1 };
    var e = O.etatApres(res, etat.m, k, marques);
    var ms = Math.max.apply(null, e.charges);

    O.dessiner(CI.el(svgId), e, {
      hmax: hmax,
      reperes: reperes(),
      crit: k > 0 ? critique(e.charges) : undefined,
      moins: k > 0 && k <= res.trace.length ? res.trace[k - 1].machine : undefined
    });

    /* la file : les taches dans l'ordre PROPRE a cet algorithme */
    var file = CI.clear(CI.el(fileId));
    res.ordre.forEach(function (t, rang) {
      var cls = "file-t";
      if (rang < k - 1) cls += " posee";
      else if (rang === k - 1) cls += " cur";
      file.appendChild(CI.h("span", { "class": cls, text: String(t.d) }));
    });

    CI.el(titreId).textContent = "makespan " + (k ? ms : 0);

    var rel = CI.el(ratioId);
    if (k === res.trace.length && etat.opt > 0) {
      var r = ms / etat.opt;
      rel.textContent = "ratio " + arrondi2(r);
      rel.className = "ratio " + (r <= 1.0001 ? "bon" : (r > 1.2 ? "mauvais" : ""));
    } else {
      rel.textContent = "";
      rel.className = "ratio";
    }
    return ms;
  }

  function arrondi2(x) {
    return (Math.round(x * 1000) / 1000).toString().replace(".", ",");
  }

  function peindre(k) {
    var hmax = hauteurCommune();
    var msLS = peindreUn(etat.ls, "svg-ls", "file-ls", "t-ls", "r-ls", k, hmax);
    var msLPT = peindreUn(etat.lpt, "svg-lpt", "file-lpt", "t-lpt", "r-lpt", k, hmax);

    var m = etat.m;
    CI.el("c-opt").textContent = etat.opt;
    CI.el("c-ls").textContent = k ? msLS : 0;
    CI.el("c-lpt").textContent = k ? msLPT : 0;
    CI.el("c-b1").textContent = arrondi2(2 - 1 / m);
    CI.el("c-b2").textContent = arrondi2(4 / 3 - 1 / (3 * m));

    raconter(k, msLS, msLPT);
  }

  /* ------------------------------------------------ le commentaire */

  function raconter(k, msLS, msLPT) {
    var phase = CI.el("phase"), say = CI.el("say");

    if (k === 0) {
      phase.textContent = "état initial";
      say.innerHTML = "Les " + etat.m + " machines sont vides. À droite, les durées ont déjà " +
        "été <strong>triées</strong> — c'est le seul écart entre les deux colonnes. " +
        "<em>" + etat.instance.detail + "</em>";
      return;
    }

    var pLS = etat.ls.trace[k - 1], pLPT = etat.lpt.trace[k - 1];
    var fin = (k === etat.durees.length);

    phase.textContent = fin ? "terminé" : ("pose " + k + " sur " + etat.durees.length);

    if (!fin) {
      say.innerHTML =
        "<strong>List scheduling</strong> pose la tâche de durée <strong>" + pLS.duree +
        "</strong> sur M" + (pLS.machine + 1) + ", qui était à " + pLS.avant[pLS.machine] +
        " — la plus basse. &nbsp;·&nbsp; <strong>LPT</strong> pose celle de durée <strong>" +
        pLPT.duree + "</strong> sur M" + (pLPT.machine + 1) + " (à " +
        pLPT.avant[pLPT.machine] + ").";
      return;
    }

    var rLS = etat.opt ? msLS / etat.opt : 1, rLPT = etat.opt ? msLPT / etat.opt : 1;
    var txt = "Tout est placé. <strong>LS fait " + msLS + "</strong>, <strong>LPT fait " +
              msLPT + "</strong>, l'optimum est <strong>" + etat.opt + "</strong>. ";

    if (msLS === msLPT) {
      txt += msLS === etat.opt
        ? "Les deux tombent sur l'optimum : sur cette instance, l'ordre n'avait pas d'importance."
        : "Les deux font la même erreur. Le tri ne protège pas de tout — ce qui reste, " +
          "ce sont les mauvais <em>regroupements</em>, pas les mauvaises surprises de fin.";
    } else if (msLPT < msLS) {
      txt += "Le tri a gagné " + (msLS - msLPT) + ". Regarde l'étape où la plus grosse tâche " +
             "est posée : à gauche elle arrive tard, sur une machine déjà chargée ; à droite " +
             "elle part en premier, sur une machine vide.";
    } else {
      txt += "Curieusement le tri fait pire ici — c'est possible sur une instance isolée, " +
             "le ratio est une garantie de <em>pire cas</em>, pas une promesse instance par instance.";
    }

    txt += "<br>Ratios : LS " + arrondi2(rLS) + " (garanti ≤ " + arrondi2(2 - 1 / etat.m) +
           "), LPT " + arrondi2(rLPT) + " (garanti ≤ " + arrondi2(4 / 3 - 1 / (3 * etat.m)) + ").";
    say.innerHTML = txt;
  }

  /* ------------------------------------------------ les commandes */

  function boutons() {
    var bm = CI.clear(CI.el("mbtns"));
    M_CHOIX.forEach(function (m) {
      var b = CI.h("button", { "aria-pressed": String(m === etat.m), text: String(m) });
      b.onclick = function () {
        etat.m = m;
        if (etat.instance.m && etat.instance.m !== m) etat.instance = O.INSTANCES[0];
        recalculer(); boutons();
      };
      bm.appendChild(b);
    });

    var bi = CI.clear(CI.el("ibtns"));
    O.INSTANCES.forEach(function (ins) {
      var b = CI.h("button", {
        "aria-pressed": String(ins.cle === etat.instance.cle), text: ins.nom
      });
      b.onclick = function () {
        etat.instance = ins;
        if (ins.m) etat.m = ins.m;           /* certaines instances imposent m */
        recalculer(); boutons();
      };
      bi.appendChild(b);
    });
  }

  /* ------------------------------------------------ demarrage */

  if (CI.progres) {
    CI.progres.marquer({
      href: "modules/graphes-prog-dynamique/atelier-ordonnancement.html",
      titre: "Les deux gloutons, côte à côte"
    });
  }

  boutons();
  recalculer();
})(window.CI, window.CI_ORDO);
