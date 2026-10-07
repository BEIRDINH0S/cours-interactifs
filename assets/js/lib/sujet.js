/* =========================================================================
   sujet.js — le parcours d'un sujet.

   Les pages d'un sujet ne sont pas interchangeables : on fait la lecon,
   puis on va voir l'implementation, puis on revise. C'est une sequence,
   donc elle se dessine comme un chemin, avec l'etat de chaque etape.

   La page du sujet n'a qu'a fournir un conteneur #parcours.
   ========================================================================= */
window.CI = window.CI || {};

(function (CI) {
  "use strict";

  var ROLES = {
    lecon: "Leçon",
    atelier: "Atelier",
    revision: "Révision"
  };

  CI.parcours = function () {
    var hote = CI.el("parcours");
    if (!hote || !window.CI_MODULES) return;

    var slug = (/\/modules\/([^/]+)\//.exec(window.location.pathname) || [])[1];
    var sujet = null;
    window.CI_MODULES.forEach(function (s) { if (s.slug === slug) sujet = s; });
    if (!sujet) return;

    var P = CI.progres;

    (sujet.pages || []).forEach(function (page) {
      var e = P.page(sujet, page);

      var pastille = CI.h("span", {
        "class": "noeud " + e.etat,
        "aria-hidden": "true"
      });

      var action = CI.h("a", {
        "class": "bouton mince",
        href: page.href.split("/").pop(),
        text: e.etat === "encours" ? "Reprendre"
            : e.etat === "fini" ? "Revoir"
            : page.type === "revision" ? "Réviser" : "Commencer"
      });

      var meta = CI.h("div", { "class": "etape-meta" }, [
        CI.h("span", { "class": "role", text: ROLES[page.type] || "Page" }),
        CI.h("span", { "class": "etat " + e.etat, text: e.libelle })
      ]);

      hote.appendChild(CI.h("div", { "class": "etape" }, [
        pastille,
        CI.h("div", { "class": "etape-corps" }, [
          CI.h("h3", { text: page.titre }),
          CI.h("p", { text: page.resume }),
          meta
        ]),
        CI.h("div", { "class": "etape-action" }, [action])
      ]));
    });

    (sujet.aVenir || []).forEach(function (titre) {
      hote.appendChild(CI.h("div", { "class": "etape avenir" }, [
        CI.h("span", { "class": "noeud avenir", "aria-hidden": "true" }),
        CI.h("div", { "class": "etape-corps" }, [
          CI.h("h3", { text: titre }),
          CI.h("p", { text: "Pas encore écrite." })
        ]),
        CI.h("div", { "class": "etape-action" })
      ]));
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", CI.parcours);
  } else {
    CI.parcours();
  }
})(window.CI);
