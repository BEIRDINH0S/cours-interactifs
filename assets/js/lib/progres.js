/* =========================================================================
   progres.js — ce que le site sait de toi.

   Un seul endroit lit et ecrit l'avancement, pour que l'accueil, la barre
   de navigation et la page d'un sujet racontent tous la meme chose.

   Tout vit dans localStorage, donc dans ce navigateur-ci. Chaque lecture
   est protegee : en navigation privee, le site se comporte comme au
   premier jour plutot que de casser.

   Conventions de cles :
     <nom-de-fichier>-progres         derniere etape atteinte (index)
     <nom-de-fichier>-progres-total   nombre d'etapes
     cartes-<slug>                    echeances du paquet
     cartes-<slug>-total              taille du paquet
     derniere-activite                { href, titre, sujet, quand }
   ========================================================================= */
window.CI = window.CI || {};

(function (CI) {
  "use strict";

  function lire(cle) {
    try { return window.localStorage.getItem(cle); } catch (e) { return null; }
  }

  function ecrire(cle, valeur) {
    try { window.localStorage.setItem(cle, valeur); } catch (e) { /* sans effet */ }
  }

  function cleLecon(href) {
    return href.split("/").pop().replace(/\.html$/, "") + "-progres";
  }

  var P = {};

  /** Avancement d'une lecon : null si jamais ouverte. */
  P.lecon = function (href) {
    var cle = cleLecon(href);
    var pos = parseInt(lire(cle), 10);
    var total = parseInt(lire(cle + "-total"), 10);
    if (isNaN(pos) || isNaN(total) || total <= 0) return null;
    return {
      etape: pos + 1,
      total: total,
      fini: (pos + 1) >= total,
      part: (pos + 1) / total
    };
  };

  /** Etat d'un paquet de cartes : null si jamais ouvert. */
  P.paquet = function (slug) {
    var cle = "cartes-" + slug;
    var total = parseInt(lire(cle + "-total"), 10);
    if (isNaN(total) || total <= 0) return null;
    var etat;
    try { etat = JSON.parse(lire(cle)) || {}; } catch (e) { etat = {}; }
    var ids = Object.keys(etat), now = Date.now(), dues = 0, acquises = 0;
    ids.forEach(function (id) {
      if (now >= (etat[id].du || 0)) dues++;
      if ((etat[id].boite || 0) >= 3) acquises++;
    });
    dues += Math.max(0, total - ids.length);        // jamais vues
    return { total: total, dues: dues, vues: ids.length, acquises: acquises };
  };

  /** Etat d'une page du manifeste, quel que soit son type. */
  P.page = function (sujet, page) {
    if (page.type === "lecon") {
      var l = P.lecon(page.href);
      if (!l) return { etat: "neuf", libelle: "pas commencée" };
      if (l.fini) return { etat: "fini", libelle: "terminée", part: 1, detail: l };
      return {
        etat: "encours",
        libelle: "étape " + l.etape + " sur " + l.total,
        part: l.part, detail: l
      };
    }
    if (page.type === "revision") {
      var q = P.paquet(sujet.slug);
      if (!q) return { etat: "neuf", libelle: "pas commencée" };
      if (!q.dues) return { etat: "fini", libelle: "rien à revoir", part: 1, detail: q };
      return {
        etat: "encours",
        libelle: q.dues + (q.dues > 1 ? " cartes à revoir" : " carte à revoir"),
        part: q.vues / q.total, detail: q
      };
    }
    return { etat: "libre", libelle: "quand tu veux" };
  };

  /** Avancement global d'un sujet : moyenne de ses pages mesurables. */
  P.sujet = function (sujet) {
    var parts = [], encours = null;
    (sujet.pages || []).forEach(function (page) {
      var e = P.page(sujet, page);
      if (e.part !== undefined) parts.push(e.part);
      if (e.etat === "encours" && !encours) encours = { page: page, etat: e };
    });
    if (!parts.length) return { part: 0, encours: null, commence: false };
    var somme = 0;
    parts.forEach(function (x) { somme += x; });
    return {
      part: somme / parts.length,
      encours: encours,
      commence: parts.some(function (x) { return x > 0; })
    };
  };

  /** Memorise ce qu'on vient d'ouvrir, pour proposer de le reprendre. */
  P.marquer = function (info) {
    try {
      ecrire("derniere-activite", JSON.stringify({
        href: info.href, titre: info.titre, sujet: info.sujet, quand: Date.now()
      }));
    } catch (e) { /* sans effet */ }
  };

  P.derniere = function () {
    try { return JSON.parse(lire("derniere-activite")); } catch (e) { return null; }
  };

  /** Toutes les cartes a revoir, tous sujets confondus. */
  P.aRevoir = function (sujets) {
    var total = 0, detail = [];
    (sujets || []).forEach(function (s) {
      var q = P.paquet(s.slug);
      if (q && q.dues) { total += q.dues; detail.push({ sujet: s, dues: q.dues }); }
    });
    return { total: total, detail: detail };
  };

  CI.progres = P;
})(window.CI);
