/* =========================================================================
   hub.js — construit la page d'accueil a partir de modules.js.
   ========================================================================= */
(function (CI, MODULES) {
  "use strict";

  var target = CI.el("modules");
  if (!target || !MODULES) return;

  MODULES.forEach(function (m) {
    var vivant = m.statut === "vivant";

    var meta = CI.h("div", { "class": "meta" });
    meta.appendChild(CI.h("span", {
      "class": "pill " + (vivant ? "live" : "wip"),
      text: vivant ? "utilisable" : "chantier"
    }));
    (m.seances || []).forEach(function (s) {
      meta.appendChild(CI.h("span", { "class": "pill", text: s }));
    });

    var card = CI.h("a", {
      "class": "linkcard" + (vivant ? "" : " muted"),
      href: m.href
    }, [
      CI.h("div", { "class": "k", text: m.cadre }),
      CI.h("div", { "class": "t", text: m.titre }),
      CI.h("div", { "class": "d", text: m.resume }),
      meta
    ]);

    target.appendChild(card);
  });
})(window.CI, window.CI_MODULES);
