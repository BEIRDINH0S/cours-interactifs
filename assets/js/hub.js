/* =========================================================================
   hub.js — l'accueil.

   Ce n'est pas un catalogue : c'est l'etat des lieux. D'abord ce qu'on
   peut reprendre maintenant, puis ce qui est a revoir, puis seulement la
   table des matieres.

   Au premier passage il n'y a rien a reprendre : la page propose alors un
   point de depart plutot que d'afficher des compteurs a zero.
   ========================================================================= */
(function (CI, MODULES) {
  "use strict";

  var P = CI.progres;

  /** Barre segmentee : un segment par etape, les faits remplis. */
  function jauge(part, total) {
    var n = Math.min(total || 10, 24);
    var faits = Math.round((part || 0) * n);
    var box = CI.h("span", { "class": "jauge", "aria-hidden": "true" });
    for (var i = 0; i < n; i++) {
      box.appendChild(CI.h("span", { "class": "seg" + (i < faits ? " plein" : "") }));
    }
    return box;
  }

  /* ------------------------------------------------ reprendre */

  function blocReprendre() {
    var hote = CI.el("reprendre");
    if (!hote) return;

    // la lecon entamee la plus recente, sinon la premiere lecon du site
    var derniere = P.derniere(), cible = null;
    if (derniere && derniere.href) {
      MODULES.forEach(function (s) {
        (s.pages || []).forEach(function (p) {
          if (p.href === derniere.href) cible = { sujet: s, page: p };
        });
      });
    }
    if (cible) {
      var etat = P.page(cible.sujet, cible.page);
      if (etat.etat === "fini" && cible.page.type === "lecon") cible = null;
    }
    if (!cible) {
      MODULES.forEach(function (s) {
        if (cible) return;
        (s.pages || []).forEach(function (p) {
          if (!cible && p.type === "lecon" && P.page(s, p).etat === "encours") cible = { sujet: s, page: p };
        });
      });
    }

    var premiere = null;
    MODULES.forEach(function (s) {
      if (premiere) return;
      (s.pages || []).forEach(function (p) {
        if (!premiere && p.type === "lecon" && s.statut === "vivant") premiere = { sujet: s, page: p };
      });
    });

    if (!cible) {
      // premier passage : une invitation, pas un tableau de bord vide
      if (!premiere) return;
      hote.appendChild(CI.h("p", { "class": "amorce", text: "Rien de commencé pour l'instant." }));
      hote.appendChild(CI.h("h2", { "class": "reprendre-titre", text: premiere.page.titre }));
      hote.appendChild(CI.h("p", { "class": "reprendre-sous", text: premiere.page.resume }));
      hote.appendChild(CI.h("a", { "class": "bouton", href: premiere.page.href, text: "Commencer" }));
      return;
    }

    var e = P.page(cible.sujet, cible.page);
    hote.appendChild(CI.h("p", { "class": "amorce", text: "Tu en étais là" }));
    hote.appendChild(CI.h("h2", { "class": "reprendre-titre", text: cible.page.titre }));
    hote.appendChild(CI.h("p", { "class": "reprendre-sous", text: cible.sujet.titre }));
    var l = e.detail || {};
    hote.appendChild(CI.h("div", { "class": "jauge-ligne" }, [
      jauge(e.part || 0, l.total || 10),
      CI.h("span", { "class": "jauge-txt", text: e.libelle })
    ]));
    hote.appendChild(CI.h("a", { "class": "bouton", href: cible.page.href, text: "Reprendre" }));
  }

  /* ------------------------------------------------ a revoir */

  function blocRevoir() {
    var hote = CI.el("revoir");
    if (!hote) return;
    var r = P.aRevoir(MODULES);
    if (!r.total) { hote.hidden = true; return; }

    var ligne = CI.h("div", { "class": "revoir-ligne" }, [
      CI.h("span", { "class": "revoir-nombre", text: String(r.total) }),
      CI.h("span", { "class": "revoir-txt",
        text: (r.total > 1 ? "cartes à revoir" : "carte à revoir") +
              (r.detail.length > 1 ? ", dans " + r.detail.length + " sujets" : "") })
    ]);
    hote.appendChild(ligne);
    var liens = CI.h("div", { "class": "revoir-liens" });
    r.detail.forEach(function (d) {
      var page = (d.sujet.pages || []).filter(function (p) { return p.type === "revision"; })[0];
      if (!page) return;
      liens.appendChild(CI.h("a", { "class": "bouton mince", href: page.href,
        text: d.sujet.titre + " (" + d.dues + ")" }));
    });
    hote.appendChild(liens);
  }

  /* ------------------------------------------------ table des matieres */

  function blocSujets() {
    var hote = CI.el("sujets");
    if (!hote) return;

    MODULES.forEach(function (s) {
      var vivant = s.statut === "vivant";
      var av = P.sujet(s);

      var droite = CI.h("div", { "class": "sujet-etat" });
      if (!vivant) {
        droite.appendChild(CI.h("span", { "class": "mention", text: "en chantier" }));
      } else if (av.part >= 1) {
        droite.appendChild(CI.h("span", { "class": "mention fini", text: "à jour" }));
      } else if (av.commence) {
        droite.appendChild(jauge(av.part, 10));
        droite.appendChild(CI.h("span", { "class": "mention",
          text: Math.round(av.part * 100) + " %" }));
      } else {
        droite.appendChild(CI.h("span", { "class": "mention", text: "pas commencé" }));
      }

      var contenu = (s.pages || []).map(function (p) { return p.titre; }).join(", ");
      var ligne = CI.h("a", { "class": "sujet" + (vivant ? "" : " muet"), href: s.href }, [
        CI.h("div", { "class": "sujet-texte" }, [
          CI.h("h3", { text: s.titre }),
          CI.h("p", { text: s.resume }),
          CI.h("p", { "class": "sujet-contenu",
            text: vivant ? contenu : (s.aVenir || []).join(", ") })
        ]),
        droite
      ]);
      hote.appendChild(ligne);
    });
  }

  blocReprendre();
  blocRevoir();
  blocSujets();
})(window.CI, window.CI_MODULES);
