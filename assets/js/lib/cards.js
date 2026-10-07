/* =========================================================================
   cards.js — revision par cartes, avec repetition espacee.

   Quatre formes de cartes, parce qu'on ne verifie pas de la meme facon
   qu'une definition est sue et qu'un pattern de code est compris :

     {type:"recto",  q, a}                     question / reponse, auto-evaluee
     {type:"qcm",    q, opts:[{t, ok, why}]}   une seule bonne reponse
     {type:"trous",  q, code, trous:[...]}     code a completer
     {type:"code",   q, opts:[{code, ok, why}]} choisir la bonne version

   Chaque carte porte un "tag" (le theme) et peut porter un "why" global.

   Planification : systeme de boites. Une carte ratee retombe en boite 0,
   une carte sue monte d'une boite, et l'intervalle grandit avec la boite.
   L'etat vit dans localStorage : il est propre au navigateur, ne suit pas
   d'un appareil a l'autre, et personne ne viendra te rappeler de reviser.
   ========================================================================= */
window.CI = window.CI || {};

(function (CI) {
  "use strict";

  var JOUR = 86400000;
  var INTERVALLES = [0, 1, 3, 7, 16, 35];   // en jours, par boite

  /* ------------------------------------------------ etat persistant */

  function charger(key) {
    try {
      return JSON.parse(window.localStorage.getItem(key)) || {};
    } catch (e) { return {}; }
  }

  function sauver(key, etat) {
    try { window.localStorage.setItem(key, JSON.stringify(etat)); } catch (e) { /* sans effet */ }
  }

  /** Identifiant stable d'une carte : son enonce suffit. */
  function idDe(carte) {
    var base = carte.q || carte.a || "";
    var h = 0;
    for (var i = 0; i < base.length; i++) {
      h = ((h << 5) - h + base.charCodeAt(i)) | 0;
    }
    return "c" + (h >>> 0).toString(36);
  }

  function due(etat, carte, maintenant) {
    var e = etat[idDe(carte)];
    if (!e) return true;                 // jamais vue
    return maintenant >= (e.du || 0);
  }

  function noter(etat, carte, reussi, maintenant) {
    var id = idDe(carte);
    var e = etat[id] || { boite: 0 };
    e.boite = reussi ? Math.min(e.boite + 1, INTERVALLES.length - 1) : 0;
    e.du = maintenant + INTERVALLES[e.boite] * JOUR;
    e.vue = maintenant;
    etat[id] = e;
    return e;
  }

  /* ------------------------------------------------ rendu d'une carte */

  function melange(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /**
   * Affiche une carte dans host. Appelle fini(reussi) quand le lecteur a
   * repondu — une seule fois par carte.
   */
  function afficher(host, carte, fini) {
    CI.clear(host);
    var repondu = false;
    function termine(ok) {
      if (repondu) return;
      repondu = true;
      fini(ok);
    }

    host.appendChild(CI.h("div", { "class": "card-tag", text: carte.tag || "" }));
    host.appendChild(CI.h("div", { "class": "card-q", html: carte.q || "" }));

    var zone = CI.h("div", { "class": "card-zone" });
    var retour = CI.h("div", { "class": "card-fb" });
    host.appendChild(zone);
    host.appendChild(retour);

    function dire(html, kind) {
      retour.className = "card-fb " + (kind || "");
      retour.innerHTML = html;
    }

    /* ---------------- recto / verso, auto-evalue ---------------- */
    if (carte.type === "recto") {
      var montrer = CI.h("button", { "class": "primary", text: "Montrer la réponse" });
      zone.appendChild(montrer);
      montrer.onclick = function () {
        CI.clear(zone);
        zone.appendChild(CI.h("div", { "class": "card-a", html: carte.a }));
        var notes = [
          { t: "Raté", ok: false }, { t: "Hésité", ok: false }, { t: "Su", ok: true }
        ].map(function (n) {
          var b = CI.h("button", { "class": n.ok ? "primary" : "", text: n.t });
          b.onclick = function () { termine(n.ok); };
          return b;
        });
        zone.appendChild(CI.h("div", { "class": "card-rate" }, notes));
        dire("Sois honnête : « hésité » compte comme raté, et c'est très bien — la carte reviendra plus tôt.");
      };
      return;
    }

    /* ---------------- choix multiple ---------------- */
    if (carte.type === "qcm") {
      var boutons = melange(carte.opts).map(function (o) {
        var b = CI.h("button", { "class": "card-opt", html: o.t });
        b.onclick = function () {
          if (repondu) return;
          b.className = "card-opt " + (o.ok ? "right" : "wrong");
          dire(o.why || (o.ok ? "Correct." : "Non."), o.ok ? "ok" : "ko");
          termine(o.ok);
        };
        return b;
      });
      zone.appendChild(CI.h("div", { "class": "card-opts" }, boutons));
      return;
    }

    /* ---------------- choisir la bonne version du code ---------------- */
    if (carte.type === "code") {
      var cartes = melange(carte.opts).map(function (o) {
        var pre = CI.h("pre", { "class": "codeblock", text: o.code });
        var b = CI.h("div", { "class": "card-codeopt", tabindex: "0", role: "button" }, [pre]);
        function choisir() {
          if (repondu) return;
          b.className = "card-codeopt " + (o.ok ? "right" : "wrong");
          dire(o.why, o.ok ? "ok" : "ko");
          termine(o.ok);
        }
        b.onclick = choisir;
        b.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choisir(); }
        });
        return b;
      });
      zone.appendChild(CI.h("div", { "class": "card-codeopts" }, cartes));
      return;
    }

    /* ---------------- code a trous ---------------- */
    if (carte.type === "trous") {
      var selects = [];
      var pre = CI.h("pre", { "class": "codeblock trous" });
      carte.code.forEach(function (ligne, n) {
        if (n) pre.appendChild(document.createTextNode("\n"));
        var morceaux = ligne.split(/(\{\d+\})/);
        morceaux.forEach(function (m) {
          var match = /^\{(\d+)\}$/.exec(m);
          if (!match) { pre.appendChild(document.createTextNode(m)); return; }
          var trou = carte.trous[+match[1]];
          var sel = CI.h("select", { "class": "trou" });
          sel.appendChild(CI.h("option", { value: "", text: "…" }));
          melange(trou.opts).forEach(function (o) {
            sel.appendChild(CI.h("option", { value: o, text: o }));
          });
          selects.push({ sel: sel, sol: trou.sol });
          pre.appendChild(sel);
        });
      });
      zone.appendChild(pre);

      var verif = CI.h("button", { "class": "primary", text: "Vérifier" });
      verif.onclick = function () {
        if (repondu) return;
        var tout = true;
        selects.forEach(function (s) {
          var ok = (s.sel.value === s.sol);
          s.sel.className = "trou " + (ok ? "right" : "wrong");
          if (!ok) { tout = false; s.sel.value = s.sol; }
        });
        verif.disabled = true;
        dire(tout ? (carte.why || "Tout juste.")
                  : "<strong>Les bonnes réponses sont rétablies ci-dessus.</strong> " + (carte.why || ""),
             tout ? "ok" : "ko");
        termine(tout);
      };
      zone.appendChild(CI.h("div", { "class": "card-rate" }, [verif]));
      return;
    }

    dire("Type de carte inconnu : " + carte.type, "ko");
    termine(false);
  }

  /* ------------------------------------------------ la session */

  /**
   * CI.Deck({ key, cartes, els:{ host, meta, foot, suivant, relancer } })
   * La page fournit les conteneurs ; le deck s'occupe du reste.
   */
  CI.Deck = function (cfg) {
    var etat = charger(cfg.key);
    var file = [], pos = 0, score = { su: 0, rate: 0 };
    var tout = false;

    function compter() {
      var now = Date.now(), d = 0, neuves = 0;
      cfg.cartes.forEach(function (c) {
        if (!etat[idDe(c)]) neuves++;
        else if (due(etat, c, now)) d++;
      });
      return { dues: d, neuves: neuves, total: cfg.cartes.length };
    }

    function majMeta() {
      var n = compter();
      CI.clear(CI.el(cfg.els.meta));
      [
        { t: "à revoir", v: n.dues },
        { t: "jamais vues", v: n.neuves },
        { t: "dans le paquet", v: n.total }
      ].forEach(function (it) {
        CI.el(cfg.els.meta).appendChild(CI.h("div", {}, [
          CI.h("span", { "class": "t", text: it.t }),
          CI.h("span", { "class": "v", text: String(it.v) })
        ]));
      });
    }

    function demarrer(toutLePaquet) {
      tout = !!toutLePaquet;
      var now = Date.now();
      file = melange(cfg.cartes.filter(function (c) {
        return tout || due(etat, c, now);
      }));
      pos = 0; score = { su: 0, rate: 0 };
      suite();
    }

    function suite() {
      var host = CI.el(cfg.els.host);
      var foot = CI.clear(CI.el(cfg.els.foot));

      if (!file.length) {
        CI.clear(host).appendChild(CI.h("div", { "class": "done-screen" }, [
          CI.h("div", { "class": "big", text: "✓" }),
          CI.h("p", { "class": "say", text: "Rien à revoir pour l'instant. Reviens plus tard, ou reprends tout le paquet." })
        ]));
        var b0 = CI.h("button", { "class": "primary", text: "Réviser tout le paquet" });
        b0.onclick = function () { demarrer(true); };
        foot.appendChild(b0);
        majMeta();
        return;
      }

      if (pos >= file.length) {
        CI.clear(host).appendChild(CI.h("div", { "class": "done-screen" }, [
          CI.h("div", { "class": "big", text: score.rate ? "·" : "✓" }),
          CI.h("p", { "class": "say", html: "<strong>" + score.su + "</strong> sue" +
            (score.su > 1 ? "s" : "") + ", <strong>" + score.rate + "</strong> à revoir." }),
          CI.h("p", { "class": "say", text: score.rate
            ? "Les cartes ratées reviennent dès ta prochaine session."
            : "Tout est juste. Les prochaines échéances sont plus lointaines." })
        ]));
        var b1 = CI.h("button", { "class": "primary", text: "Nouvelle session" });
        b1.onclick = function () { demarrer(false); };
        foot.appendChild(b1);
        majMeta();
        return;
      }

      var carte = file[pos];
      afficher(host, carte, function (reussi) {
        noter(etat, carte, reussi, Date.now());
        sauver(cfg.key, etat);
        score[reussi ? "su" : "rate"]++;
        if (!reussi) file.push(carte);        // une carte ratee repasse en fin de session
        var b = CI.h("button", { "class": "primary", text: "Suivante ▶" });
        b.onclick = function () { pos++; suite(); };
        CI.clear(CI.el(cfg.els.foot)).appendChild(b);
        b.focus();
      });

      CI.el(cfg.els.progress).textContent = (pos + 1) + " / " + file.length;
    }

    if (cfg.els.relancer) {
      CI.el(cfg.els.relancer).onclick = function () {
        if (!window.confirm("Remettre tout le paquet à zéro ? Les échéances seront perdues.")) return;
        etat = {};
        sauver(cfg.key, etat);
        demarrer(false);
      };
    }

    majMeta();
    demarrer(false);
    return { demarrer: demarrer };
  };

  // points d'accroche pour les tests automatises, pas une API publique
  CI.__cardsInternals = { idDe: idDe, noter: noter, due: due, afficher: afficher,
                          INTERVALLES: INTERVALLES };
})(window.CI);
