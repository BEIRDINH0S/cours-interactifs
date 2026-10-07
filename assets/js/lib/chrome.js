/* =========================================================================
   chrome.js — la navigation commune a tout le site.

   Deux etages :
     - une barre haute : la marque, le selecteur de sujet, le theme
     - une barre de sujet : les pages du sujet courant, avec l'avancement

   Rien a configurer par page : le sujet et la page courante se deduisent
   de l'URL, et les pages d'un sujet sont lues dans modules.js.

   S'insere en tete de <body> ; a charger apres core.js et modules.js.
   ========================================================================= */
window.CI = window.CI || {};

(function (CI) {
  "use strict";

  /* ------------------------------------------------ ou sommes-nous */

  function contexte() {
    var chemin = window.location.pathname;
    var m = /\/modules\/([^/]+)\/([^/]*)$/.exec(chemin);
    return {
      racine: m ? "../../" : "",
      slug: m ? m[1] : null,
      fichier: m ? (m[2] || "index.html") : (chemin.split("/").pop() || "index.html")
    };
  }

  /* ------------------------------------------------ avancement */

  function lire(cle) {
    try { return window.localStorage.getItem(cle); } catch (e) { return null; }
  }

  /** « 4/10 » pour une lecon entamee, rien sinon. */
  function avancementLecon(href) {
    var nom = href.split("/").pop().replace(/\.html$/, "");
    var cle = nom.replace(/^lecon-/, "lecon-") + "-progres";
    var pos = parseInt(lire(cle), 10);
    var total = parseInt(lire(cle + "-total"), 10);
    if (isNaN(pos) || isNaN(total)) return null;
    return (pos + 1) + "/" + total;
  }

  /** Nombre de cartes a revoir maintenant, nouvelles comprises. */
  function cartesDues(slug) {
    var cle = "cartes-" + slug;
    var total = parseInt(lire(cle + "-total"), 10);
    if (isNaN(total)) return null;
    var etat;
    try { etat = JSON.parse(lire(cle)) || {}; } catch (e) { etat = {}; }
    var vues = Object.keys(etat), now = Date.now(), dues = 0;
    vues.forEach(function (id) { if (now >= (etat[id].du || 0)) dues++; });
    dues += Math.max(0, total - vues.length);     // jamais vues = a revoir
    return dues;
  }

  /* ------------------------------------------------ theme */

  function themeInitial() {
    var t = lire("theme");
    if (t === "clair" || t === "sombre") return t;
    return "systeme";
  }

  function appliquerTheme(t) {
    var root = document.documentElement;
    if (t === "clair") root.setAttribute("data-theme", "light");
    else if (t === "sombre") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    try { window.localStorage.setItem("theme", t); } catch (e) { /* sans effet */ }
  }

  /* ------------------------------------------------ construction */

  CI.chrome = function () {
    var ctx = contexte();
    var sujets = window.CI_MODULES || [];
    var sujet = null;
    sujets.forEach(function (s) { if (s.slug === ctx.slug) sujet = s; });

    /* --- barre haute --- */
    var marque = CI.h("a", { "class": "brand", href: ctx.racine + "index.html" }, [
      CI.h("span", { "class": "mark", text: "◆" }),
      CI.h("span", { text: "Manipuler" })
    ]);

    var liens = CI.h("nav", { "class": "nav-links" });
    liens.appendChild(CI.h("a", {
      "class": ctx.slug ? "" : "cur",
      href: ctx.racine + "index.html",
      text: "Tous les sujets"
    }));

    // selecteur de sujet : un <details>, donc sans dependance ni script d'ouverture
    var menu = CI.h("div", { "class": "menu" });
    sujets.forEach(function (s) {
      var vivant = s.statut === "vivant";
      menu.appendChild(CI.h("a", {
        "class": (s.slug === ctx.slug ? "cur " : "") + (vivant ? "" : "muted"),
        href: ctx.racine + s.href
      }, [
        CI.h("span", { "class": "t", text: s.titre }),
        CI.h("span", { "class": "k", text: vivant ? s.cadre : "chantier" })
      ]));
    });
    var choix = CI.h("details", { "class": "switch" }, [
      CI.h("summary", { text: sujet ? sujet.titre : "Choisir un sujet" }),
      menu
    ]);
    liens.appendChild(choix);

    var bouton = CI.h("button", { "class": "theme", "aria-label": "Changer de thème" });
    var modes = ["systeme", "clair", "sombre"];
    var symboles = { systeme: "◐", clair: "☀", sombre: "☾" };
    var mode = themeInitial();
    function majTheme() {
      appliquerTheme(mode);
      bouton.textContent = symboles[mode];
      bouton.title = "Thème : " + mode;
    }
    bouton.onclick = function () {
      mode = modes[(modes.indexOf(mode) + 1) % modes.length];
      majTheme();
    };
    majTheme();

    var haut = CI.h("div", { "class": "nav-in" }, [marque, liens, bouton]);
    var barre = CI.h("div", { "class": "nav" }, [haut]);

    /* --- barre du sujet --- */
    if (sujet) {
      var sous = CI.h("nav", { "class": "subnav" });
      var entrees = [{ titre: "Aperçu", href: sujet.href }].concat(sujet.pages || []);
      entrees.forEach(function (p) {
        var fichier = p.href.split("/").pop();
        var badge = null;
        if (/^lecon-/.test(fichier)) {
          var av = avancementLecon(fichier);
          if (av) badge = av;
        } else if (fichier === "revision.html") {
          var d = cartesDues(sujet.slug);
          if (d) badge = String(d);
        }
        var a = CI.h("a", {
          "class": fichier === ctx.fichier ? "cur" : "",
          href: fichier
        }, [CI.h("span", { text: p.titre })]);
        if (badge) a.appendChild(CI.h("span", { "class": "badge", text: badge }));
        sous.appendChild(a);
      });
      barre.appendChild(CI.h("div", { "class": "subnav-in" }, [sous]));
    }

    document.body.insertBefore(barre, document.body.firstChild);

    // un clic ailleurs referme le selecteur
    document.addEventListener("click", function (e) {
      if (choix.open && !choix.contains(e.target)) choix.open = false;
    });
  };

  // auto-demarrage : aucune page n'a besoin d'appeler quoi que ce soit
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", CI.chrome);
  } else {
    CI.chrome();
  }
})(window.CI);
